import React from 'react';
import { useI18nStore } from '../../../stores/i18nStore';

export interface DiceBoxProps {
  isRolling: boolean;
  result: number | null;
  targetNumber: number;
}

export const DiceBox: React.FC<DiceBoxProps> = ({ isRolling, result, targetNumber }) => {
  const t = useI18nStore((s) => s.t);
  const diceFaces: Record<number, string> = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅',
  };

  const displayVal = result || targetNumber;

  return (
    <div className="flex flex-col items-center justify-center my-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 p-6 shadow-inner">
      <span className="text-[10px] font-extrabold text-slate-500 tracking-widest uppercase mb-3">
        {isRolling ? t.games.dice.rolling : t.games.dice.rollResult}
      </span>

      <div className="perspective-1000 w-32 h-32 relative">
        <div
          className={`w-full h-full rounded-2xl border-4 shadow-2xl transition-all duration-700 transform-style-3d flex items-center justify-center ${
            isRolling
              ? 'animate-spin-flip border-cyan-400 bg-cyan-400/20 shadow-cyan-400/50'
              : result === targetNumber
              ? 'border-emerald-400 bg-gradient-to-tr from-emerald-600 via-emerald-400 to-teal-300 text-slate-950 shadow-emerald-400/50 scale-105'
              : result !== null
              ? 'border-rose-400 bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-400 text-slate-950 shadow-rose-400/40'
              : 'border-cyan-400 bg-gradient-to-tr from-slate-900 via-slate-850 to-slate-900 text-cyan-400 shadow-cyan-400/20'
          }`}
        >
          <div className="flex flex-col items-center justify-center select-none">
            <span className="text-6xl font-sans leading-none">
              {isRolling ? '🎲' : diceFaces[displayVal] || '🎲'}
            </span>
            <span className="text-[11px] font-black tracking-widest uppercase mt-2">
              {isRolling ? '...' : `NUMBER ${displayVal}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
