import React, { useEffect, useState } from 'react';
import { LettiCard } from './components/LettiCard';
import { LettiMultiplayerView } from './components/LettiMultiplayerView';
import { useLetti } from './hooks/useLetti';
import { LettiEngine } from '@nova/game-letti';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import {
  Eye,
  EyeOff,
  Lock,
  Shuffle,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
  HelpCircle,
  X,
  Wallet,
  Play,
  FastForward,
  RotateCcw,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  History,
  Swords,
  User,
} from 'lucide-react';

export const LettiPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const initialRoomParam =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('room')
      : null;

  const [gameMode, setGameMode] = useState<'SOLO' | 'PVP'>(
    initialRoomParam ? 'PVP' : 'SOLO'
  );

  // Auto-open 1v1 Face-to-Face tab when player already has an active PvP room
  useEffect(() => {
    if (initialRoomParam || !isAuthenticated) return;
    let cancelled = false;
    api
      .get('/letti-pvp/active')
      .then((res) => {
        if (!cancelled && res.data?.data?.roomId) {
          setGameMode('PVP');
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialRoomParam, isAuthenticated]);

  const {
    phase,
    mysteryDeckIndices,
    remainingVisualSlots,
    mixTick,
    pickedCard,
    preparedRound,
    showSecretToUser,
    setShowSecretToUser,
    betAmount,
    setBetAmount,
    isPreparing,
    isMixing,
    isDealing,
    fastMode,
    setFastMode,
    soundEnabled,
    setSoundEnabled,
    revealedSteps,
    userSideCards,
    systemSideCards,
    latestRevealedStep,
    remainingUnflippedCount,
    currentTurnSide,
    roundOutcome,
    history,
    selectedHistoryRound,
    verifyResult,
    isVerifying,
    pendingReplaceCardIndex,
    error,
    balance,
    selectCardByIndex,
    pickRandomSecretCard,
    confirmReplaceCard,
    cancelReplaceCard,
    requestBackToPicker,
    mixRemainingCards,
    backToPicker,
    grantPermissionAndStartFlip,
    skipToResult,
    openRoundVerifier,
    closeRoundVerifier,
  } = useLetti();

  const [pickerMode, setPickerMode] = useState<'MYSTERY' | 'OPEN'>('MYSTERY');
  const [showHelpModal, setShowHelpModal] = useState(false);

  const potentialWin = Math.floor(betAmount * LettiEngine.PAYOUT_MULTIPLIER);
  const fullDeck = LettiEngine.createFullDeck();

  const isBusy = isPreparing || isMixing || isDealing;
  const showDuelBoard = phase === 'DEALING' || phase === 'RESULT';

  return (
    <div className="w-full min-h-[calc(100vh-5.5rem)] flex flex-col gap-3 py-1 sm:py-2 px-1 sm:px-2 pb-4 sm:pb-12 select-none">
      {/* Mode Switcher: 1v1 Face-to-Face vs Solo vs House */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-[#111827] border border-slate-800 rounded-2xl px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs sm:text-sm font-black text-white tracking-wide uppercase">
            Letti Card
          </span>
        </div>
        <div className="inline-flex bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1">
          <button
            type="button"
            onClick={() => setGameMode('PVP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              gameMode === 'PVP'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Swords size={13} /> 1v1 Face-to-Face
          </button>
          <button
            type="button"
            onClick={() => setGameMode('SOLO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              gameMode === 'SOLO'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User size={13} /> Solo vs House
          </button>
        </div>
      </div>

      {gameMode === 'PVP' ? (
        <LettiMultiplayerView initialRoomCode={initialRoomParam} />
      ) : (
        <div className="w-full flex flex-col lg:flex-row gap-2 sm:gap-4">
      {/* ================================================================== */}
      {/* LEFT CONTROL SIDEBAR (Desktop)                                     */}
      {/* ================================================================== */}
      <aside className="hidden lg:flex w-full lg:w-[330px] xl:w-[350px] shrink-0 bg-[#111827] border border-slate-800 rounded-2xl p-4 flex-col justify-between shadow-2xl gap-4">
        <div className="space-y-4">
          {/* Header Branding */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> LETTI{' '}
                <span
                  className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black"
                  title="Includes returned stake (~97.85% RTP)"
                >
                  1.90× Total Return
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Provably Fair 52-Card Match</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
              </button>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                title="How to Play Letti"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Your Private Secret Pick Panel */}
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Your Secret Card
              </span>
              {pickedCard && (
                <button
                  type="button"
                  onClick={() => setShowSecretToUser(!showSecretToUser)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  {showSecretToUser ? (
                    <>
                      <EyeOff className="w-3 h-3" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 text-amber-400" /> Peek
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3.5">
              {pickedCard ? (
                <LettiCard
                  card={pickedCard}
                  hidden={!showSecretToUser}
                  size="sm"
                  highlight={
                    roundOutcome
                      ? roundOutcome.won
                        ? 'USER_WIN'
                        : 'SYSTEM_WIN'
                      : 'SELECTED'
                  }
                  labelBadge="PRIVATE"
                />
              ) : (
                <div className="w-16 h-24 rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 flex items-center justify-center text-slate-500 text-xs font-bold">
                  ?
                </div>
              )}

              <div className="flex-1 space-y-1.5 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {pickedCard
                    ? showSecretToUser
                      ? `Target: ${pickedCard.label} (${pickedCard.suit})`
                      : 'Secret Card Locked'
                    : 'No Card Picked'}
                </p>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {preparedRound
                    ? `Committed ${preparedRound.roundCode} (#${preparedRound.provablyFair.nonce})`
                    : pickedCard
                    ? 'Visible only to you throughout the round.'
                    : 'Pick 1 card from the 52-card deck.'}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={pickRandomSecretCard}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <Shuffle className="w-3 h-3" /> Random Pick
                  </button>
                  {phase !== 'PICKING' && !isBusy && (
                    <button
                      type="button"
                      onClick={requestBackToPicker}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Change Card
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bet Amount Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">Bet Amount</span>
              <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" /> {balance.toFixed(0)} ETB
              </span>
            </div>

            <div className="flex items-stretch bg-[#0b101b] border border-slate-800 focus-within:border-amber-400/60 rounded-xl overflow-hidden">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5">
                <span className="text-[10px] font-black text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
                  ETB
                </span>
                <input
                  type="number"
                  min={1}
                  max={balance}
                  disabled={isBusy}
                  value={betAmount}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setBetAmount(isNaN(v) ? 0 : Math.max(0, v));
                  }}
                  className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none"
                />
              </div>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setBetAmount(Math.max(1, Math.floor(betAmount / 2)))}
                className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border-l border-slate-700 cursor-pointer disabled:opacity-40"
              >
                ½
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setBetAmount(Math.min(Math.floor(balance), Math.max(1, betAmount * 2)))}
                className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border-l border-slate-700 cursor-pointer disabled:opacity-40"
              >
                2×
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setBetAmount(Math.max(1, Math.floor(balance)))}
                className="px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border-l border-slate-700 cursor-pointer disabled:opacity-40"
              >
                Max
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
              <span>1.90× Total Return:</span>
              <span className="font-mono font-black text-emerald-400">{potentialWin} ETB</span>
            </div>
          </div>

          {/* Flip Speed Toggle */}
          <div className="flex items-center justify-between bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-xs">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Flip Speed
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFastMode(false)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                  !fastMode ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                1× Normal
              </button>
              <button
                type="button"
                onClick={() => setFastMode(true)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer ${
                  fastMode ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                2× Fast
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Action Button */}
          {phase === 'DEALING' ? (
            <button
              type="button"
              onClick={skipToResult}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <FastForward className="w-4 h-4" />
              SKIP TO MATCH ({revealedSteps.length} Flips)
            </button>
          ) : isPreparing ? (
            <button
              type="button"
              disabled
              className="w-full py-3.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-wait"
            >
              <ShieldCheck className="w-4 h-4 animate-pulse" />
              COMMITTING SERVER SHUFFLE...
            </button>
          ) : phase === 'MIXING' ? (
            <button
              type="button"
              disabled
              className="w-full py-3.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-wait"
            >
              <Shuffle className="w-4 h-4 animate-spin" />
              MIXING REMAINING 51 CARDS...
            </button>
          ) : phase === 'AWAITING_PERMISSION' ? (
            <button
              type="button"
              onClick={grantPermissionAndStartFlip}
              disabled={!pickedCard || !preparedRound || betAmount <= 0 || betAmount > balance}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              YES, START FLIPPING
            </button>
          ) : phase === 'RESULT' ? (
            roundOutcome?.won ? (
              <button
                type="button"
                onClick={() => mixRemainingCards()}
                disabled={!pickedCard || betAmount <= 0 || betAmount > balance}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                WON! FLIP AGAIN
              </button>
            ) : (
              <button
                type="button"
                onClick={backToPicker}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                PICK NEW CARD (52 DECK)
              </button>
            )
          ) : (
            <button
              type="button"
              disabled
              className="w-full py-3.5 rounded-xl bg-slate-800 text-slate-400 font-black text-sm uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              PICK 1 SECRET CARD FIRST
            </button>
          )}
        </div>

        {/* Fair Commitment Footer Pill */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> Provably Fair Active
          </span>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => openRoundVerifier(history[0])}
              className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer"
            >
              <History className="w-3 h-3" /> Verify Last
            </button>
          )}
        </div>
      </aside>

      {/* ================================================================== */}
      {/* RIGHT MAIN ARENA: PICKER / MIXING 51 / PERMISSION / DUEL           */}
      {/* ================================================================== */}
      <section className="flex-1 bg-[#0b0f19] border border-slate-800 rounded-2xl p-2.5 sm:p-5 flex flex-col justify-between gap-2.5 sm:gap-4 shadow-2xl">
        {/* MOBILE SINGLE-SCREEN COMPACT HEADER & BET BAR (< lg) */}
        <div className="lg:hidden space-y-2 border-b border-slate-800 pb-2.5">
          {/* Row 1: Brand, Wallet, Speed, Sound, Help */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-sm font-black text-white tracking-tight">LETTI</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black">
                1.90× Total
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg flex items-center gap-1">
                <Wallet className="w-3 h-3" /> {balance.toFixed(0)} ETB
              </span>
              <button
                type="button"
                onClick={() => setFastMode(!fastMode)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black border cursor-pointer ${
                  fastMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
                title="Toggle Flip Speed"
              >
                {fastMode ? '2×' : '1×'}
              </button>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 cursor-pointer"
                title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
              </button>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 cursor-pointer"
                title="How to Play Letti"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Row 2: Compact Bet Input + Quick Multipliers + Context Action */}
          <div className="flex items-stretch gap-1.5">
            <div className="flex-1 flex items-stretch bg-[#111827] border border-slate-800 rounded-xl overflow-hidden min-w-0">
              <div className="flex-1 flex items-center gap-1.5 px-2 py-1.5 min-w-0">
                <span className="text-[9px] font-black text-amber-400 shrink-0">ETB</span>
                <input
                  type="number"
                  min={1}
                  max={balance}
                  disabled={isBusy}
                  value={betAmount}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setBetAmount(isNaN(v) ? 0 : Math.max(0, v));
                  }}
                  className="w-full bg-transparent text-white font-mono font-bold text-xs focus:outline-none min-w-0"
                />
              </div>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setBetAmount(Math.max(1, Math.floor(betAmount / 2)))}
                className="px-2 bg-slate-800 text-slate-200 font-bold text-[10px] border-l border-slate-700 cursor-pointer disabled:opacity-40"
              >
                ½
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => setBetAmount(Math.min(Math.floor(balance), Math.max(1, betAmount * 2)))}
                className="px-2 bg-slate-800 text-slate-200 font-bold text-[10px] border-l border-slate-700 cursor-pointer disabled:opacity-40"
              >
                2×
              </button>
            </div>

            {phase === 'PICKING' && (
              <button
                type="button"
                disabled={isBusy}
                onClick={pickRandomSecretCard}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-[11px] flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-40"
              >
                <Shuffle className="w-3.5 h-3.5" /> Random
              </button>
            )}
            {phase === 'MIXING' && (
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-[11px] flex items-center gap-1 shrink-0">
                <Shuffle className="w-3.5 h-3.5 animate-spin" /> Mixing...
              </span>
            )}
            {phase === 'AWAITING_PERMISSION' && (
              <button
                type="button"
                onClick={grantPermissionAndStartFlip}
                disabled={!pickedCard || !preparedRound || betAmount <= 0 || betAmount > balance}
                className="px-3 py-1.5 rounded-xl bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" /> Start Flip
              </button>
            )}
            {phase === 'DEALING' && (
              <button
                type="button"
                onClick={skipToResult}
                className="px-3 py-1.5 rounded-xl bg-cyan-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5" /> Skip
              </button>
            )}
            {phase === 'RESULT' &&
              (roundOutcome?.won ? (
                <button
                  type="button"
                  onClick={() => mixRemainingCards()}
                  disabled={!pickedCard || betAmount <= 0 || betAmount > balance}
                  className="px-3 py-1.5 rounded-xl bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-40"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" /> Flip Again
                </button>
              ) : (
                <button
                  type="button"
                  onClick={backToPicker}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Pick Card
                </button>
              ))}
          </div>

          {error && (
            <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {phase === 'PICKING' ? (
          /* PHASE 1: PICK 1 SECRET CARD FROM 52-CARD DECK */
          <div className="space-y-2 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2 sm:pb-3">
              <div>
                <h2 className="text-sm sm:text-lg font-black text-white flex items-center gap-2">
                  Pick 1 Card From 52 Cards
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Server commits your fair 51-card shuffle order immediately after selection.
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 sm:p-1 rounded-xl shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPickerMode('MYSTERY')}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold cursor-pointer ${
                    pickerMode === 'MYSTERY' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mystery
                </button>
                <button
                  type="button"
                  onClick={() => setPickerMode('OPEN')}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold cursor-pointer ${
                    pickerMode === 'OPEN' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Open Rank/Suit
                </button>
              </div>
            </div>

            {pickerMode === 'MYSTERY' ? (
              <div className="grid grid-cols-9 sm:grid-cols-9 md:grid-cols-[repeat(13,minmax(0,1fr))] gap-1 sm:gap-2 justify-items-center py-1">
                {mysteryDeckIndices.map((cardIdx) => {
                  const isSelected = pickedCard?.index === cardIdx;
                  return (
                    <LettiCard
                      key={cardIdx}
                      hidden
                      size="xs"
                      disabled={isPreparing}
                      highlight={isSelected ? 'SELECTED' : 'NONE'}
                      onClick={() => selectCardByIndex(cardIdx)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-9 sm:grid-cols-9 md:grid-cols-[repeat(13,minmax(0,1fr))] gap-1 sm:gap-2 justify-items-center py-1">
                {fullDeck.map((c) => {
                  const isSelected = pickedCard?.index === c.index;
                  return (
                    <LettiCard
                      key={c.index}
                      card={c}
                      size="xs"
                      disabled={isPreparing}
                      highlight={isSelected ? 'SELECTED' : 'NONE'}
                      onClick={() => selectCardByIndex(c.index)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : phase === 'MIXING' || phase === 'AWAITING_PERMISSION' ? (
          /* PHASE 2 & 3: MIX REMAINING 51 CARDS & ASK PICKER PERMISSION */
          <div className="flex-1 flex flex-col gap-3 sm:gap-5">
            {/* Top Status / Permission Banner */}
            <div
              className={`rounded-2xl border p-3 sm:p-5 transition-all ${
                phase === 'MIXING'
                  ? 'bg-[#111827] border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.12)]'
                  : 'bg-gradient-to-br from-[#111827] via-[#0f172a] to-emerald-950/30 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <LettiCard
                      card={pickedCard}
                      hidden={!showSecretToUser}
                      size="sm"
                      highlight="SELECTED"
                      labelBadge="SECRET"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretToUser(!showSecretToUser)}
                      className="lg:hidden px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      {showSecretToUser ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5 text-amber-400" />}
                      {showSecretToUser ? 'Hide' : 'Peek'}
                    </button>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 min-w-0">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                        phase === 'MIXING' ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {phase === 'MIXING' ? (
                        <>
                          <Shuffle className="w-3 h-3 animate-spin" /> Server-Committed Mix ({mixTick}/4)
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3 h-3" /> {preparedRound?.roundCode || 'Round Ready'} • Confirm Flip
                        </>
                      )}
                    </span>
                    <h2 className="text-sm sm:text-lg font-black text-white leading-tight">
                      {phase === 'MIXING'
                        ? 'Mixing the 51 remaining cards...'
                        : '51 cards locked & mixed! Start flipping?'}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-400 leading-snug">
                      {phase === 'MIXING'
                        ? 'Your secret card is set aside while the server-committed 51-card deck mixes.'
                        : `Secret: ${
                            showSecretToUser ? `${pickedCard?.label} (${pickedCard?.suit})` : 'Hidden'
                          } • Bet: ${betAmount} ETB → Return: ${potentialWin} ETB`}
                    </p>
                    {preparedRound && (
                      <p className="text-[10px] font-mono text-slate-500 truncate">
                        SHA-256: {preparedRound.provablyFair.serverSeedHash.slice(0, 18)}… • Nonce #{preparedRound.provablyFair.nonce}
                      </p>
                    )}
                  </div>
                </div>

                {phase === 'AWAITING_PERMISSION' && (
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={grantPermissionAndStartFlip}
                      disabled={!pickedCard || !preparedRound || betAmount <= 0 || betAmount > balance}
                      className="flex-1 sm:flex-initial px-3.5 sm:px-5 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" /> Yes, Start Flip
                    </button>
                    <button
                      type="button"
                      onClick={() => mixRemainingCards()}
                      className="px-2.5 sm:px-3.5 py-2 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Shuffle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Mix Again
                    </button>
                    <button
                      type="button"
                      onClick={requestBackToPicker}
                      className="px-2.5 sm:px-3.5 py-2 sm:py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] sm:text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Change
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Visual 51 Remaining Cards Deck Grid */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-400 px-1">
                <span className="font-bold text-slate-300">
                  51 Left Cards {phase === 'MIXING' ? '(Shuffling...)' : '(Committed & Ready)'}
                </span>
                <span className="font-mono text-[10px] sm:text-[11px] text-amber-400">
                  1 Aside + {remainingVisualSlots.length} Mixed
                </span>
              </div>
              <div className="grid grid-cols-9 sm:grid-cols-9 md:grid-cols-[repeat(13,minmax(0,1fr))] gap-1 sm:gap-2 justify-items-center py-1">
                {remainingVisualSlots.map((slotId, pos) => {
                  const wobbleClass =
                    phase === 'MIXING'
                      ? (pos + mixTick) % 3 === 0
                        ? '-rotate-6 -translate-y-1 scale-95'
                        : (pos + mixTick) % 3 === 1
                        ? 'rotate-6 translate-y-1 scale-95'
                        : 'rotate-0 scale-105'
                      : 'hover:-translate-y-0.5';
                  return (
                    <div key={`${slotId}-${pos}`} className={`transition-all duration-200 ${wobbleClass}`}>
                      <LettiCard hidden size="xs" highlight="NONE" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* PHASE 4 & 5: STEP-BY-STEP ALTERNATING FLIP DUEL TABLE */
          <div className="flex-1 flex flex-col gap-2.5 sm:gap-5">
            {/* Top Center: Locked Secret Card, Remaining Counter & Match Status Banner */}
            <div className="flex flex-row items-center justify-between gap-2.5 sm:gap-4 bg-[#111827] border border-slate-800 rounded-2xl p-2.5 sm:p-4">
              <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                <LettiCard
                  card={pickedCard}
                  hidden={!showSecretToUser}
                  size="sm"
                  highlight={
                    roundOutcome
                      ? roundOutcome.won
                        ? 'USER_WIN'
                        : 'SYSTEM_WIN'
                      : 'SELECTED'
                  }
                  labelBadge="SECRET"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-wider">
                      Secret Target
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSecretToUser(!showSecretToUser)}
                      className="lg:hidden px-1.5 py-0.5 rounded bg-slate-800 text-[9px] font-bold text-slate-200 flex items-center gap-0.5 cursor-pointer"
                      title={showSecretToUser ? 'Hide secret card' : 'Peek secret card'}
                    >
                      {showSecretToUser ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5 text-amber-400" />}
                    </button>
                  </div>
                  <h3 className="text-xs sm:text-base font-black text-white truncate">
                    {showSecretToUser
                      ? `${pickedCard?.label} (${pickedCard?.suit})`
                      : 'Hidden (Yours)'}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                    {isDealing
                      ? `Flip #${revealedSteps.length + 1} → ${
                          currentTurnSide === 'USER' ? 'USER TURN' : 'SYSTEM TURN'
                        } • ${remainingUnflippedCount} Left`
                      : roundOutcome
                      ? `${roundOutcome.roundCode} • Matched #${roundOutcome.totalFlips}`
                      : 'Ready'}
                  </p>
                </div>
              </div>

              {/* Outcome Result Pill */}
              {roundOutcome ? (
                <div
                  className={`px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl border text-center shrink-0 ${
                    roundOutcome.won
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="font-black text-[11px] sm:text-sm uppercase tracking-wider flex items-center justify-center gap-1">
                    <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {roundOutcome.won ? `WON +${roundOutcome.payout} ETB` : `LOST -${roundOutcome.betAmount} ETB`}
                  </div>
                  <span className="text-[9px] sm:text-[11px] font-semibold opacity-90 block">
                    {roundOutcome.won ? 'User Side Matched!' : 'System Side Matched'}
                  </span>
                </div>
              ) : (
                <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0 text-right">
                  <div>{currentTurnSide === 'USER' ? 'USER TURN' : 'SYSTEM TURN'}</div>
                  <div className="text-[9px] font-mono opacity-80">{remainingUnflippedCount}/51 Left</div>
                </div>
              )}
            </div>

            {/* Split Dual Side Board: Side-by-side even on mobile */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 flex-1">
              {/* USER SIDE (Odd steps 1, 3, 5...) */}
              <div
                className={`rounded-2xl border-2 p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 transition-all ${
                  roundOutcome?.winnerSide === 'USER'
                    ? 'bg-emerald-950/25 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                    : currentTurnSide === 'USER' && isDealing
                    ? 'bg-[#111827] border-emerald-400/70 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : 'bg-[#111827]/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 sm:pb-2">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    USER SIDE
                    {currentTurnSide === 'USER' && isDealing && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">
                    {userSideCards.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 sm:gap-2 items-start min-h-[84px] sm:min-h-[120px]">
                  {userSideCards.map((s) => (
                    <div key={s.step} className="flex flex-col items-center gap-0.5 sm:gap-1">
                      <LettiCard
                        card={s.card}
                        size="sm"
                        flipOnMount
                        highlight={
                          s.matched
                            ? 'USER_WIN'
                            : s.step === latestRevealedStep && isDealing
                            ? 'NEWEST'
                            : 'NONE'
                        }
                      />
                      <span className="text-[9px] sm:text-[10px] font-mono text-slate-500">#{s.step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SYSTEM SIDE (Even steps 2, 4, 6...) */}
              <div
                className={`rounded-2xl border-2 p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 transition-all ${
                  roundOutcome?.winnerSide === 'SYSTEM'
                    ? 'bg-rose-950/25 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
                    : currentTurnSide === 'SYSTEM' && isDealing
                    ? 'bg-[#111827] border-rose-400/70 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                    : 'bg-[#111827]/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 sm:pb-2">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    SYSTEM SIDE
                    {currentTurnSide === 'SYSTEM' && isDealing && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                    )}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-mono text-slate-400">
                    {systemSideCards.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 sm:gap-2 items-start min-h-[84px] sm:min-h-[120px]">
                  {systemSideCards.map((s) => (
                    <div key={s.step} className="flex flex-col items-center gap-0.5 sm:gap-1">
                      <LettiCard
                        card={s.card}
                        size="sm"
                        flipOnMount
                        highlight={
                          s.matched
                            ? 'SYSTEM_WIN'
                            : s.step === latestRevealedStep && isDealing
                            ? 'NEWEST'
                            : 'NONE'
                        }
                      />
                      <span className="text-[9px] sm:text-[10px] font-mono text-slate-500">#{s.step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Post-round Action Bar */}
            {showDuelBoard && !isDealing && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {roundOutcome?.won && (
                  <button
                    type="button"
                    onClick={() => mixRemainingCards()}
                    disabled={!pickedCard || betAmount <= 0 || betAmount > balance}
                    className="px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" /> Won! Flip Again (Mix 51)
                  </button>
                )}
                <button
                  type="button"
                  onClick={backToPicker}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    roundOutcome?.won
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Pick New Card (52 Deck)
                </button>
                {roundOutcome && (
                  <button
                    type="button"
                    onClick={() => {
                      const found = history.find((h) => h.roundId === roundOutcome.roundId);
                      if (found) openRoundVerifier(found);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Verify Fair Seed
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Recent Letti Rounds Strip (Clickable to inspect & verify!) */}
        <div className="pt-2.5 sm:pt-3 border-t border-slate-800 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase shrink-0 flex items-center gap-1">
            <History className="w-3 h-3" /> History:
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {history.length === 0 ? (
              <span className="text-xs text-slate-500">No rounds played yet.</span>
            ) : (
              history.map((h) => (
                <button
                  key={h.roundId}
                  type="button"
                  onClick={() => openRoundVerifier(h)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg font-mono text-[10px] sm:text-[11px] font-bold shrink-0 border cursor-pointer hover:brightness-110 transition-all ${
                    h.won
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  }`}
                  title="Click to view details & verify Provably Fair proof"
                >
                  {h.roundCode} • {h.pickedCard.label} • {h.won ? `+${h.payout}` : `-${h.betAmount}`} ({h.winningFlip})
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Replace Secret Card Confirmation Modal */}
      {pendingReplaceCardIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-black text-sm">
              <AlertTriangle className="w-5 h-5" /> Replace Locked Secret Card?
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your current round (<strong>{preparedRound?.roundCode}</strong>) already has a committed 51-card shuffle ready. Replacing your card will cancel it and prepare a new fair shuffle.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelReplaceCard}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
              >
                Keep Current Card
              </button>
              <button
                type="button"
                onClick={confirmReplaceCard}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer"
              >
                Replace Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Round Details & Provably Fair Verifier Modal */}
      {selectedHistoryRound && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 text-xs text-slate-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-black text-white">
                    Round {selectedHistoryRound.roundCode}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {new Date(selectedHistoryRound.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeRoundVerifier}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 bg-[#0b101b] border border-slate-800 rounded-xl p-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Selected Card</span>
                <span className="text-white font-black">
                  {selectedHistoryRound.pickedCard.label} of {selectedHistoryRound.pickedCard.suit}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Result / Flip</span>
                <span className={selectedHistoryRound.won ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'}>
                  {selectedHistoryRound.won ? 'WIN' : 'LOSS'} ({selectedHistoryRound.winningFlip})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Bet Amount</span>
                <span className="text-white font-mono font-bold">{selectedHistoryRound.betAmount} ETB</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Return (1.90×)</span>
                <span className="text-emerald-400 font-mono font-bold">{selectedHistoryRound.payout} ETB</span>
              </div>
            </div>

            <div className="space-y-2 bg-[#0b101b] border border-slate-800 rounded-xl p-3 font-mono text-[11px]">
              <div>
                <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">
                  Server Seed Hash (SHA-256 Commitment)
                </span>
                <span className="text-slate-200 break-all">{selectedHistoryRound.serverSeedHash}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">
                  Revealed Server Seed
                </span>
                <span className="text-amber-300 break-all">{selectedHistoryRound.serverSeed}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">Client Seed</span>
                  <span className="text-slate-200 break-all">{selectedHistoryRound.clientSeed}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans uppercase font-bold block">Nonce</span>
                  <span className="text-white font-bold">#{selectedHistoryRound.nonce}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60">
              {isVerifying ? (
                <div className="text-amber-300 font-bold flex items-center gap-2">
                  <Shuffle className="w-4 h-4 animate-spin" /> Recomputing SHA-256 commitment and 51-card shuffle...
                </div>
              ) : verifyResult ? (
                <div className="space-y-1.5">
                  <div
                    className={`font-black flex items-center gap-1.5 ${
                      verifyResult.isValid ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {verifyResult.isValid
                      ? 'VERIFIED: SHA-256 Seed & 51-Card Shuffle Match Authoritative Outcome'
                      : 'VERIFICATION FAILED'}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Recomputed winner: <strong>{verifyResult.winnerSide}</strong> on flip #{verifyResult.totalFlips} ({verifyResult.matchedCard.label} of {verifyResult.matchedCard.suit}) • Payout: {verifyResult.payout} ETB.
                  </p>
                </div>
              ) : (
                <div className="text-rose-300">Unable to verify round right now.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                How to Play Letti
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2.5 leading-relaxed">
              <li>
                <strong className="text-white">1. Pick 1 Secret Card:</strong> Choose any card from the 52-card deck (Mystery, Open Rank/Suit, or Random Pick). It remains private to you throughout the round.
              </li>
              <li>
                <strong className="text-white">2. Server Commits &amp; Mixes 51 Cards:</strong> The backend generates a SHA-256 seed commitment and deterministically shuffles the remaining 51 cards before asking your confirmation.
              </li>
              <li>
                <strong className="text-white">3. Confirm Bet &amp; Alternating Flips:</strong> Confirm your wager to reveal the exact server sequence — first on <strong>USER SIDE</strong>, then on <strong>SYSTEM SIDE</strong> — until a matching rank flips.
              </li>
              <li>
                <strong className="text-white">4. 1.90× Total Return &amp; Verification:</strong> Win on <strong>USER SIDE</strong> for <strong>1.90× total return</strong> (e.g. 100 ETB → 190 ETB) and keep flipping or pick a new card. On loss, pick a new secret card. Click any round in History to verify its revealed SHA-256 seed!
              </li>
            </ul>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
