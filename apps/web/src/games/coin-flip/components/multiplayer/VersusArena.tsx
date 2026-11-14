import React from 'react';
import { Coin } from '../Coin';
import { HeadsCoinSvg, TailsCoinSvg } from '../CoinArtwork';
import { CoinFlipRoom } from '../../hooks/useCoinFlipMultiplayer';
import { useAuthStore } from '../../../../stores/authStore';
import { Trophy, Swords, ShieldCheck, User, RotateCcw, ArrowRight } from 'lucide-react';

export interface VersusArenaProps {
  room: CoinFlipRoom;
  countdown: number | null;
  isFlipping: boolean;
  settledMatch: CoinFlipRoom | null;
  onRematch?: () => void;
  onExit: () => void;
}

export const VersusArena: React.FC<VersusArenaProps> = ({
  room,
  countdown,
  isFlipping,
  settledMatch,
  onRematch,
  onExit,
}) => {
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const p1 = room.playerOne;
  const p2 = room.playerTwo;

  const isCompleted = room.status === 'COMPLETED' || settledMatch !== null;
  const winner = isCompleted
    ? room.winnerId === p1.userId
      ? p1
      : p2
    : null;

  const isUserWinner = winner && currentUserId ? winner.userId === currentUserId : null;
  const netPayout = (room.pot * 0.975).toFixed(2);

  return (
    <div className="w-full flex flex-col items-center select-none py-2">
      {/* Versus Head-to-Head Card */}
      <div className="w-full rounded-3xl bg-gradient-to-b from-[#0c101c] via-[#070b14] to-[#04060b] border border-slate-800/90 p-5 sm:p-8 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden min-h-[500px]">
        {/* Overhead Spotlights */}
        <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Match Pot & Info */}
        <div className="relative z-10 w-full flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-bold">
              Room #{room.roomCode}
            </span>
            <span className="text-slate-500 hidden sm:inline">1v1 PvP Arena</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Total Pot:</span>
            <span className="text-emerald-400 font-black text-sm sm:text-base">
              {room.pot} ETB
            </span>
            <span className="text-[10px] text-slate-500 font-bold">(2.5% Fee)</span>
          </div>
        </div>

        {/* Players Versus Row */}
        <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-11 gap-4 items-center my-6">
          {/* PLAYER 1 CARD */}
          <div
            className={`md:col-span-5 rounded-2xl p-4 border flex items-center justify-between gap-3 transition-all ${
              winner && winner.userId === p1.userId
                ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.35)] ring-2 ring-emerald-500/50'
                : 'bg-[#0a0f1d] border-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shrink-0">
                <div className="w-full h-full rounded-[14px] bg-[#070b14] flex items-center justify-center font-black text-amber-400 text-lg">
                  {p1.username.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-white">{p1.username}</span>
                  {currentUserId === p1.userId && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                      YOU
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono text-slate-400 block mt-0.5">
                  Stake: {p1.stake} ETB
                </span>
              </div>
            </div>

            {/* Side Selection Pill */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                <span className="w-4 h-4">
                  {p1.choice === 'HEADS' ? (
                    <HeadsCoinSvg className="w-full h-full" />
                  ) : (
                    <TailsCoinSvg className="w-full h-full" />
                  )}
                </span>
                <span>{p1.choice}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono mt-1 font-bold">
                READY
              </span>
            </div>
          </div>

          {/* CENTER VS BADGE */}
          <div className="md:col-span-1 flex flex-col items-center justify-center my-2 md:my-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center">
              <div className="w-full h-full bg-[#070b14] rounded-full flex items-center justify-center text-amber-300 font-black text-xs">
                VS
              </div>
            </div>
          </div>

          {/* PLAYER 2 CARD */}
          <div
            className={`md:col-span-5 rounded-2xl p-4 border flex items-center justify-between gap-3 transition-all ${
              p2
                ? winner && winner.userId === p2.userId
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.35)] ring-2 ring-emerald-500/50'
                  : 'bg-[#0a0f1d] border-slate-800'
                : 'bg-[#0a0f1d]/50 border-dashed border-slate-800 text-slate-500'
            }`}
          >
            {p2 ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-lg shrink-0">
                    <div className="w-full h-full rounded-[14px] bg-[#070b14] flex items-center justify-center font-black text-cyan-400 text-lg">
                      {p2.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-white">{p2.username}</span>
                      {currentUserId === p2.userId && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-400 block mt-0.5">
                      Stake: {p2.stake} ETB
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                    <span className="w-4 h-4">
                      {p2.choice === 'HEADS' ? (
                        <HeadsCoinSvg className="w-full h-full" />
                      ) : (
                        <TailsCoinSvg className="w-full h-full" />
                      )}
                    </span>
                    <span>{p2.choice}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono mt-1 font-bold">
                    READY
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full py-2 flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-slate-400">
                  Waiting for Challenger to join...
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center 3D Synchronized Coin Presentation */}
        <div className="relative z-10 my-4 flex flex-col items-center">
          {countdown !== null && countdown > 0 && (
            <div className="mb-2 text-center">
              <span className="text-4xl sm:text-5xl font-mono font-black text-amber-400 animate-bounce block">
                {countdown}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Match Starting...
              </span>
            </div>
          )}

          <Coin
            isFlipping={isFlipping}
            flipPhase={isFlipping ? 'FLIPPING' : isCompleted ? 'RESULT' : 'IDLE'}
            result={room.winningSide}
            choice={p1.choice}
            won={winner ? (currentUserId ? winner.userId === currentUserId : true) : null}
          />
        </div>

        {/* Match Settlement & Winner Announcement */}
        {isCompleted && winner && (
          <div className="relative z-20 w-full max-w-lg mt-3 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#0e1713] to-[#07130d] border border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.35)] text-center space-y-3 animate-fade-in">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
              <h2 className="text-lg sm:text-xl font-black text-emerald-300 uppercase tracking-wider">
                {winner.username} WON THE MATCH!
              </h2>
            </div>

            <p className="text-xs font-mono text-slate-300">
              Landed on <strong className="text-amber-400 font-black">{room.winningSide}</strong> · Net Winner Payout: <strong className="text-emerald-400 font-black">+{netPayout} ETB</strong>
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              {onRematch && (
                <button
                  type="button"
                  onClick={onRematch}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <RotateCcw className="w-4 h-4" /> Rematch
                </button>
              )}
              <button
                type="button"
                onClick={onExit}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Return to Lobby
              </button>
            </div>
          </div>
        )}

        {/* Bottom Hash Footnote */}
        <div className="relative z-10 mt-4 text-center">
          <span className="text-[10px] font-mono text-slate-500">
            Provably Fair SHA-256 Hash: {room.serverSeedHash}
          </span>
        </div>
      </div>
    </div>
  );
};
