import React from 'react';
import { useI18nStore } from '../../../stores/i18nStore';
import { CircleDot } from 'lucide-react';

export interface RouletteWheelProps {
  isSpinning: boolean;
  resultNumber: number | null;
  resultColor: 'RED' | 'BLACK' | 'GREEN' | null;
}

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  isSpinning,
  resultNumber,
  resultColor,
}) => {
  const t = useI18nStore((s) => s.t);

  return (
    <div className="flex flex-col items-center justify-center my-2 sm:my-3 bg-slate-950/85 rounded-2xl border border-slate-800/90 p-4 sm:p-6 shadow-inner relative overflow-hidden">
      {/* Background radial glow effect */}
      <div
        className={`absolute -inset-10 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none opacity-40 ${
          isSpinning
            ? 'bg-amber-500/20 animate-pulse'
            : resultColor === 'RED'
            ? 'bg-rose-500/25'
            : resultColor === 'BLACK'
            ? 'bg-slate-700/30'
            : resultColor === 'GREEN'
            ? 'bg-emerald-500/25'
            : 'bg-cyan-500/10'
        }`}
      />

      <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2 sm:mb-4 z-10 flex items-center gap-1.5">
        <CircleDot className="w-3.5 h-3.5 text-amber-400" />
        <span>AFRICAN MINI ROULETTE (13 POCKETS)</span>
      </span>

      {/* 13-Pocket Wheel Container */}
      <div className="perspective-1000 w-36 h-36 sm:w-44 sm:h-44 relative flex items-center justify-center z-10">
        <div
          className={`w-full h-full rounded-full border-4 shadow-2xl transition-all duration-1000 transform-style-3d relative flex items-center justify-center ${
            isSpinning
              ? 'animate-spin-flip border-amber-400 bg-amber-400/10 shadow-amber-400/50'
              : resultColor === 'RED'
              ? 'border-rose-500 bg-gradient-to-tr from-rose-950 via-rose-900 to-rose-700 text-white shadow-rose-500/50 scale-105'
              : resultColor === 'BLACK'
              ? 'border-slate-600 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 text-white shadow-slate-900/80 scale-105'
              : resultColor === 'GREEN'
              ? 'border-emerald-400 bg-gradient-to-tr from-emerald-950 via-emerald-800 to-emerald-600 text-slate-950 shadow-emerald-400/50 scale-105'
              : 'border-slate-700 bg-gradient-to-tr from-slate-900 via-slate-850 to-slate-900 text-amber-400 shadow-slate-900/50'
          }`}
        >
          {/* Wheel Pocket Radial Ring Visualizer */}
          <div className="absolute inset-1 rounded-full border border-dashed border-slate-700/60 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center select-none text-center">
              {isSpinning ? (
                <CircleDot className="w-12 h-12 text-amber-400 animate-spin" />
              ) : resultNumber !== null ? (
                <span className="text-4xl font-extrabold font-mono drop-shadow-md">
                  {resultNumber}
                </span>
              ) : (
                <CircleDot className="w-12 h-12 text-slate-600" />
              )}
              <span className="text-[10px] font-black tracking-widest uppercase mt-1">
                {isSpinning
                  ? 'SPINNING...'
                  : resultColor
                  ? `${resultColor} POCKET`
                  : 'READY'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Wheel Pockets Legend Ribbon */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mt-3 sm:mt-5 text-[10px] sm:text-[11px] font-mono font-bold text-slate-400 z-10 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>ZERO: 0 (12.0x)</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>RED: 1,3,5,7,9,11</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
          <span>BLACK: 2,4,6,8,10,12</span>
        </span>
      </div>
    </div>
  );
};
