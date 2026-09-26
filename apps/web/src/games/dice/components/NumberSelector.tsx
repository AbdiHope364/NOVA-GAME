import React from 'react';
import { useI18nStore } from '../../../stores/i18nStore';

export interface NumberSelectorProps {
  selectedNumber: number;
  onChange: (num: number) => void;
  betAmount: number;
  disabled?: boolean;
}

export const NumberSelector: React.FC<NumberSelectorProps> = ({ selectedNumber, onChange, betAmount, disabled }) => {
  const t = useI18nStore((s) => s.t);
  const numbers = [1, 2, 3, 4, 5, 6];
  const diceFaces: Record<number, string> = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅',
  };

  const possibleWin = Math.floor(betAmount * 5.0); // 5.0x multiplier rule (10 ETB -> 50 ETB)

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
        <span>{t.games.dice.pickNumber}</span>
        <span className="text-emerald-400 font-mono font-bold">
          Possible win: {possibleWin} ETB (5.0x)
        </span>
      </div>

      {/* 2-Row, 3-Column Grid for perfect 320-430px mobile responsiveness */}
      <div className="grid grid-cols-3 gap-3">
        {numbers.map((num) => (
          <button
            key={num}
            type="button"
            disabled={disabled}
            onClick={() => onChange(num)}
            className={`py-3.5 px-2 rounded-xl font-extrabold text-xl border flex flex-col items-center justify-center gap-1 transition-all duration-200 transform active:scale-95 disabled:opacity-50 ${
              selectedNumber === num
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400/50 scale-[1.03]'
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <span className="text-3xl leading-none">{diceFaces[num]}</span>
            <span className="text-xs font-mono font-bold">{num}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
