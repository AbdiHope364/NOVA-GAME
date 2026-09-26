import React from 'react';
import { useI18nStore } from '../../../stores/i18nStore';

export interface AutoCashoutInputProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const AutoCashoutInput: React.FC<AutoCashoutInputProps> = ({ value, onChange, disabled }) => {
  const t = useI18nStore((s) => s.t);
  const presets = [1.5, 2.0, 3.0, 5.0];

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span>{t.games.crash.autoCashout}</span>
        <span className="text-cyan-400 font-mono font-bold">Target</span>
      </div>

      <div className="relative">
        <input
          type="number"
          step="0.1"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(Math.max(1.01, Number(e.target.value)))}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-base font-bold focus:outline-none focus:border-cyan-500 transition-colors pr-12"
        />
        <span className="absolute right-4 top-3 text-xs font-bold text-slate-500">x</span>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-1">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => onChange(p)}
            className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              value === p
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
            }`}
          >
            {p.toFixed(1)}x
          </button>
        ))}
      </div>
    </div>
  );
};
