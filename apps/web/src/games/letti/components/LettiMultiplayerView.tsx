import React, { useMemo, useState } from 'react';
import { LettiEngine } from '@nova/game-letti';
import { LettiPvpFlip, LettiPvpPlayerView } from '@nova/types';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  EyeOff,
  History,
  KeyRound,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Swords,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { LettiCard } from './LettiCard';
import { useLettiMultiplayer } from '../hooks/useLettiMultiplayer';

interface LettiMultiplayerViewProps {
  initialRoomCode?: string | null;
}

const STAKE_PRESETS = [10, 25, 50, 100, 250, 500, 1000];

export const LettiMultiplayerView: React.FC<LettiMultiplayerViewProps> = ({
  initialRoomCode,
}) => {
  const {
    user,
    isAuthenticated,
    cashBalance,
    bonusBalance,
    config,
    stakeEtb,
    setStakeEtb,
    roomCodeInput,
    setRoomCodeInput,
    activeRoom,
    history,
    loading,
    busyAction,
    error,
    setError,
    bannerMessage,
    turnCountdown,
    opponentDisconnectCountdown,
    socketConnected,
    startQuickMatch,
    createPrivateRoom,
    joinRoom,
    pickSecretCard,
    markReady,
    flipCard,
    leaveOrForfeitRoom,
    requestRematch,
    dismissFinishedRoom,
  } = useLettiMultiplayer(initialRoomCode);

  const [pickerMode, setPickerMode] = useState<'MYSTERY' | 'OPEN'>('MYSTERY');
  const [showMySecret, setShowMySecret] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [confirmForfeit, setConfirmForfeit] = useState<boolean>(false);

  const fullDeck = useMemo(() => LettiEngine.createFullDeck(), []);

  // Deterministic pseudo-random mystery layout per room so indices stay hidden yet spread
  const mysteryIndices = useMemo(() => {
    const arr = Array.from({ length: 52 }, (_, i) => i);
    const seedStr = activeRoom?.roomId || 'letti-pvp-lobby';
    let h = 2166136261;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    for (let i = arr.length - 1; i > 0; i--) {
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      const j = (h >>> 0) % (i + 1);
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }, [activeRoom?.roomId]);

  const handleCopy = async (text: string, kind: 'CODE' | 'LINK') => {
    try {
      await navigator.clipboard.writeText(text);
      if (kind === 'CODE') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 1800);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 1800);
      }
    } catch {
      // Clipboard blocked fallback
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto my-6 bg-[#111827] border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <Users size={24} />
        </div>
        <h2 className="text-xl font-black text-white">Sign In for Letti 1v1 Face-to-Face</h2>
        <p className="text-sm text-slate-400">
          Compete against real NOVA GAMING players at a live shared table with Quick Match or Private Room invites.
        </p>
      </div>
    );
  }

  if (!config.enabled && !activeRoom) {
    return (
      <div className="max-w-2xl mx-auto my-6 bg-[#111827] border border-amber-500/30 rounded-2xl p-6 text-center space-y-3 shadow-xl">
        <h2 className="text-lg font-bold text-amber-400">Letti 1v1 Multiplayer Paused</h2>
        <p className="text-sm text-slate-400">
          Multiplayer rooms are currently paused by platform administrators. Try Solo vs House mode or check back shortly.
        </p>
      </div>
    );
  }

  // =========================================================================
  // ACTIVE ROOM — FACE-TO-FACE TABLE VIEW
  // =========================================================================
  if (activeRoom) {
    const mySeat = activeRoom.mySeat || 1;
    const myPlayer: LettiPvpPlayerView | null =
      mySeat === 1 ? activeRoom.playerOne : activeRoom.playerTwo;
    const opponent: LettiPvpPlayerView | null =
      mySeat === 1 ? activeRoom.playerTwo : activeRoom.playerOne;

    const myFlips: LettiPvpFlip[] =
      mySeat === 1 ? activeRoom.playerOneFlips : activeRoom.playerTwoFlips;
    const opponentFlips: LettiPvpFlip[] =
      mySeat === 1 ? activeRoom.playerTwoFlips : activeRoom.playerOneFlips;

    const myUserId = myPlayer?.userId || user?.id;
    const isMyTurn =
      activeRoom.phase === 'PLAYING' &&
      Boolean(myUserId) &&
      activeRoom.currentTurnUserId === myUserId;

    const isWaitingForOpponent = activeRoom.roomStatus === 'WAITING' || !opponent;
    const canPickOrChangeCard =
      !isWaitingForOpponent &&
      (activeRoom.phase === 'PICKING' || activeRoom.phase === 'READY') &&
      !myPlayer?.ready;

    const inviteUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/games/letti?room=${activeRoom.roomCode}`
        : `?room=${activeRoom.roomCode}`;

    const didIWin =
      activeRoom.phase === 'COMPLETED' &&
      activeRoom.winnerId &&
      myUserId &&
      activeRoom.winnerId === myUserId;
    const isDraw = activeRoom.phase === 'COMPLETED' && activeRoom.resultType === 'DRAW';
    const isCancelled =
      activeRoom.phase === 'CANCELLED' ||
      activeRoom.roomStatus === 'CANCELLED' ||
      activeRoom.roomStatus === 'EXPIRED';

    const iAcceptedRematch =
      Boolean(myUserId) && activeRoom.rematchAcceptedBy.includes(myUserId!);

    const renderPlayerSeat = (
      player: LettiPvpPlayerView | null,
      isSelf: boolean,
      isTurn: boolean
    ) => {
      const seatLabel = player ? `Seat ${player.seat}` : 'Waiting...';
      const isConnected = player?.connectionStatus === 'CONNECTED';
      const initial = (player?.username?.[0] || '?').toUpperCase();

      return (
        <div
          className={`rounded-2xl border p-3 sm:p-4 transition-all ${
            isTurn
              ? 'bg-emerald-950/40 border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.2)]'
              : 'bg-[#111827] border-slate-800'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Avatar + Username + Connection */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-sm shrink-0 border ${
                  isSelf
                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                    : 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                }`}
              >
                {player ? initial : '?'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm sm:text-base truncate">
                    {player ? (isSelf ? `${player.username} (You)` : player.username) : 'Waiting for Opponent...'}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {seatLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                  {player && (
                    <span className="inline-flex items-center gap-1">
                      {isConnected ? (
                        <>
                          <Wifi size={12} className="text-emerald-400" />
                          <span className="text-emerald-400">Live</span>
                        </>
                      ) : (
                        <>
                          <WifiOff size={12} className="text-amber-400" />
                          <span className="text-amber-400">
                            Offline{!isSelf && opponentDisconnectCountdown ? ` (${opponentDisconnectCountdown}s)` : ''}
                          </span>
                        </>
                      )}
                    </span>
                  )}
                  <span className="font-semibold text-slate-300">
                    Stake: {activeRoom.stakeEtb.toLocaleString()} ETB
                  </span>
                  {isSelf && (
                    <span className="hidden sm:inline text-emerald-400 font-semibold">
                      Cash: {cashBalance.toLocaleString()} ETB
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status badges + Secret Card */}
            <div className="flex items-center gap-2.5 ml-auto">
              {player && activeRoom.phase !== 'COMPLETED' && (
                <div className="flex flex-col items-end gap-1">
                  {isTurn && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] uppercase tracking-wide animate-pulse">
                      <Zap size={12} /> {isSelf ? 'Your Turn' : 'Opponent Turn'}
                      {turnCountdown !== null ? ` · ${turnCountdown}s` : ''}
                    </span>
                  )}
                  {!isTurn && activeRoom.phase !== 'PLAYING' && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        player.ready
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : player.hasPicked
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {player.ready
                        ? 'Ready to Play'
                        : player.hasPicked
                        ? 'Card Picked'
                        : 'Picking Card...'}
                    </span>
                  )}
                </div>
              )}

              {/* Secret Card Slot */}
              {isSelf ? (
                <div className="flex items-center gap-1.5">
                  {activeRoom.myPickedCard && (
                    <button
                      type="button"
                      onClick={() => setShowMySecret((v) => !v)}
                      title={showMySecret ? 'Hide secret card' : 'Show secret card'}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      {showMySecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                  <LettiCard
                    size="xs"
                    card={activeRoom.myPickedCard}
                    hidden={!activeRoom.myPickedCard || (!showMySecret && activeRoom.phase !== 'COMPLETED')}
                    highlight={didIWin ? 'USER_WIN' : activeRoom.myPickedCard ? 'SELECTED' : 'NONE'}
                    labelBadge={activeRoom.myPickedCard ? 'YOU' : undefined}
                  />
                </div>
              ) : (
                <LettiCard
                  size="xs"
                  card={activeRoom.opponentPickedCard}
                  hidden={!activeRoom.opponentPickedCard}
                  highlight={
                    activeRoom.phase === 'COMPLETED' && activeRoom.winnerId && !didIWin && !isDraw
                      ? 'SYSTEM_WIN'
                      : 'NONE'
                  }
                  labelBadge={activeRoom.opponentPickedCard ? 'OPP' : undefined}
                />
              )}
            </div>
          </div>
        </div>
      );
    };

    const renderFlipsStrip = (
      flips: LettiPvpFlip[],
      title: string,
      isSelfSide: boolean
    ) => {
      const latestStep = Math.max(
        0,
        ...activeRoom.playerOneFlips.map((f) => f.step),
        ...activeRoom.playerTwoFlips.map((f) => f.step)
      );

      return (
        <div className="bg-[#0b131e]/90 border border-slate-800/90 rounded-xl p-2.5 sm:p-3 flex flex-col gap-2 min-h-[120px]">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold ${isSelfSide ? 'text-amber-300' : 'text-sky-300'}`}>
              {title} ({flips.length})
            </span>
            {flips.some((f) => f.matched) && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[10px] uppercase">
                RANK MATCH!
              </span>
            )}
          </div>
          {flips.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[11px] text-slate-600 italic py-4">
              No flips yet
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {flips.map((flip) => (
                <LettiCard
                  key={`${flip.step}-${flip.card.index}`}
                  card={flip.card}
                  size="xs"
                  flipOnMount
                  highlight={
                    flip.matched
                      ? isSelfSide
                        ? 'USER_WIN'
                        : 'SYSTEM_WIN'
                      : flip.step === latestStep
                      ? 'NEWEST'
                      : 'NONE'
                  }
                  labelBadge={`#${flip.step}`}
                />
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="max-w-4xl mx-auto space-y-3 pb-6 select-none">
        {/* Top Navigation & Room Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#111827] border border-slate-800 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-black tracking-wider border border-emerald-500/30">
              ROOM {activeRoom.roomCode}
            </span>
            <span className="text-slate-400">
              Pot:{' '}
              <strong className="text-white">{activeRoom.totalPotEtb.toLocaleString()} ETB</strong>
            </span>
            <span className="hidden sm:inline text-slate-500">·</span>
            <span className="hidden sm:inline text-emerald-400 font-semibold">
              Winner: {activeRoom.winnerPayoutEtb.toLocaleString()} ETB
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                socketConnected
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  socketConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                }`}
              />
              {socketConnected ? 'Real-Time' : 'Reconnecting'}
            </span>

            {activeRoom.phase !== 'COMPLETED' && !isCancelled && (
              <>
                {activeRoom.phase === 'PLAYING' && !confirmForfeit ? (
                  <button
                    type="button"
                    onClick={() => setConfirmForfeit(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold"
                  >
                    <LogOut size={12} /> Forfeit
                  </button>
                ) : activeRoom.phase === 'PLAYING' && confirmForfeit ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={busyAction === 'LEAVE'}
                      onClick={() => {
                        setConfirmForfeit(false);
                        leaveOrForfeitRoom();
                      }}
                      className="px-2 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px]"
                    >
                      Confirm Forfeit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmForfeit(false)}
                      className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={busyAction === 'LEAVE'}
                    onClick={leaveOrForfeitRoom}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold"
                  >
                    <LogOut size={12} /> Leave Room
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Status / Error Alerts */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-200 underline text-xs shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {bannerMessage && !error && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm rounded-xl px-3.5 py-2 flex items-center gap-2">
            <Sparkles size={14} className="text-emerald-400 shrink-0" />
            <span>{bannerMessage}</span>
          </div>
        )}

        {/* SEAT 2 / TOP: OPPONENT */}
        {renderPlayerSeat(
          opponent,
          false,
          activeRoom.phase === 'PLAYING' && Boolean(opponent) && activeRoom.currentTurnUserId === opponent?.userId
        )}

        {/* CENTER SHARED CARD TABLE */}
        <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-b from-[#0b1f1a] via-[#0b1520] to-[#0a1019] p-3 sm:p-5 shadow-2xl space-y-4">
          {/* Waiting Room Invite State */}
          {isWaitingForOpponent && !isCancelled && (
            <div className="py-5 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
                <Clock size={13} className="animate-spin" /> Waiting for Second Player...
              </div>

              <div className="max-w-md mx-auto bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-3">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Share Room Code or Invite Link
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black tracking-[0.2em] text-white font-mono">
                    {activeRoom.roomCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeRoom.roomCode, 'CODE')}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    title="Copy room code"
                  >
                    {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(inviteUrl, 'LINK')}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  {copiedLink ? <Check size={14} /> : <UserPlus size={14} />}
                  {copiedLink ? 'Invite Link Copied!' : 'Copy Direct Invite Link'}
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Your {activeRoom.stakeEtb.toLocaleString()} ETB stake is held safely in room escrow and refunded automatically if cancelled before start.
              </p>
            </div>
          )}

          {/* Cancelled / Expired Banner */}
          {isCancelled && (
            <div className="py-6 text-center space-y-3">
              <h3 className="text-lg font-black text-slate-200">
                Room {activeRoom.roomStatus === 'EXPIRED' ? 'Expired' : 'Cancelled'}
              </h3>
              <p className="text-xs text-slate-400">
                Any locked stakes for this room have been safely refunded to player cash balances.
              </p>
              <button
                type="button"
                onClick={dismissFinishedRoom}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm"
              >
                Back to 1v1 Lobby
              </button>
            </div>
          )}

          {/* PICKING & READY PHASE */}
          {!isWaitingForOpponent &&
            !isCancelled &&
            (activeRoom.phase === 'PICKING' || activeRoom.phase === 'READY') && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white">
                      {!myPlayer?.hasPicked
                        ? 'Step 1: Pick Your Secret Card'
                        : !myPlayer?.ready
                        ? 'Step 2: Confirm Ready to Lock Stake'
                        : 'Waiting for Opponent to Ready Up...'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Your secret card is hidden from your opponent until the match finishes. First player to flip a matching rank wins!
                    </p>
                  </div>

                  {canPickOrChangeCard && (
                    <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setPickerMode('MYSTERY')}
                        className={`px-2.5 py-1 rounded-lg font-bold ${
                          pickerMode === 'MYSTERY'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Mystery
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickerMode('OPEN')}
                        className={`px-2.5 py-1 rounded-lg font-bold ${
                          pickerMode === 'OPEN'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Open Deck
                      </button>
                      <button
                        type="button"
                        disabled={busyAction === 'PICK'}
                        onClick={() => pickSecretCard(Math.floor(Math.random() * 52))}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold inline-flex items-center gap-1 hover:bg-amber-500/25"
                      >
                        <Shuffle size={12} /> Random
                      </button>
                    </div>
                  )}
                </div>

                {/* 52-card selector while player has not locked READY */}
                {canPickOrChangeCard && (
                  <div className="grid grid-cols-7 sm:grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5 justify-items-center bg-[#09111b]/80 border border-slate-800/80 rounded-xl p-2.5">
                    {(pickerMode === 'MYSTERY' ? mysteryIndices : fullDeck.map((c) => c.index)).map(
                      (deckIdx) => {
                        const isPicked = activeRoom.myPickedCard?.index === deckIdx;
                        const cardObj = fullDeck[deckIdx];
                        return (
                          <button
                            key={deckIdx}
                            type="button"
                            disabled={busyAction === 'PICK'}
                            onClick={() => pickSecretCard(deckIdx)}
                            className={`rounded-lg transition-transform hover:-translate-y-0.5 ${
                              isPicked ? 'ring-2 ring-amber-400 scale-105' : ''
                            }`}
                          >
                            <LettiCard
                              size="xs"
                              card={pickerMode === 'OPEN' || isPicked ? cardObj : null}
                              hidden={pickerMode === 'MYSTERY' && !isPicked}
                              highlight={isPicked ? 'SELECTED' : 'NONE'}
                            />
                          </button>
                        );
                      }
                    )}
                  </div>
                )}

                {/* Ready Confirmation Bar */}
                {myPlayer?.hasPicked && !myPlayer?.ready && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3">
                    <div className="text-xs text-slate-300">
                      Secret card chosen:{' '}
                      <strong className="text-amber-300">
                        {activeRoom.myPickedCard?.label}
                      </strong>
                      . Confirm ready to start the{' '}
                      <strong className="text-white">
                        {activeRoom.totalPotEtb.toLocaleString()} ETB
                      </strong>{' '}
                      duel.
                    </div>
                    <button
                      type="button"
                      disabled={busyAction === 'READY'}
                      onClick={markReady}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black text-sm inline-flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      {busyAction === 'READY' ? 'Confirming...' : 'Ready to Duel'}
                    </button>
                  </div>
                )}
              </div>
            )}

          {/* PLAYING & COMPLETED SHARED ARENA */}
          {!isWaitingForOpponent &&
            !isCancelled &&
            (activeRoom.phase === 'PLAYING' || activeRoom.phase === 'COMPLETED') && (
              <div className="space-y-3">
                {/* Shared Deck Bar */}
                <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span className="text-slate-300 font-semibold">
                      Shared Remaining Deck:{' '}
                      <strong className="text-white">{activeRoom.remainingDeckCount} / 50</strong>
                    </span>
                  </div>
                  {activeRoom.serverSeedHash && (
                    <span className="hidden sm:inline font-mono text-[11px] text-slate-500">
                      Commit: {activeRoom.serverSeedHash.slice(0, 14)}...
                    </span>
                  )}
                </div>

                {/* Face-to-Face Flip Lanes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderFlipsStrip(
                    opponentFlips,
                    `${opponent?.username || 'Opponent'} Flips`,
                    false
                  )}
                  {renderFlipsStrip(myFlips, 'Your Flips', true)}
                </div>

                {/* Completed Result Summary + Mutual Rematch */}
                {activeRoom.phase === 'COMPLETED' && (
                  <div
                    className={`rounded-2xl border p-4 space-y-3 ${
                      didIWin
                        ? 'bg-emerald-950/40 border-emerald-500/40'
                        : isDraw
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : 'bg-rose-950/30 border-rose-500/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Trophy
                          size={22}
                          className={
                            didIWin
                              ? 'text-amber-400'
                              : isDraw
                              ? 'text-amber-300'
                              : 'text-rose-400'
                          }
                        />
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-white">
                            {didIWin
                              ? `Victory! +${activeRoom.winnerPayoutEtb.toLocaleString()} ETB`
                              : isDraw
                              ? 'Match Draw — Stakes Refunded'
                              : activeRoom.resultType === 'FORFEIT'
                              ? 'Defeat (Forfeit)'
                              : 'Opponent Matched First!'}
                          </h3>
                          <p className="text-xs text-slate-300">
                            Total Pot: {activeRoom.totalPotEtb.toLocaleString()} ETB · Platform Fee:{' '}
                            {activeRoom.platformFeeEtb.toLocaleString()} ETB
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={busyAction === 'REMATCH' || iAcceptedRematch}
                          onClick={requestRematch}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm inline-flex items-center gap-1.5 disabled:opacity-60"
                        >
                          <RefreshCw size={14} />
                          {iAcceptedRematch
                            ? `Waiting Opponent (${activeRoom.rematchAcceptedBy.length}/2)`
                            : activeRoom.rematchAcceptedBy.length > 0
                            ? 'Accept Rematch (1/2)'
                            : 'Play Again (Rematch)'}
                        </button>
                        <button
                          type="button"
                          onClick={dismissFinishedRoom}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700"
                        >
                          Lobby
                        </button>
                      </div>
                    </div>

                    {/* Revealed Secret Cards + Provably Fair Seed */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                      <div className="flex items-center gap-4">
                        <span>
                          Your Secret:{' '}
                          <strong className="text-amber-300">
                            {activeRoom.myPickedCard?.label || '—'}
                          </strong>
                        </span>
                        <span>
                          Opponent Secret:{' '}
                          <strong className="text-sky-300">
                            {activeRoom.opponentPickedCard?.label || '—'}
                          </strong>
                        </span>
                      </div>
                      {activeRoom.serverSeed && (
                        <span className="font-mono text-[11px] text-emerald-300">
                          Seed: {activeRoom.serverSeed.slice(0, 16)}... (nonce {activeRoom.nonce})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* SEAT 1 / BOTTOM: CURRENT PLAYER + PRIMARY ACTION */}
        {renderPlayerSeat(myPlayer, true, isMyTurn)}

        {activeRoom.phase === 'PLAYING' && (
          <div className="sticky bottom-2 z-20">
            <button
              type="button"
              disabled={!isMyTurn || busyAction === 'FLIP'}
              onClick={flipCard}
              className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-base sm:text-lg tracking-wide transition-all shadow-2xl flex items-center justify-center gap-2 ${
                isMyTurn
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 text-slate-950 hover:brightness-110 active:scale-[0.99]'
                  : 'bg-slate-800/95 text-slate-400 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Swords size={20} />
              {busyAction === 'FLIP'
                ? 'Flipping Card...'
                : isMyTurn
                ? `FLIP CARD (${activeRoom.remainingDeckCount} left)`
                : `Waiting for ${opponent?.username || 'Opponent'} to Flip...`}
            </button>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // LOBBY VIEW (Quick Match | Create Private Room | Join Room | History)
  // =========================================================================
  const allowedPresets = STAKE_PRESETS.filter(
    (s) => s >= config.minStakeEtb && s <= config.maxStakeEtb
  );
  const effectivePot = stakeEtb * 2;
  const effectiveFee = Number(((effectivePot * config.platformFeePercent) / 100).toFixed(2));
  const effectiveWinnerPayout = Number((effectivePot - effectiveFee).toFixed(2));

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-10">
      {/* Header + Cash Eligibility Banner */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
            <Swords size={14} /> 1v1 Real-Time Face-to-Face Table
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Letti Card Multiplayer Lobby
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Pick 1 secret card, lock equal stakes, and take turns flipping from the shared 50-card deck. First rank match wins the pot!
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-3 shrink-0 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            <Wallet size={12} className="text-emerald-400" />
            {config.allowBonusBalance ? 'Available Balance' : 'Real Cash Balance (PvP)'}
          </div>
          <div className="text-xl font-black text-emerald-400">
            {cashBalance.toLocaleString()} ETB
          </div>
          {!config.allowBonusBalance && bonusBalance > 0 && (
            <div className="text-[11px] text-amber-400/90">
              Promo bonus ({bonusBalance.toLocaleString()} ETB) excluded from PvP
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs sm:text-sm rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-200 underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Shared Stake Selector */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Select Match Stake (ETB)
            </h3>
            <p className="text-xs text-slate-400">
              Limits: {config.minStakeEtb.toLocaleString()} – {config.maxStakeEtb.toLocaleString()} ETB · Platform Fee: {config.platformFeePercent}%
            </p>
          </div>
          <div className="text-right text-xs">
            <div className="text-slate-400">
              Total Pot: <strong className="text-white">{effectivePot.toLocaleString()} ETB</strong>
            </div>
            <div className="text-emerald-400 font-bold">
              Winner Payout: {effectiveWinnerPayout.toLocaleString()} ETB
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {allowedPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setStakeEtb(preset)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all border ${
                stakeEtb === preset
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {preset.toLocaleString()} ETB
            </button>
          ))}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-slate-400">Custom:</span>
            <input
              type="number"
              min={config.minStakeEtb}
              max={config.maxStakeEtb}
              value={stakeEtb}
              onChange={(e) => setStakeEtb(Math.max(1, Number(e.target.value)))}
              className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 3 Lobby Mode Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* A. Quick Match */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-emerald-500/40 transition-colors">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap size={20} />
            </div>
            <h3 className="text-base font-black text-white">Quick Match</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatically pair with another player looking for a{' '}
              <strong className="text-white">{stakeEtb.toLocaleString()} ETB</strong> duel.
            </p>
          </div>
          <button
            type="button"
            disabled={!config.quickMatchEnabled || busyAction === 'QUICK_MATCH' || loading}
            onClick={startQuickMatch}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black text-sm disabled:opacity-50"
          >
            {busyAction === 'QUICK_MATCH'
              ? 'Matching...'
              : !config.quickMatchEnabled
              ? 'Disabled by Admin'
              : 'Find Opponent'}
          </button>
        </div>

        {/* B. Create Private Room */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-amber-500/40 transition-colors">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UserPlus size={20} />
            </div>
            <h3 className="text-base font-black text-white">Create Private Room</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate a unique room code and shareable invitation link to duel a friend face-to-face.
            </p>
          </div>
          <button
            type="button"
            disabled={!config.privateRoomsEnabled || busyAction === 'CREATE' || loading}
            onClick={createPrivateRoom}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm disabled:opacity-50"
          >
            {busyAction === 'CREATE'
              ? 'Creating...'
              : !config.privateRoomsEnabled
              ? 'Disabled by Admin'
              : 'Create Room'}
          </button>
        </div>

        {/* C. Join Room by Code */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-sky-500/40 transition-colors">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <KeyRound size={20} />
            </div>
            <h3 className="text-base font-black text-white">Join Room</h3>
            <p className="text-xs text-slate-400">
              Enter a friend&apos;s room code to enter their table.
            </p>
            <input
              type="text"
              placeholder="e.g. LTT-4F8A"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white uppercase placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="button"
            disabled={!roomCodeInput.trim() || busyAction === 'JOIN' || loading}
            onClick={() => joinRoom(roomCodeInput)}
            className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm disabled:opacity-50"
          >
            {busyAction === 'JOIN' ? 'Joining...' : 'Join Table'}
          </button>
        </div>
      </div>

      {/* Match History */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <History size={16} className="text-emerald-400" /> Recent 1v1 Matches
          </h3>
          <span className="text-xs text-slate-500">{history.length} matches</span>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No completed 1v1 Letti matches yet. Challenge an opponent above!
          </p>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {history.map((item) => (
              <div
                key={item.roomId}
                className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-md font-black uppercase ${
                      item.isDraw
                        ? 'bg-amber-500/15 text-amber-300'
                        : item.didWin
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-rose-500/15 text-rose-300'
                    }`}
                  >
                    {item.isDraw ? 'DRAW' : item.didWin ? 'WIN' : 'LOSS'}
                  </span>
                  <span className="font-bold text-white">
                    vs {item.opponent?.username || 'Player'}
                  </span>
                  <span className="text-slate-500 font-mono">{item.roomCode}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <span>Stake: {item.stakeEtb.toLocaleString()} ETB</span>
                  <span
                    className={`font-bold ${
                      item.didWin
                        ? 'text-emerald-400'
                        : item.isDraw
                        ? 'text-amber-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.didWin
                      ? `+${item.winnerPayoutEtb.toLocaleString()} ETB`
                      : item.isDraw
                      ? `Refund ${item.stakeEtb.toLocaleString()} ETB`
                      : `-${item.stakeEtb.toLocaleString()} ETB`}
                  </span>
                  <span className="text-slate-500 hidden sm:inline">
                    {item.totalFlips} flips
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
