import React from 'react';
import { useI18nStore } from '../../../stores/i18nStore';

export interface ResultProps {
  won: boolean;
  multiplier: number;
  crashPoint: number;
  payout: number;
  betAmount: number;
}

export const Result: React.FC<ResultProps> = ({ won, multiplier, crashPoint, payout, betAmount }) => {
  const t = useI18nStore((s) => s.t);

  return (
    <div
      className={`p-4 rounded-xl border flex items-center justify-between transition-all animate-fade-in ${
        won
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{won ? '🎉' : '💥'}</span>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm uppercase tracking-wide">
            {won ? t.games.crash.youCashedOut : t.games.crash.rocketCrashed}
          </span>
          <span className="text-xs opacity-80">
            {won ? `${t.games.crash.cashedOut} ${multiplier.toFixed(2)}x` : `${t.games.crash.crashed} ${crashPoint.toFixed(2)}x`}
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
