import React from 'react';
import { Trophy, Flame } from 'lucide-react';

export interface ResultProps {
  won: boolean;
  isBombHit: boolean;
  multiplier: number;
  payout: number;
  betAmount: number;
}

export const Result: React.FC<ResultProps> = ({ won, isBombHit, multiplier, payout, betAmount }) => {
  return (
    <div
      className={`p-4 rounded-xl border flex items-center justify-between transition-all animate-fade-in ${
        won
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
      }`}
    >
      <div className="flex items-center gap-3">
        {won ? (
          <Trophy className="w-8 h-8 text-emerald-400" />
        ) : (
          <Flame className="w-8 h-8 text-rose-500 animate-pulse" />
        )}
        <div className="flex flex-col">
          <span className="font-extrabold text-sm uppercase tracking-wide">
            {won ? 'CASHED OUT SUCCESSFULLY!' : isBombHit ? 'BOMB EXPLODED!' : 'GAME OVER'}
          </span>
          <span className="text-xs opacity-80">
            {won ? `Secured ${multiplier.toFixed(2)}x Multiplier` : 'Hit hidden mine tile'}
          </span>
        </div>
      </div>

      <div className="text-right font-mono">
        <div className="text-lg font-extrabold">
          {won ? `+${payout} ETB` : `-${betAmount} ETB`}
        </div>
        <div className="text-[10px] opacity-70">
          {won ? `${multiplier.toFixed(2)}x Payout` : '0.00x Payout'}
        </div>
      </div>
    </div>
  );
};
