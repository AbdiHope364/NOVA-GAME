import React from 'react';
import { useI18nStore } from '../../../stores/i18nStore';
import { Trophy, Flame } from 'lucide-react';
import { DiceIcon } from './DiceIcon';

export interface ResultProps {
  won: boolean;
  rolledNumber: number;
  targetNumber: number;
  payout: number;
  betAmount: number;
}

export const Result: React.FC<ResultProps> = ({ won, rolledNumber, targetNumber, payout, betAmount }) => {
  const t = useI18nStore((s) => s.t);

  return (
    <div
      className={`p-4 rounded-xl border flex items-center justify-between transition-all animate-fade-in ${
        won
          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/15'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
      }`}
    >
      <div className="flex items-center gap-3">
        {won ? (
          <Trophy className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        ) : (
          <Flame className="w-8 h-8 text-rose-500 animate-pulse" />
        )}
        <div className="flex flex-col">
          <span className="font-extrabold text-sm uppercase tracking-wide">
            {won ? t.games.dice.youWon : t.games.dice.youLost}
          </span>
          <span className="text-xs opacity-80 flex items-center gap-1.5 font-mono">
            <span>{t.games.dice.rolled}</span>
            <DiceIcon value={Math.round(rolledNumber)} className="w-4 h-4 inline-block" />
            <span>({rolledNumber}) vs Pick ({targetNumber})</span>
          </span>
        </div>
      </div>

      <div className="text-right font-mono">
        <div className={`text-lg font-extrabold ${won ? 'text-emerald-400' : 'text-rose-400'}`}>
          {won ? `+${payout} ETB` : `-${betAmount} ETB`}
        </div>
        <div className="text-[10px] opacity-70">
          {won ? t.games.dice.payoutMultiplier : '0.00x Payout'}
        </div>
      </div>
    </div>
  );
};
