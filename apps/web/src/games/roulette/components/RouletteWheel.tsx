import React from 'react';
import { useI18nStore } from '../../../stores/i18nStore';

export interface RouletteWheelProps {
  isSpinning: boolean;
  resultNumber: number | null;
  resultColor: 'RED' | 'BLACK' | 'GREEN' | null;
}

export const RouletteWheel: React.FC<RouletteWheelProps> = ({ isSpinning, resultNumber, resultColor }) => {
  const t = useI18nStore((s) => s.t);

  return (
    <div className="flex flex-col items-center justify-center my-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 p-6 shadow-inner">
      <span className="text-[10px] font-extrabold text-slate-500 tracking-widest uppercase mb-3">
        {isSpinning ? t.games.roulette.spinning : t.games.roulette.spinResult}
      </span>

      <div className="perspective-1000 w-32 h-32 relative">
        <div
          className={`w-full h-full rounded-full border-4 shadow-2xl transition-all duration-700 transform-style-3d flex flex-col items-center justify-center ${
            isSpinning
              ? 'animate-spin-flip border-emerald-400 bg-emerald-400/20 shadow-emerald-400/50'
              : resultColor === 'RED'
              ? 'border-rose-500 bg-gradient-to-tr from-rose-700 via-rose-600 to-pink-500 text-white shadow-rose-500/50 scale-105'
              : resultColor === 'BLACK'
              ? 'border-slate-600 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 text-white shadow-slate-900/80 scale-105'
              : resultColor === 'GREEN'
              ? 'border-emerald-400 bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-400 text-slate-950 shadow-emerald-400/50 scale-105'
              : 'border-emerald-500 bg-gradient-to-tr from-slate-900 via-slate-850 to-slate-900 text-emerald-400 shadow-emerald-500/20'
          }`}
        >
          <div className="flex flex-col items-center justify-center select-none">
            <span className="text-4xl font-extrabold font-mono">
              {isSpinning ? '🎡' : resultNumber !== null ? resultNumber : '🎡'}
            </span>
            <span className="text-[10px] font-black tracking-widest uppercase mt-1">
              {isSpinning ? '...' : resultColor || 'SPIN'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
