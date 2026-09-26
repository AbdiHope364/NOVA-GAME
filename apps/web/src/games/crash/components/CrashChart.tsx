import React from 'react';
import { useI18nStore } from '../../../stores/i18nStore';

export interface CrashChartProps {
  currentMultiplier: number;
  isFlying: boolean;
  isCrashed: boolean;
  isCashedOut: boolean;
  cashedOutMultiplier?: number;
  finalCrashPoint?: number;
}

export const CrashChart: React.FC<CrashChartProps> = ({
  currentMultiplier,
  isFlying,
  isCrashed,
  isCashedOut,
  cashedOutMultiplier,
  finalCrashPoint,
}) => {
  const t = useI18nStore((s) => s.t);

  // SVG rocket curve calculation based on current multiplier [1.00 - 10.00+]
  const normalizedProgress = Math.min(1, (currentMultiplier - 1) / 5);
  const endX = 40 + normalizedProgress * 320;
  const endY = 220 - normalizedProgress * 170;

  return (
    <div className="relative h-64 bg-slate-950/90 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center overflow-hidden shadow-inner p-4">
      {/* Dynamic Animated Curve */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 240">
        <defs>
          <linearGradient id="crashGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isCrashed ? '#f43f5e' : isCashedOut ? '#10b981' : '#06b6d4'} stopOpacity="0.4" />
            <stop offset="100%" stopColor={isCrashed ? '#f43f5e' : isCashedOut ? '#10b981' : '#06b6d4'} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <path
          d={`M 20 220 Q ${endX / 2} 220, ${endX} ${endY} L ${endX} 240 L 20 240 Z`}
          fill="url(#crashGradient)"
        />

        <path
          d={`M 20 220 Q ${endX / 2} 220, ${endX} ${endY}`}
          fill="none"
          stroke={isCrashed ? '#f43f5e' : isCashedOut ? '#10b981' : '#06b6d4'}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

      {/* Floating Animated Rocket Icon */}
      {isFlying && (
        <div
          className="absolute transition-all duration-75 text-3xl transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(endX / 400) * 100}%`, top: `${(endY / 240) * 100}%` }}
        >
          🚀
        </div>
      )}

      {/* Live Multiplier Ticker */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div
          className={`text-5xl sm:text-6xl font-black font-mono tracking-tight transition-colors ${
            isCrashed
              ? 'text-rose-500 scale-105 animate-bounce'
              : isCashedOut
              ? 'text-emerald-400'
              : isFlying
              ? 'text-cyan-400 animate-pulse'
              : 'text-slate-400'
          }`}
        >
          {currentMultiplier.toFixed(2)}x
        </div>

        <span className="mt-2 text-xs font-black tracking-widest text-slate-400 uppercase">
          {isFlying
            ? t.games.crash.inFlight
            : isCrashed
            ? `${t.games.crash.crashed} ${finalCrashPoint?.toFixed(2)}x`
            : isCashedOut
            ? `${t.games.crash.cashedOut} ${cashedOutMultiplier?.toFixed(2)}x`
            : t.games.crash.readyForTakeoff}
        </span>
      </div>
    </div>
  );
};
