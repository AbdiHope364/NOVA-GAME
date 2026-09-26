import React from 'react';

export interface ResultProps {
  won: boolean;
  resultSide: 'HEADS' | 'TAILS';
  payout: number;
  betAmount: number;
}

export const Result: React.FC<ResultProps> = ({ won, resultSide, payout, betAmount }) => {
  return (
    <div
      className={`p-4 rounded-xl border flex items-center justify-between transition-all animate-fade-in ${
        won
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{won ? '🎉' : '💥'}</span>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm uppercase tracking-wide">
            {won ? 'YOU WON!' : 'YOU LOST'}
          </span>
          <span className="text-xs opacity-80">
            Flipped {resultSide}
          </span>
        </div>
      </div>

      <div className="text-right font-mono">
        <div className="text-lg font-extrabold">
          {won ? `+${payout} ETB` : `-${betAmount} ETB`}
        </div>
        <div className="text-[10px] opacity-70">
          {won ? '1.96x Payout' : '0.00x Payout'}
        </div>
      </div>
    </div>
  );
};
