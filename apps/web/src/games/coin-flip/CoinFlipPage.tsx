import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coin } from './components/Coin';
import { SideSelector } from './components/SideSelector';
import { BetSelector } from './components/BetSelector';
import { Result } from './components/Result';
import { HeadsCoinSvg, TailsCoinSvg } from './components/CoinArtwork';
import { useCoinFlip, FlipResultData } from './hooks/useCoinFlip';
import { useCoinFlipMultiplayer } from './hooks/useCoinFlipMultiplayer';
import { MultiplayerLobby } from './components/multiplayer/MultiplayerLobby';
import { VersusArena } from './components/multiplayer/VersusArena';
import { QuickMatchModal } from './components/multiplayer/QuickMatchModal';
import { PrivateRoomModal } from './components/multiplayer/PrivateRoomModal';
import { MultiplayerLeaderboard } from './components/multiplayer/MultiplayerLeaderboard';
import {
  HelpCircle,
  Volume2,
  VolumeX,
  Copy,
  Check,
  X,
  ShieldCheck,
  Wallet,
  Play,
  RotateCw,
  Coins,
  ChevronDown,
  ChevronUp,
  History,
  Sparkles,
  User,
  Swords,
} from 'lucide-react';

export const CoinFlipPage: React.FC = () => {
  const navigate = useNavigate();

  // Top-Level Game Mode Tab
  const [activeTab, setActiveTab] = useState<'SOLO' | 'MULTIPLAYER'>('SOLO');

  // Solo Mode Hook
  const {
    choice,
    setChoice,
    betAmount,
    setBetAmount,
    isFlipping,
    flipPhase,
    lastResult,
    history,
    error,
    balance,
    soundEnabled,
    setSoundEnabled,
    serverSeedHash,
    clientSeed,
    setClientSeed,
    nonce,
    rotateSeed,
    play,
  } = useCoinFlip();

  // Multiplayer Hook
  const {
    activeRoom,
    availableRooms,
    recentWinners,
    leaderboard,
    userStats,
    config: multiConfig,
    isQueuing,
    countdown,
    isFlipping: isMultiFlipping,
    settledMatch,
    error: multiError,
    queueQuickMatch,
    leaveQueue,
    createPrivateRoom,
    joinPrivateRoom,
    resetMatch,
  } = useCoinFlipMultiplayer();

  // Modals & UI States
  const [copiedHash, setCopiedHash] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showFairModal, setShowFairModal] = useState(false);
  const [inspectRound, setInspectRound] = useState<FlipResultData | null>(null);
  const [isFairnessExpanded, setIsFairnessExpanded] = useState(false);

  const [isQuickMatchOpen, setIsQuickMatchOpen] = useState(false);
  const [isPrivateRoomOpen, setIsPrivateRoomOpen] = useState(false);

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(serverSeedHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const isSoloActionDisabled = isFlipping || flipPhase !== 'IDLE';

  return (
    <div className="w-full min-h-[calc(100vh-5.5rem)] flex flex-col items-center py-2 px-1 sm:px-3 pb-14 select-none max-w-7xl mx-auto">
      {/* ==================================================================== */}
      {/* 1. TOP NAVIGATION BAR                                                */}
      {/* ==================================================================== */}
      <header className="w-full rounded-2xl bg-[#0c101c]/90 backdrop-blur-md border border-slate-800/90 px-3.5 py-2.5 mb-3 flex items-center justify-between gap-3 shadow-xl">
        {/* Game Title & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            <div className="w-full h-full bg-[#070b14] rounded-[10px] flex items-center justify-center">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black text-white tracking-wide">
                COIN FLIP
              </h1>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                1.98x
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              {activeTab === 'SOLO' ? 'Solo Provably Fair · 50.0% True Odds' : '1v1 Synchronized Multiplayer Arena'}
            </p>
          </div>
        </div>

        {/* Right Nav Utilities */}
        <div className="flex items-center gap-2">
          {/* Wallet Balance + Quick Deposit Shortcut */}
          <div className="flex items-center bg-[#070b14] border border-slate-800 rounded-xl px-2.5 py-1.5 gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span>{balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ETB</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/wallet')}
              className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer"
            >
              + Deposit
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-[#121829] border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-slate-300" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-400" />
            )}
          </button>

          {/* Provably Fair Modal */}
          <button
            type="button"
            onClick={() => setShowFairModal(true)}
            className="p-2 rounded-xl bg-[#121829] border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            title="Provably Fair Verification"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Rules / Help */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-xl bg-[#121829] border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Rules & Paytable"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. MODE TAB SELECTOR (SOLO vs MULTIPLAYER)                           */}
      {/* ==================================================================== */}
      <div className="w-full max-w-sm grid grid-cols-2 gap-2 bg-[#0c101c]/90 border border-slate-800 p-1 rounded-2xl mb-4 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('SOLO')}
          className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'SOLO'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Solo Mode</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MULTIPLAYER')}
          className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'MULTIPLAYER'
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.45)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Multiplayer Arena</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 3. SOLO COIN FLIP VIEW                                               */}
      {/* ==================================================================== */}
      {activeTab === 'SOLO' ? (
        <>
          <div className="w-full flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch">
            {/* LEFT / MOBILE BOTTOM: BET CONTROLS */}
            <aside className="order-2 lg:order-1 w-full lg:w-[340px] xl:w-[380px] shrink-0 bg-[#0c101c]/90 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col justify-between gap-3 sm:gap-4 shadow-2xl">
              <div className="space-y-3.5">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Set Stake
                  </span>
                  <BetSelector
                    amount={betAmount}
                    onChange={setBetAmount}
                    maxBalance={balance}
                    disabled={isSoloActionDisabled}
                  />
                </div>

                {/* Multiplier and Profit Overview */}
                <div className="grid grid-cols-2 gap-2 bg-[#070b14] p-2.5 rounded-xl border border-slate-800/80 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Multiplier</span>
                    <span className="text-sm font-extrabold text-amber-400">1.98x</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Possible Win</span>
                    <span className="text-sm font-extrabold text-emerald-400">+{(betAmount * 1.98).toFixed(2)} ETB</span>
                  </div>
                </div>
              </div>

              {/* Bottom RTP Indicator (Desktop only) */}
              <div className="hidden lg:flex pt-3 border-t border-slate-800/70 items-center justify-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#070b14] border border-slate-800 text-xs font-bold text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>99.0% RTP · Provably Fair</span>
                </div>
              </div>
            </aside>

            {/* RIGHT MAIN COIN ARENA */}
            <section className="order-1 lg:order-2 flex-1 bg-[#090e1a] border border-slate-800/80 rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 flex flex-col justify-between gap-2.5 sm:gap-3.5 shadow-2xl">
              {/* Top Bar: RTP & Seed Hash */}
              <div className="w-full flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fair Return: 99.0% RTP</span>
                </span>

                <div
                  onClick={handleCopyHash}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0a0f1d] border border-slate-800 hover:border-slate-700 text-[10px] font-mono text-slate-400 cursor-pointer transition-colors"
                  title="Click to copy server seed hash"
                >
                  <span>Hash: {serverSeedHash.slice(0, 10)}...</span>
                  {copiedHash ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-500" />
                  )}
                </div>
              </div>

              {/* 3D Coin Box */}
              <div className="relative rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#0c101c] via-[#070b14] to-[#04060b] border border-slate-800/90 p-2 sm:p-4 flex flex-col items-center justify-between min-h-[200px] sm:min-h-[300px] shadow-[0_15px_40px_rgba(0,0,0,0.7),inset_0_1px_8px_rgba(255,255,255,0.06)] overflow-hidden">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[480px] h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 w-full flex-1 flex items-center justify-center">
                  <Coin
                    isFlipping={isFlipping}
                    flipPhase={flipPhase}
                    result={lastResult ? lastResult.result : null}
                    choice={choice}
                    won={lastResult ? lastResult.won : null}
                  />
                </div>

                <div className="relative z-10 text-center pb-1">
                  <span className="text-xs font-mono text-slate-400">
                    Landing on <span className="text-amber-400 font-bold">{choice}</span> pays{' '}
                    <span className="text-emerald-400 font-extrabold">+{(betAmount * 1.98).toFixed(2)} ETB</span>
                  </span>
                </div>
              </div>

              {/* Side Selector (HEADS or TAILS) */}
              <div className="w-full">
                <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1 text-center">
                  Choose Side:
                </span>
                <SideSelector
                  selected={choice}
                  onChange={setChoice}
                  disabled={isSoloActionDisabled}
                />
              </div>

              {/* SINGLE PLAY ACTION BUTTON & FEEDBACK (Directly close to Coin Box) */}
              <div className="w-full space-y-2">
                {error && (
                  <div className="p-2 sm:p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] sm:text-xs font-bold text-center">
                    {error}
                  </div>
                )}

                {lastResult && (
                  <Result result={lastResult} balance={balance} />
                )}

                <button
                  type="button"
                  disabled={isSoloActionDisabled}
                  onClick={play}
                  className={`w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    isSoloActionDisabled
                      ? 'bg-slate-800 text-slate-500 cursor-wait opacity-75'
                      : 'bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.45)]'
                  }`}
                >
                  <Play className="w-5 h-5 fill-current" />
                  {isFlipping
                    ? 'FLIPPING COIN...'
                    : flipPhase === 'RESULT'
                    ? `PLAY AGAIN · ${betAmount} ETB`
                    : `FLIP COIN · ${betAmount} ETB`}
                </button>
              </div>
            </section>
          </div>

          {/* RECENT FLIPS HISTORY STRIP */}
          <section className="w-full mt-4 rounded-2xl bg-[#0c101c]/70 border border-slate-800/80 p-3 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
              <History className="w-4 h-4 text-amber-400" />
              <span>Recent:</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {history.length === 0 ? (
                <span className="text-xs text-slate-500 font-mono">No flips recorded yet</span>
              ) : (
                history.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setInspectRound(h)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer shrink-0 ${
                      h.won
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/25'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                    title="Click to view round audit"
                  >
                    <span className="w-3.5 h-3.5 inline-block">
                      {h.result === 'HEADS' ? (
                        <HeadsCoinSvg className="w-full h-full" />
                      ) : (
                        <TailsCoinSvg className="w-full h-full" />
                      )}
                    </span>
                    <span>{h.result}</span>
                    <span className={h.won ? 'text-emerald-300 font-extrabold' : 'text-rose-400'}>
                      {h.won ? `+${h.payout.toFixed(0)}` : `-${h.betAmount}`}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>

          {/* PROVABLY FAIR EXPANDABLE PANEL */}
          <section className="w-full mt-3 rounded-2xl bg-[#0c101c]/60 border border-slate-800/80 overflow-hidden shadow-lg">
            <button
              type="button"
              onClick={() => setIsFairnessExpanded(!isFairnessExpanded)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="uppercase tracking-wider">Provably Fair Verification Data</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span>{isFairnessExpanded ? 'Hide' : 'Inspect'}</span>
                {isFairnessExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {isFairnessExpanded && (
              <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3 text-xs font-mono">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      Active Server Seed (SHA-256 Hash)
                    </span>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#070b14] border border-slate-800 text-slate-300">
                      <span className="truncate pr-2">{serverSeedHash}</span>
                      <button
                        type="button"
                        onClick={handleCopyHash}
                        className="p-1 hover:text-amber-400 cursor-pointer"
                        title="Copy full hash"
                      >
                        {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                      Client Seed
                    </span>
                    <input
                      type="text"
                      value={clientSeed}
                      disabled={isSoloActionDisabled}
                      onChange={(e) => setClientSeed(e.target.value)}
                      className="w-full p-2 rounded-xl bg-[#070b14] border border-slate-800 text-slate-300 focus:outline-none focus:border-amber-400 font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-slate-400">
                  <span>Nonce: <strong className="text-white">{nonce}</strong></span>
                  <button
                    type="button"
                    onClick={rotateSeed}
                    disabled={isSoloActionDisabled}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#141a29] hover:bg-[#1d263b] text-slate-300 border border-slate-700 transition-colors cursor-pointer text-xs disabled:opacity-40"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Rotate Seed Pair</span>
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      ) : (
        /* ================================================================== */
        /* 4. MULTIPLAYER ARENA VIEW                                          */
        /* ================================================================== */
        <div className="w-full space-y-4">
          {activeRoom ? (
            /* Active Head-to-Head Versus Match Screen */
            <VersusArena
              room={activeRoom}
              countdown={countdown}
              isFlipping={isMultiFlipping}
              settledMatch={settledMatch}
              onRematch={() => {
                resetMatch();
                setIsQuickMatchOpen(true);
              }}
              onExit={resetMatch}
            />
          ) : (
            /* Multiplayer Arena Lobby & Leaderboard */
            <>
              <MultiplayerLobby
                availableRooms={availableRooms}
                recentWinners={recentWinners}
                userStats={userStats}
                config={multiConfig}
                onOpenQuickMatch={() => setIsQuickMatchOpen(true)}
                onCreatePrivateRoom={() => setIsPrivateRoomOpen(true)}
                onJoinPrivateRoom={() => setIsPrivateRoomOpen(true)}
                onDirectJoinRoom={(code) => joinPrivateRoom(code)}
              />

              <div className="mt-4">
                <MultiplayerLeaderboard entries={leaderboard} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODALS                                                               */}
      {/* ==================================================================== */}

      {/* Quick Match Modal */}
      <QuickMatchModal
        isOpen={isQuickMatchOpen}
        isQueuing={isQueuing}
        balance={balance}
        onClose={() => setIsQuickMatchOpen(false)}
        onQueue={(stake, choice) => queueQuickMatch(stake, choice)}
        onCancelQueue={leaveQueue}
      />

      {/* Private Room Modal */}
      <PrivateRoomModal
        isOpen={isPrivateRoomOpen}
        balance={balance}
        onClose={() => setIsPrivateRoomOpen(false)}
        onCreateRoom={(stake, choice) => createPrivateRoom(stake, choice)}
        onJoinRoom={(code) => joinPrivateRoom(code)}
      />

      {/* Round Inspection Modal */}
      {inspectRound && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e131f] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Round Verification #{inspectRound.id.slice(-6)}
              </h3>
              <button
                type="button"
                onClick={() => setInspectRound(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-500">Result</span>
                <span className={inspectRound.won ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {inspectRound.result} ({inspectRound.won ? 'WON' : 'LOST'})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-500">Your Selection</span>
                <span className="text-white font-bold">{inspectRound.choice}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-500">Bet Stake</span>
                <span className="text-white">{inspectRound.betAmount} ETB</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-500">Payout</span>
                <span className="text-emerald-400 font-bold">+{inspectRound.payout.toFixed(2)} ETB</span>
              </div>
              <div className="flex flex-col py-1">
                <span className="text-slate-500 text-[10px] mb-1">SHA-256 Seed Hash</span>
                <span className="text-slate-300 break-all p-2 rounded-lg bg-black/50 text-[10px]">
                  {inspectRound.hash}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules / Paytable Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e131f] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                How to Play Coin Flip
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p><strong>Solo Mode:</strong> Pick either <strong>HEADS</strong> (Winged Helmet) or <strong>TAILS</strong> (Warrior Crest). Land your side to win <strong>1.98x</strong> instantly.</p>
            <p><strong>Multiplayer 1v1 Arena:</strong> Challenge an opponent via <strong>Quick Match</strong> or create a <strong>Private Room</strong>. Player 1 and Player 2 take opposite sides with matched stakes. The winner takes the total pot minus a 2.5% platform fee!</p>
          </div>
        </div>
      )}

      {/* Provably Fair Info Modal */}
      {showFairModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e131f] border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Provably Fair Verification
              </h3>
              <button
                type="button"
                onClick={() => setShowFairModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p>Every coin toss outcome is determined by an HMAC-SHA256 hash using the server seed, client seed, and nonce before you press flip.</p>
            <p>In 1v1 Multiplayer, both players are bound to the exact same server seed hash, ensuring neither party nor the server can manipulate the toss.</p>
          </div>
        </div>
      )}
    </div>
  );
};
