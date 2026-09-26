import React from 'react';
import { Button } from '@nova/ui';
import { useI18nStore } from '../../../stores/i18nStore';

export interface BetSelectorProps {
  amount: number;
  onChange: (val: number) => void;
  maxBalance: number;
  disabled?: boolean;
}

export const BetSelector: React.FC<BetSelectorProps> = ({ amount, onChange, maxBalance, disabled }) => {
  const t = useI18nStore((s) => s.t);
  const quickAmounts = [10, 50, 100, 500];

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span>{t.games.roulette.betAmount}</span>
        <span className="text-emerald-400">{t.common.balance}: {maxBalance.toFixed(0)} ETB</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            disabled={disabled}
            value={amount}
            onChange={(e) => onChange(Math.max(1, Number(e.target.value)))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-lg font-bold focus:outline-none focus:border-cyan-500 transition-colors pr-14"
          />
          <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-500">ETB</span>
        </div>

        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => onChange(Math.max(1, Math.floor(amount / 2)))}
          className="px-3"
        >
          ½
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => onChange(Math.min(maxBalance, amount * 2))}
          className="px-3"
        >
          2x
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => onChange(maxBalance)}
          className="px-3 text-xs"
        >
          MAX
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-1">
        {quickAmounts.map((q) => (
          <button
            key={q}
            type="button"
            disabled={disabled}
            onClick={() => onChange(q)}
            className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              amount === q
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
            }`}
          >
            +{q} ETB
          </button>
        ))}
      </div>
    </div>
  );
};
