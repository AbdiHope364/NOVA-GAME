import React from 'react';
import { Button } from '@nova/ui';

export interface BetSelectorProps {
  amount: number;
  onChange: (val: number) => void;
  maxBalance: number;
  disabled?: boolean;
}

export const BetSelector: React.FC<BetSelectorProps> = ({ amount, onChange, maxBalance, disabled }) => {
  const quickAmounts = [10, 50, 100, 250, 500];

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span>Bet Amount</span>
        <span className="text-emerald-400 font-mono">Balance: {maxBalance.toFixed(0)} ETB</span>
      </div>

      <div className="flex gap-1.5 sm:gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            disabled={disabled}
            value={amount}
            onChange={(e) => onChange(Math.max(1, Number(e.target.value)))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 sm:py-3 text-white font-mono text-base sm:text-lg font-bold focus:outline-none focus:border-cyan-500 transition-colors pr-12 sm:pr-14 min-h-[44px]"
          />
          <span className="absolute right-3.5 top-3 sm:top-3.5 text-xs font-bold text-slate-500">ETB</span>
        </div>

        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => onChange(Math.max(1, Math.floor(amount / 2)))}
          className="px-3 min-h-[44px] active:scale-95"
        >
          ½
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => onChange(Math.min(maxBalance, amount * 2))}
          className="px-3 min-h-[44px] active:scale-95"
        >
          2x
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => onChange(maxBalance)}
          className="px-3 text-xs min-h-[44px] active:scale-95"
        >
          MAX
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {quickAmounts.map((q) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => onChange(Math.min(maxBalance, q))}
            className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-300 border border-slate-700/80 active:scale-95 disabled:opacity-50 transition-colors"
          >
            +{q}
          </button>
        ))}
      </div>
    </div>
  );
};

