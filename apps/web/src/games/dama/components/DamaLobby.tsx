import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useWalletStore } from '../../../stores/walletStore';
import { useAuthStore } from '../../../stores/authStore';
import { useI18nStore } from '../../../stores/i18nStore';
import { DamaReplayModal } from './DamaReplayModal';
import {
  Swords,
  Bot,
  PlusCircle,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Coins,
  CheckCircle2,
  Users,
  Copy,
  Lock,
  History,
  Trash2,
  Trophy,
  Play,
  Clock,
} from 'lucide-react';

interface DamaLobbyProps {
  onStartPractice: (difficulty: 'easy' | 'medium' | 'hard') => void;
  onJoinMatch: (matchId: string) => Promise<void>;
  onCreateMatch: (stakeMinor: bigint, isPrivate: boolean) => Promise<{ id: string; inviteCode?: string }>;
  onJoinByCode: (code: string) => Promise<void>;
}

export const DamaLobby: React.FC<DamaLobbyProps> = ({
  onStartPractice,
  onJoinMatch,
  onCreateMatch,
  onJoinByCode,
}) => {
  const { balance } = useWalletStore();
  const { user } = useAuthStore();
  const { t } = useI18nStore();

  const currentUserId = user?.id || 'demo-guest';

  const [activeTab, setActiveTab] = useState<'pvp' | 'practice' | 'history'>('pvp');
  const [stakeEtb, setStakeEtb] = useState<number>(0); // Default to Free Play (Stage A)
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [inviteCodeInput, setInviteCodeInput] = useState<string>('');
  const [lobbyMatches, setLobbyMatches] = useState<any[]>([]);
  const [isLoadingLobby, setIsLoadingLobby] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [joiningMatchId, setJoiningMatchId] = useState<string | null>(null);
  const [cancellingMatchId, setCancellingMatchId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [practiceDifficulty, setPracticeDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Match History & Replay State
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [selectedReplayMatch, setSelectedReplayMatch] = useState<any | null>(null);

  // Financial calculations
  const isFreePlay = stakeEtb === 0;
  const stakeMinor = BigInt(Math.max(0, Math.round(stakeEtb * 100)));
  const totalPotEtb = stakeEtb * 2;
  const rakeEtb = isFreePlay ? 0 : totalPotEtb * 0.05;
  const winnerPayoutEtb = isFreePlay ? 0 : totalPotEtb - rakeEtb;

  const quickStakes = [0, 10, 25, 50, 100, 250];

  const fetchLobby = async () => {
    setIsLoadingLobby(true);
    try {
      const res = await api.get('/matches/lobby');
      if (res.data?.success) {
        setLobbyMatches(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch lobby:', err);
    } finally {
      setIsLoadingLobby(false);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.get('/matches/user/history?page=1&limit=20');
      if (res.data?.success) {
        setMatchHistory(res.data.data.matches || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch match history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pvp') {
      fetchLobby();
      const interval = setInterval(fetchLobby, 4000);
      return () => clearInterval(interval);
    } else if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleCreate = async () => {
    setErrorMsg(null);
    if (!isFreePlay && stakeEtb < 10) {
      setErrorMsg('Minimum paid stake is 10.00 ETB (or select 0 for Free Play)');
      return;
    }
    if (stakeEtb > 5000) {
      setErrorMsg('Maximum stake is 5,000.00 ETB');
      return;
    }
    if (!isFreePlay && balance < stakeEtb) {
      setErrorMsg('Insufficient wallet balance to create this challenge');
      return;
    }

    setIsCreating(true);
    try {
      const res = await onCreateMatch(stakeMinor, isPrivate);
      if (res.inviteCode) {
        setCreatedInviteCode(res.inviteCode);
      }
      fetchLobby();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to create challenge');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelChallenge = async (matchId: string) => {
    setErrorMsg(null);
    setCancellingMatchId(matchId);
    try {
      await api.post(`/matches/${matchId}/cancel`);
      fetchLobby();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to cancel challenge');
    } finally {
      setCancellingMatchId(null);
    }
  };

  const handleJoinByCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    setErrorMsg(null);
    try {
      await onJoinByCode(inviteCodeInput.trim().toUpperCase());
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to join challenge by code');
    }
  };

  const handleJoinClick = async (matchId: string) => {
    setErrorMsg(null);
    setJoiningMatchId(matchId);
    try {
      await onJoinMatch(matchId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to join challenge');
    } finally {
      setJoiningMatchId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 p-4 sm:p-8 border-2 border-amber-500/30 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2">
              <Swords className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {t.games.dama.pvpTitle}
            </div>
            <h1 className="text-xl sm:text-4xl font-black text-white tracking-tight">
              {t.games.dama.title}
            </h1>
            <p className="text-xs sm:text-base text-stone-300 mt-0.5 sm:mt-1 max-w-xl">
              {t.games.dama.subtitle}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="w-full md:w-auto grid grid-cols-3 sm:flex bg-stone-950/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-stone-800 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('pvp')}
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[36px] ${
                activeTab === 'pvp'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950 shadow-lg font-black'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">{t.games.dama.pvpTitle}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('practice')}
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[36px] ${
                activeTab === 'practice'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950 shadow-lg font-black'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">{t.games.dama.practiceTitle}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all min-h-[36px] ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950 shadow-lg font-black'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">History & Replay</span>
              <span className="sm:hidden">History</span>
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-sm">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab 1: Free Practice vs Computer */}
      {activeTab === 'practice' && (
        <div className="bg-stone-900/90 border border-amber-600/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">{t.games.dama.practiceTitle}</h2>
              <p className="text-xs sm:text-sm text-stone-400">
                100% Free • Zero wallet risk • Practice tactics against the computer
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 sm:mb-3">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setPracticeDifficulty(diff)}
                  className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl border text-xs sm:text-sm font-bold capitalize transition-all min-h-[42px] touch-manipulation ${
                    practiceDifficulty === diff
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-lg shadow-amber-500/20 font-black'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  {diff === 'easy' ? t.games.dama.easy : diff === 'medium' ? t.games.dama.medium : t.games.dama.hard}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStartPractice(practiceDifficulty)}
            className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm sm:text-base uppercase tracking-wider shadow-xl transition-transform active:scale-[0.98] flex items-center justify-center gap-2 min-h-[46px] touch-manipulation"
          >
            <Bot className="w-5 h-5" />
            Start Free Practice
          </button>
        </div>
      )}

      {/* Tab 2: Match History & Replay */}
      {activeTab === 'history' && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <History className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Your Match History</h2>
                <p className="text-xs text-stone-400">Review past games and watch step-by-step replays</p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchHistory}
              disabled={isLoadingHistory}
              className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {matchHistory.length === 0 ? (
              <div className="text-center py-10 sm:py-12 text-stone-500 text-xs sm:text-sm">
                No past matches found. Complete an online match to review your replay!
              </div>
            ) : (
              matchHistory.map((m) => (
                <div
                  key={m.id}
                  className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-stone-950 border border-stone-800 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                        m.isWinner
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : m.isDraw
                          ? 'bg-stone-800 text-stone-300'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {m.isWinner ? 'WIN' : m.isDraw ? 'DRAW' : 'LOSS'}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-white">
                          vs. {m.opponent?.username || 'Opponent'}
                        </span>
                        {m.isFreePlay ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            Free
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400">
                            {m.stakeEtb} ETB
                          </span>
                        )}
                        <span className="text-[10px] text-stone-500">v{m.rulesetVersion}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-stone-400 mt-0.5">
                        <span>Color: {m.playerColor === 'W' ? 'White' : 'Black'}</span>
                        <span>•</span>
                        <span>{m.moveCount} Plies</span>
                        {m.durationSeconds > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.floor(m.durationSeconds / 60)}m {m.durationSeconds % 60}s
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedReplayMatch(m)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors min-h-[38px] touch-manipulation"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Watch Replay
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: PvP Matchmaking & Challenges */}
      {activeTab === 'pvp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Column: Create Challenge */}
          <div className="lg:col-span-6 bg-stone-900/90 border border-amber-600/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                {t.games.dama.createChallenge}
              </h2>
              <span className="text-xs text-stone-400">
                Wallet: <strong className="text-amber-400 font-mono">{balance.toFixed(2)} ETB</strong>
              </span>
            </div>

            {/* Quick Stake Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                Match Stake
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                {quickStakes.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setStakeEtb(amt)}
                    className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all min-h-[38px] flex items-center justify-center touch-manipulation ${
                      stakeEtb === amt
                        ? amt === 0
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black'
                          : 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    {amt === 0 ? (
                      <>
                        <span className="hidden sm:inline">Free Play</span>
                        <span className="sm:hidden">Free</span>
                      </>
                    ) : (
                      `${amt} ETB`
                    )}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="5000"
                  step="1"
                  value={stakeEtb}
                  onChange={(e) => setStakeEtb(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 sm:py-3 text-white font-mono font-bold focus:outline-none focus:border-amber-500 text-sm sm:text-base"
                  placeholder="0 for Free Play, or enter ETB..."
                />
                <span className="absolute right-4 top-2.5 sm:top-3.5 text-xs text-stone-500 font-bold">
                  {isFreePlay ? 'FREE' : 'ETB'}
                </span>
              </div>
            </div>

            {/* Pot & Financial Breakdown Display */}
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-stone-950/80 border border-stone-800 space-y-2 text-xs">
              <div className="flex justify-between text-stone-400">
                <span>{t.games.dama.stake} (Each Player):</span>
                <span className="font-mono font-bold text-white">
                  {isFreePlay ? 'Free Play (0 ETB)' : `${stakeEtb.toFixed(2)} ETB`}
                </span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>{t.games.dama.pot}:</span>
                <span className="font-mono font-bold text-amber-400">
                  {isFreePlay ? '0.00 ETB' : `${totalPotEtb.toFixed(2)} ETB`}
                </span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>{t.games.dama.rake}:</span>
                <span className="font-mono">{isFreePlay ? '0.00 ETB (0%)' : `${rakeEtb.toFixed(2)} ETB (5%)`}</span>
              </div>
              <div className="border-t border-stone-800 pt-2 flex justify-between text-emerald-400 font-bold text-xs sm:text-sm">
                <span>{t.games.dama.winnerPayout}:</span>
                <span className="font-mono">
                  {isFreePlay ? 'Pride & Honor' : `${winnerPayoutEtb.toFixed(2)} ETB`}
                </span>
              </div>
            </div>

            {/* Private Match Option */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950 border border-stone-800">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-stone-300">{t.games.dama.privateMatch}</span>
              </div>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {createdInviteCode && (
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-950/50 border border-amber-500/50 space-y-2">
                <span className="text-xs font-bold text-amber-300 block">Challenge Created! Share Invite Code:</span>
                <div className="flex items-center justify-between bg-black/60 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-amber-500/30">
                  <span className="text-base sm:text-lg font-mono font-black text-amber-400 tracking-widest">{createdInviteCode}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdInviteCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="flex items-center gap-1.5 text-xs text-amber-300 font-bold hover:text-white min-h-[36px] px-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedCode ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isCreating}
              onClick={handleCreate}
              className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 min-h-[46px] touch-manipulation"
            >
              {isCreating
                ? 'Creating Challenge...'
                : isFreePlay
                ? 'Create Free Challenge'
                : `${t.games.dama.createChallenge} (${stakeEtb} ETB)`}
            </button>
          </div>

          {/* Right Column: Open Challenges & Join By Code */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            {/* Join by Code Card */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl">
              <h3 className="text-xs sm:text-sm font-bold text-stone-300 flex items-center gap-2 mb-2.5 sm:mb-3">
                <KeyRound className="w-4 h-4 text-amber-400" />
                {t.games.dama.joinByCode}
              </h3>
              <form onSubmit={handleJoinByCodeSubmit} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6-char code..."
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-white font-mono font-bold uppercase tracking-widest text-center focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
                />
                <button
                  type="submit"
                  className="px-4 sm:px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs uppercase tracking-wider transition-colors min-h-[40px] touch-manipulation"
                >
                  {t.games.dama.joinMatch}
                </button>
              </form>
            </div>

            {/* Open Challenges Feed */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-stone-300 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  {t.games.dama.openChallenges} ({lobbyMatches.length})
                </h3>
                <button
                  type="button"
                  onClick={fetchLobby}
                  disabled={isLoadingLobby}
                  className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLobby ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {lobbyMatches.length === 0 ? (
                  <div className="text-center py-8 sm:py-10 text-stone-500 text-xs">
                    No open challenges right now. Create one above to get started!
                  </div>
                ) : (
                  lobbyMatches.map((match) => {
                    const isOwnChallenge = (match.creator?.id || match.whiteUserId) === currentUserId;
                    const isJoiningThis = joiningMatchId === match.id;
                    const isCancellingThis = cancellingMatchId === match.id;

                    return (
                      <div
                        key={match.id}
                        className="flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-stone-950 border border-stone-800 hover:border-amber-500/50 transition-all gap-2"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-xs text-amber-300 shrink-0">
                            {match.creator?.username?.[0]?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block truncate max-w-[110px] sm:max-w-[150px]">
                              {match.creator?.username || 'Challenger'}
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              {match.isFreePlay || match.stakeEtb === 0 ? (
                                <strong className="text-emerald-400">Free Play</strong>
                              ) : (
                                <>
                                  Stake: <strong className="text-amber-400 font-mono">{match.stakeEtb} ETB</strong>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {isOwnChallenge ? (
                          <div className="flex items-center gap-1.5">
                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold select-none">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              <span>Yours</span>
                            </div>
                            <button
                              type="button"
                              disabled={isCancellingThis}
                              onClick={() => handleCancelChallenge(match.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-bold transition-colors disabled:opacity-50 min-h-[38px] touch-manipulation"
                              title="Cancel Challenge"
                            >
                              {isCancellingThis ? '...' : 'Cancel'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isJoiningThis}
                            onClick={() => handleJoinClick(match.id)}
                            className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-xs uppercase tracking-wider shadow transition-transform active:scale-95 disabled:opacity-50 min-h-[38px] touch-manipulation shrink-0"
                          >
                            {isJoiningThis ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>...</span>
                              </>
                            ) : (
                              <>
                                <span>{match.isFreePlay || match.stakeEtb === 0 ? 'Join Free' : `Join (${match.stakeEtb} ETB)`}</span>
                                <ArrowRight className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replay Modal Overlay */}
      {selectedReplayMatch && (
        <DamaReplayModal
          match={selectedReplayMatch}
          onClose={() => setSelectedReplayMatch(null)}
        />
      )}
    </div>
  );
};
