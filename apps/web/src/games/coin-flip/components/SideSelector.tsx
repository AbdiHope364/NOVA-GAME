import React from 'react';

export interface SideSelectorProps {
  selected: 'HEADS' | 'TAILS';
  onChange: (side: 'HEADS' | 'TAILS') => void;
  disabled?: boolean;
}

export const SideSelector: React.FC<SideSelectorProps> = ({ selected, onChange, disabled }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
        Choose your side
      </label>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('HEADS')}
          className={`py-4 px-6 rounded-xl font-extrabold text-base border flex items-center justify-center gap-3 transition-all duration-200 transform active:scale-95 disabled:opacity-50 ${
            selected === 'HEADS'
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50'
              : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
          }`}
        >
          <span className="text-2xl">👑</span>
          <div className="flex flex-col items-start">
            <span>HEADS</span>
            <span className="text-[10px] text-amber-400/80 font-normal">1.96x Payout</span>
          </div>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('TAILS')}
          className={`py-4 px-6 rounded-xl font-extrabold text-base border flex items-center justify-center gap-3 transition-all duration-200 transform active:scale-95 disabled:opacity-50 ${
            selected === 'TAILS'
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/50'
              : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
          }`}
        >
          <span className="text-2xl">🦅</span>
          <div className="flex flex-col items-start">
            <span>TAILS</span>
            <span className="text-[10px] text-cyan-400/80 font-normal">1.96x Payout</span>
          </div>
        </button>
      </div>
    </div>
  );
};
