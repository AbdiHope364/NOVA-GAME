import React from 'react';
import { useI18nStore } from '../../../stores/i18nStore';

export interface AutoCashoutInputProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export const AutoCashoutInput: React.FC<AutoCashoutInputProps> = ({
  enabled,
  onToggle,
  value,
  onChange,
  disabled,
}) => {
  const t = useI18nStore((s) => s.t);
  const presets = [1.5, 2.0, 3.0, 5.0];

  const isInputDisabled = disabled || !enabled;

  return (
    <div className="flex flex-col gap-2.5 w-full bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enabled}
            disabled={disabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-900 cursor-pointer disabled:opacity-50"
          />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {t.games.crash.autoCashout || 'Enable Auto Cash-out'}
          </span>
        </label>
        <span
          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
            enabled ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800/60 text-slate-500'
          }`}
        >
          {enabled ? 'Active' : 'Disabled'}
        </span>
      </div>

      <div className="relative">
        <input
          type="number"
          step="0.1"
          disabled={isInputDisabled}
          value={value}
          onChange={(e) => onChange(Math.max(1.01, Number(e.target.value)))}
          className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-white font-mono text-base font-bold focus:outline-none transition-all pr-12 ${
            isInputDisabled
              ? 'opacity-40 border-slate-850 cursor-not-allowed bg-slate-900/40 text-slate-500'
              : 'border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500'
          }`}
        />
        <span className="absolute right-4 top-2.5 text-xs font-bold text-slate-500">x</span>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-0.5">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            disabled={isInputDisabled}
            onClick={() => onChange(p)}
            className={`py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              isInputDisabled
                ? 'opacity-30 border-slate-850 bg-slate-900 text-slate-600 cursor-not-allowed'
                : value === p && enabled
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            {p.toFixed(1)}x
          </button>
        ))}
      </div>
    </div>
  );
};
