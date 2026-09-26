import React from 'react';
import { useI18nStore } from '../../../stores/i18nStore';

export interface BetTypeSelectorProps {
  selected: 'RED' | 'BLACK' | 'GREEN';
  onChange: (val: 'RED' | 'BLACK' | 'GREEN') => void;
  disabled?: boolean;
}

export const BetTypeSelector: React.FC<BetTypeSelectorProps> = ({ selected, onChange, disabled }) => {
  const t = useI18nStore((s) => s.t);

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
        {t.games.roulette.chooseBet}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('RED')}
          className={`py-3.5 px-4 rounded-xl font-extrabold text-sm border flex items-center justify-center gap-2 transition-all duration-200 transform active:scale-95 disabled:opacity-50 ${
            selected === 'RED'
              ? 'bg-rose-600/25 border-rose-500 text-rose-300 shadow-lg shadow-rose-600/20 ring-2 ring-rose-500/50'
              : 'bg-slate-900/90 border-slate-800 text-rose-400 hover:border-slate-700'
          }`}
        >
          <span>{t.games.roulette.red}</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('BLACK')}
          className={`py-3.5 px-4 rounded-xl font-extrabold text-sm border flex items-center justify-center gap-2 transition-all duration-200 transform active:scale-95 disabled:opacity-50 ${
            selected === 'BLACK'
              ? 'bg-slate-800 border-slate-600 text-white shadow-lg shadow-slate-800/30 ring-2 ring-slate-500/50'
              : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          <span>{t.games.roulette.black}</span>
        </button>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('GREEN')}
        className={`py-3.5 px-4 rounded-xl font-extrabold text-sm border flex items-center justify-center gap-2 transition-all duration-200 transform active:scale-95 disabled:opacity-50 mt-1 ${
          selected === 'GREEN'
            ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-600/20 ring-2 ring-emerald-500/50'
            : 'bg-slate-900/90 border-slate-800 text-emerald-400 hover:border-slate-700'
        }`}
      >
        <span>{t.games.roulette.green}</span>
      </button>
    </div>
  );
};
