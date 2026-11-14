import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Bot,
  Check,
  Clock,
  Copy,
  Dices,
  Flag,
  KeyRound,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  Users,
  X,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_LUDO_RULESET_OPTIONS,
  LudoColor,
  LudoDifficulty,
  LudoMatchState,
  LudoPlayerCount,
  LudoRulesetOptions,
  createLudoMatchState,
} from '@nova/game-ludo';
import { api } from '../../services/api';
import { getGameSocket } from '../../services/socket';
import { useAuthStore } from '../../stores/authStore';
import { useI18nStore } from '../../stores/i18nStore';
import { useWalletStore } from '../../stores/walletStore';
import {
  DEFAULT_LUDO_SETTINGS,
  LudoPlayerConfig,
  LudoScreen,
  LudoUiSettings,
} from './types';
import { SplashScreen } from './screens/SplashScreen';
import { SetupScreen } from './screens/SetupScreen';
import { GameScreen } from './screens/GameScreen';
import { RulesModal } from './components/Dialogs/RulesModal';
import { SettingsModal } from './components/Dialogs/SettingsModal';

const SAVED_MATCH_KEY = 'nova_ludo_saved_match';
const SAVED_SETTINGS_KEY = 'nova_ludo_settings';

export const LudoPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const t = useI18nStore((s) => s.t);
  const lt = (t as any).ludo || {};
  const [searchParams, setSearchParams] = useSearchParams();

  // Screen state
  const [currentScreen, setCurrentScreen] = useState<LudoScreen>('SPLASH');
  const [setupMode, setSetupMode] = useState<'AI' | 'LOCAL'>('LOCAL');

  // UI Settings state with local storage persistence
  const [settings, setSettings] = useState<LudoUiSettings>(() => {
    try {
      const saved = localStorage.getItem(SAVED_SETTINGS_KEY);
      return saved ? { ...DEFAULT_LUDO_SETTINGS, ...JSON.parse(saved) } : DEFAULT_LUDO_SETTINGS;
    } catch {
      return DEFAULT_LUDO_SETTINGS;
    }
  });

  const updateSettings = (partial: Partial<LudoUiSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(SAVED_SETTINGS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Saved match state in localStorage
  const [hasSavedMatch, setHasSavedMatch] = useState(() => {
    try {
      return Boolean(localStorage.getItem(SAVED_MATCH_KEY));
    } catch {
      return false;
    }
  });

  // Active Game State
  const [gameState, setGameState] = useState<LudoMatchState | null>(null);
  const [activePlayerConfigs, setActivePlayerConfigs] = useState<
    Record<number, LudoPlayerConfig>
  >({});

  // Online Multiplayer (PvP) states
  const [onlineLobbyActive, setOnlineLobbyActive] = useState(false);
  const [playerCount, setPlayerCount] = useState<LudoPlayerCount>(2);
  const [stakeEtb, setStakeEtb] = useState<number>(0);
  const [joinCode, setJoinCode] = useState('');
  const [clientSeedInput, setClientSeedInput] = useState(() =>
    Math.random().toString(36).slice(2, 12)
  );
  const [lobbyConfig, setLobbyConfig] = useState<any>(null);
  const [waitingRooms, setWaitingRooms] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingLobby, setLoadingLobby] = useState(false);
  const [pvpRoom, setPvpRoom] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [verifyData, setVerifyData] = useState<any>(null);
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  // Global Dialog states from splash
  const [rulesOpen, setRulesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const autoJoinRef = useRef<string | null>(null);
  const walletBalance = useWalletStore((s) => s.balance);
  const fetchWallet = useWalletStore((s) => s.fetchWallet);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Load online lobby rooms & past matches
  const loadLobby = useCallback(async () => {
    setLoadingLobby(true);
    try {
      const [lobbyRes, histRes] = await Promise.all([
        api.get('/ludo/lobby').catch(() => null),
        isAuthenticated ? api.get('/ludo/history').catch(() => null) : Promise.resolve(null),
      ]);
      if (lobbyRes?.data?.data) {
        setLobbyConfig(lobbyRes.data.data.config || null);
        setWaitingRooms(lobbyRes.data.data.rooms || []);
      }
      if (histRes?.data?.data) {
        setHistory(histRes.data.data || []);
      }
    } finally {
      setLoadingLobby(false);
    }
  }, [isAuthenticated]);

  // Online multiplayer socket listeners
  useEffect(() => {
    const socket = getGameSocket();
    const onConnect = () => {
      const token = localStorage.getItem('nova_token');
      if (token) socket.emit('WALLET_SUBSCRIBE', { token });
    };
    const onSync = (view: any) => {
      if (!view) return;
      setPvpRoom(view);
      setOnlineLobbyActive(true);
      setErrorMsg(null);
    };
    const onErr = (err: { message?: string }) => {
      setErrorMsg(err?.message || 'Ludo action error.');
    };

    socket.on('connect', onConnect);
    socket.on('ludo:state-sync', onSync);
    socket.on('ludo:error', onErr);
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('ludo:state-sync', onSync);
      socket.off('ludo:error', onErr);
    };
  }, []);

  // Check URL room param for quick join
  useEffect(() => {
    const roomParam = searchParams.get('room');
    if (roomParam && isAuthenticated && autoJoinRef.current !== roomParam) {
      autoJoinRef.current = roomParam;
      api
        .post('/ludo/rooms/join', { roomCode: roomParam, clientSeed: clientSeedInput })
        .then((res) => {
          if (res.data?.data) {
            setPvpRoom(res.data.data);
            setOnlineLobbyActive(true);
            getGameSocket().emit('ludo:sync-room', { roomId: res.data.data.roomId });
          }
        })
        .catch((err) => setErrorMsg(err?.response?.data?.error || 'Could not join Ludo room.'));
    }
  }, [isAuthenticated, searchParams, clientSeedInput]);

  // Handle Match Start
  const handleStartGame = (
    count: LudoPlayerCount,
    configs: Record<number, LudoPlayerConfig>,
    rules: LudoRulesetOptions
  ) => {
    const players = Array.from({ length: count }, (_, idx) => ({
      userId: `p-${idx + 1}`,
      username: configs[idx + 1]?.name || `Player ${idx + 1}`,
    }));

    const newState = createLudoMatchState(players, 1, rules);
    setGameState(newState);
    setActivePlayerConfigs(configs);
    setCurrentScreen('GAME');
    saveMatchLocally(newState, configs);
  };

  // Local storage persistence
  const saveMatchLocally = (
    st: LudoMatchState,
    configs: Record<number, LudoPlayerConfig>
  ) => {
    try {
      localStorage.setItem(
        SAVED_MATCH_KEY,
        JSON.stringify({ state: st, configs, timestamp: Date.now() })
      );
      setHasSavedMatch(true);
    } catch {}
  };

  const handleResumeGame = () => {
    try {
      const saved = localStorage.getItem(SAVED_MATCH_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.state && parsed?.configs) {
          setGameState(parsed.state);
          setActivePlayerConfigs(parsed.configs);
          setCurrentScreen('GAME');
          return;
        }
      }
    } catch {}
    setHasSavedMatch(false);
  };

  const handleRestartMatch = () => {
    if (!gameState) return;
    const players = gameState.seats.map((s) => ({
      userId: s.userId,
      username: s.username,
    }));
    const freshState = createLudoMatchState(players, 1, gameState.rulesetOptions);
    setGameState(freshState);
    saveMatchLocally(freshState, activePlayerConfigs);
  };

  const handleQuitToHome = () => {
    try {
      localStorage.removeItem(SAVED_MATCH_KEY);
    } catch {}
    setHasSavedMatch(false);
    setGameState(null);
    setOnlineLobbyActive(false);
    setPvpRoom(null);
    setCurrentScreen('SPLASH');
  };

  // Online Quick Match
  const handleQuickMatch = async () => {
    setErrorMsg(null);
    if (!isAuthenticated) {
      setErrorMsg('Please sign in to join multiplayer Ludo.');
      return;
    }
    try {
      const res = await api.post('/ludo/quick-match', {
        playerCount,
        stakeEtb,
        clientSeed: clientSeedInput,
      });
      if (res.data?.data) {
        setPvpRoom(res.data.data);
        setOnlineLobbyActive(true);
        getGameSocket().emit('ludo:sync-room', { roomId: res.data.data.roomId });
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Could not start Quick Match.');
    }
  };

  const handleCreatePrivate = async () => {
    setErrorMsg(null);
    if (!isAuthenticated) {
      setErrorMsg('Please sign in to create a Ludo room.');
      return;
    }
    try {
      const res = await api.post('/ludo/rooms', {
        playerCount,
        stakeEtb,
        clientSeed: clientSeedInput,
      });
      if (res.data?.data) {
        setPvpRoom(res.data.data);
        setOnlineLobbyActive(true);
        getGameSocket().emit('ludo:sync-room', { roomId: res.data.data.roomId });
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Could not create room.');
    }
  };

  const handleJoinPrivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !isAuthenticated) return;
    try {
      const res = await api.post('/ludo/rooms/join', {
        roomCode: joinCode.trim().toUpperCase(),
        clientSeed: clientSeedInput,
      });
      if (res.data?.data) {
        setPvpRoom(res.data.data);
        setOnlineLobbyActive(true);
        getGameSocket().emit('ludo:sync-room', { roomId: res.data.data.roomId });
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Room not found.');
    }
  };

  // =========================================================================
  // RENDER SCREEN 1: SPLASH / HOME
  // =========================================================================
  if (currentScreen === 'SPLASH' && !onlineLobbyActive) {
    return (
      <>
        <SplashScreen
          hasSavedGame={hasSavedMatch}
          theme={settings.theme}
          language={settings.language}
          onResumeGame={handleResumeGame}
          onPlayVsAi={() => {
            setSetupMode('AI');
            setCurrentScreen('SETUP');
          }}
          onPassAndPlay={() => {
            setSetupMode('LOCAL');
            setCurrentScreen('SETUP');
          }}
          onOnlinePvP={() => {
            setOnlineLobbyActive(true);
            loadLobby();
          }}
          onOpenRules={() => setRulesOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <RulesModal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />
        <SettingsModal
          isOpen={settingsOpen}
          settings={settings}
          onUpdateSettings={updateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      </>
    );
  }

  // =========================================================================
  // RENDER SCREEN 2: GAME SETUP
  // =========================================================================
  if (currentScreen === 'SETUP' && !onlineLobbyActive) {
    return (
      <SetupScreen
        initialPlayerCount={2}
        initialMode={setupMode}
        theme={settings.theme}
        language={settings.language}
        onBack={() => setCurrentScreen('SPLASH')}
        onStartGame={handleStartGame}
      />
    );
  }

  // =========================================================================
  // RENDER SCREEN 3: GAME SCREEN (ACTIVE MATCH)
  // =========================================================================
  if (currentScreen === 'GAME' && gameState && !onlineLobbyActive) {
    return (
      <GameScreen
        initialState={gameState}
        playerConfigs={activePlayerConfigs}
        settings={settings}
        userBalance={walletBalance > 0 ? walletBalance : 10400}
        stakeEtb={stakeEtb}
        onUpdateSettings={updateSettings}
        onSaveMatchState={(st) => saveMatchLocally(st, activePlayerConfigs)}
        onRestartMatch={handleRestartMatch}
        onQuitToHome={handleQuitToHome}
      />
    );
  }

  // =========================================================================
  // ONLINE MULTIPLAYER VIEW (ROOM / LOBBY)
  // =========================================================================
  if (pvpRoom?.status === 'WAITING') {
    const copyLink = async () => {
      const link = `${window.location.origin}/games/ludo?room=${pvpRoom.roomCode}`;
      await navigator.clipboard?.writeText(link);
      setCopiedRoom(true);
      setTimeout(() => setCopiedRoom(false), 2000);
    };

    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="rounded-3xl bg-[#1B2A41] border border-[#1E88E5]/40 p-6 text-center space-y-4 shadow-2xl">
          <Clock className="w-10 h-10 text-[#1E88E5] mx-auto animate-pulse" />
          <h2 className="text-xl font-black text-white">
            Waiting for Opponents ({pvpRoom.players?.length || 1}/{pvpRoom.playerCount})
          </h2>
          <div className="rounded-2xl bg-[#141F38] p-4 space-y-2 border border-white/10">
            <div className="text-2xl font-mono font-black text-[#FDD835] tracking-widest">
              {pvpRoom.roomCode}
            </div>
            <button
              type="button"
              onClick={copyLink}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer shadow hover:bg-slate-700"
            >
              {copiedRoom ? <Check className="w-3.5 h-3.5 text-[#43A047]" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedRoom ? 'Copied Room Link!' : 'Copy Room Link'}
            </button>
          </div>
          <button
            type="button"
            onClick={handleQuitToHome}
            className="px-5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold cursor-pointer"
          >
            Leave &amp; Refund Room
          </button>
        </div>
      </div>
    );
  }

  // Online Lobby Room Browser
  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="rounded-3xl bg-[#1B2A41] border border-white/10 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold">
            <Dices className="w-3.5 h-3.5" /> Provably Fair Multiplayer
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            NOVA Ludo Online
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Real-time multiplayer board with verifiable dice rolls
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOnlineLobbyActive(false)}
          className="px-4 py-2.5 rounded-xl bg-[#141F38] hover:bg-slate-800 border border-white/10 text-xs font-bold text-slate-200 cursor-pointer"
        >
          ← Back to Main Menu
        </button>
      </div>

      {errorMsg && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-xs font-semibold text-rose-300">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 rounded-3xl bg-[#1B2A41] border border-white/10 p-5 space-y-4 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400 block">
                Player Count
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([2, 3, 4] as LudoPlayerCount[]).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setPlayerCount(cnt)}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      playerCount === cnt
                        ? 'bg-[#1E88E5] text-white border-[#1E88E5]'
                        : 'bg-[#141F38] border-white/10 text-slate-400'
                    }`}
                  >
                    {cnt} Players
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400 block">
                Entry Fee (ETB)
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 10, 50, 100].map((fee) => (
                  <button
                    key={fee}
                    type="button"
                    onClick={() => setStakeEtb(fee)}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      stakeEtb === fee
                        ? 'bg-[#43A047] text-white border-[#43A047]'
                        : 'bg-[#141F38] border-white/10 text-slate-400'
                    }`}
                  >
                    {fee === 0 ? 'Free' : `${fee}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleQuickMatch}
              className="py-3 px-4 rounded-2xl bg-[#43A047] hover:bg-[#388E3C] text-white text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Zap className="w-4 h-4" /> Quick Match ({playerCount}P)
            </button>
            <button
              type="button"
              onClick={handleCreatePrivate}
              className="py-3 px-4 rounded-2xl bg-[#1E88E5] hover:bg-[#1976D2] text-white text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <UserPlus className="w-4 h-4" /> Create Private Room
            </button>
          </div>

          <form onSubmit={handleJoinPrivate} className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter Room Code (e.g. LD-4A9F)"
                className="w-full bg-[#141F38] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white"
              />
            </div>
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="px-4 py-2 rounded-xl bg-[#FDD835] hover:bg-[#FBC02D] disabled:opacity-40 text-slate-950 text-xs font-bold cursor-pointer"
            >
              Join Room
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-[#1B2A41] border border-white/10 p-5 space-y-3 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" /> Open Ludo Rooms
          </h3>
          {waitingRooms.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#141F38] text-center text-xs text-slate-400">
              No open rooms currently. Create one to play with friends!
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {waitingRooms.map((r) => (
                <div
                  key={r.roomId}
                  className="p-3 rounded-2xl bg-[#141F38] border border-white/10 flex items-center justify-between text-xs"
                >
                  <span className="font-mono font-bold text-amber-300">{r.roomCode}</span>
                  <span className="text-white font-bold">{r.playerCount}P</span>
                  <button
                    type="button"
                    onClick={() =>
                      api
                        .post('/ludo/rooms/join', { roomId: r.roomId, clientSeed: clientSeedInput })
                        .then((res) => {
                          if (res.data?.data) {
                            setPvpRoom(res.data.data);
                            getGameSocket().emit('ludo:sync-room', { roomId: res.data.data.roomId });
                          }
                        })
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#1E88E5] text-white font-bold"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
