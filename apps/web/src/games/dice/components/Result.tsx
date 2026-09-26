import React from 'react';
import { useI18nStore } from '../../../stores/i18nStore';

export interface ResultProps {
  won: boolean;
  rolledNumber: number;
  targetNumber: number;
  payout: number;
  betAmount: number;
}

export const Result: React.FC<ResultProps> = ({ won, rolledNumber, targetNumber, payout, betAmount }) => {
  const t = useI18nStore((s) => s.t);
  const diceFaces: Record<number, string> = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅',
  };

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
            {won ? t.games.dice.youWon : t.games.dice.youLost}
          </span>
          <span className="text-xs opacity-80 flex items-center gap-1">
            {t.games.dice.rolled} {diceFaces[rolledNumber]} ({rolledNumber}) vs Pick ({targetNumber})
          </span>
        </div>
      </div>

      <div className="text-right font-mono">
        <div className="text-lg font-extrabold">
          {won ? `+${payout} ETB` : `-${betAmount} ETB`}
        </div>
        <div className="text-[10px] opacity-70">
          {won ? t.games.dice.payoutMultiplier : '0.00x Payout'}
        </div>
      </div>
    </div>
  );
};
