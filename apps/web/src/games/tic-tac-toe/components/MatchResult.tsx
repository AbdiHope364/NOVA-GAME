import React from 'react';
import { Trophy, RefreshCw, Home, Shield, Swords } from 'lucide-react';
import { FrontendTttMatch, TttSymbol } from '../types/ticTacToe.types';

export interface MatchResultProps {
  match: FrontendTttMatch;
  mySymbol: TttSymbol;
  currentUserId?: string;
  onRematch: () => void;
  onReturnToHome: () => void;
}

export const MatchResult: React.FC<MatchResultProps> = ({
  match,
  mySymbol,
  currentUserId,
  onRematch,
  onReturnToHome,
}) => {
  const isDraw = match.winnerSymbol === 'DRAW';
  const isWinner = !isDraw && (match.winnerSymbol === mySymbol || match.winnerId === currentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-[400px] p-6 rounded-3xl bg-slate-950/95 border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isDraw ? 'bg-amber-500' : isWinner ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        />

        {/* Icon & Title */}
        <div className="relative z-10">
          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border-2 mb-3 shadow-lg ${
              isDraw
                ? 'bg-amber-950/60 border-amber-400 text-amber-300'
                : isWinner
                ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                : 'bg-rose-950/60 border-rose-500 text-rose-400'
            }`}
          >
            {isDraw ? (
              <Swords className="w-8 h-8" />
            ) : isWinner ? (
              <Trophy className="w-8 h-8 animate-bounce" />
            ) : (
              <Shield className="w-8 h-8" />
            )}
          </div>

          <h2
            className={`text-2xl sm:text-3xl font-black tracking-wider ${
              isDraw ? 'text-amber-300' : isWinner ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isDraw ? 'DRAW MATCH' : isWinner ? 'VICTORY!' : 'DEFEAT'}
          </h2>

          <p className="text-xs text-slate-400 mt-1 font-semibold">
            {match.endReason === 'RESIGN'
              ? 'Opponent surrendered the match'
              : match.endReason === 'TIMEOUT'
              ? 'Match ended due to turn timeout'
              : match.endReason === 'FORFEIT'
              ? 'Opponent disconnected from arena'
              : isDraw
              ? 'Evenly matched duel'
              : 'Decisive 3-in-a-row victory'}
          </p>

          {/* Versus Summary Card */}
          <div className="mt-5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-cyan-400 font-bold block">PLAYER X</span>
              <span className="text-white text-xs font-bold">{match.playerX.username}</span>
            </div>

            <div className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-black text-slate-400">
              VS
            </div>

            <div className="text-right">
              <span className="text-[10px] text-fuchsia-400 font-bold block">PLAYER O</span>
              <span className="text-white text-xs font-bold">{match.playerO.username}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              onClick={onRematch}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm tracking-wider shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              PLAY AGAIN
            </button>

            <button
              type="button"
              onClick={onReturnToHome}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              RETURN TO ARENA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
