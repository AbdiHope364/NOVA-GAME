import React from 'react';
import { useI18nStore } from '../../../stores/i18nStore';
import { Plane, Flame, Rocket } from 'lucide-react';

export interface CrashChartProps {
  currentMultiplier: number;
  isFlying: boolean;
  isCrashed: boolean;
  isCashedOut: boolean;
  cashedOutMultiplier?: number;
  finalCrashPoint?: number;
  countdown?: number;
  isBetting?: boolean;
}

export const CrashChart: React.FC<CrashChartProps> = ({
  currentMultiplier,
  isFlying,
  isCrashed,
  isCashedOut,
  cashedOutMultiplier,
  finalCrashPoint,
  countdown = 5,
  isBetting = false,
}) => {
  const t = useI18nStore((s) => s.t);

  // SVG dimensions: 400x240
  // Exponential curve: Y grows up as multiplier grows
  const progress = Math.min(1, Math.max(0, (currentMultiplier - 1) / 9)); // Scale for 1x to 10x
  const startX = 30;
  const startY = 210;
  const endX = startX + progress * 340;
  const endY = startY - Math.pow(progress, 1.6) * 180;

  // Quadratic bezier path
  const controlX = startX + (endX - startX) * 0.65;
  const controlY = startY;
  const pathD = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
  const areaD = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY} L ${endX} ${startY} Z`;

  return (
    <div className="relative w-full h-56 sm:h-64 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
      {/* Background Neon Grid Effect */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* SVG Canvas for Curve & Gradient Area */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 240">
        <defs>
          <linearGradient id="crashGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {isFlying && (
          <>
            {/* Area under curve */}
            <path d={areaD} fill="url(#crashGlow)" className="transition-all duration-75" />
            {/* Curve stroke */}
            <path
              d={pathD}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="4"
              strokeLinecap="round"
              className="transition-all duration-75"
            />
          </>
        )}
      </svg>

      {/* Flying Aviator Plane Icon */}
      {isFlying && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
          style={{ left: `${(endX / 400) * 100}%`, top: `${(endY / 240) * 100}%` }}
        >
          <Plane className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400 fill-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.9)] transform -rotate-12" />
        </div>
      )}

      {/* Crashed Explosion Indicator */}
      {isCrashed && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-ping"
          style={{ left: `${(endX / 400) * 100}%`, top: `${(endY / 240) * 100}%` }}
        >
          <Flame className="w-10 h-10 sm:w-12 sm:h-12 text-rose-500 fill-rose-500 drop-shadow-[0_0_16px_rgba(244,63,94,0.9)]" />
        </div>
      )}

      {/* 5-Second Countdown Display during Betting Phase */}
      {isBetting ? (
        <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none select-none">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#1e293b"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#06b6d4"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * Math.max(0, countdown)) / 5}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
              />
            </svg>
            <span className="absolute text-3xl sm:text-4xl font-black font-mono text-cyan-400 animate-pulse">
              {countdown > 0 ? `${countdown}s` : 'GO!'}
            </span>
          </div>

          <span className="mt-2 text-xs font-black tracking-widest uppercase px-3.5 py-1 rounded-full border bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5 text-cyan-400" />
            <span>NEXT ROUND TAKEOFF IN {countdown}s</span>
          </span>
        </div>
      ) : (
        /* Live Multiplier Display */
        <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none select-none">
          <div
            className={`text-5xl sm:text-6xl font-black font-mono tracking-tight transition-transform ${
              isCrashed
                ? 'text-rose-500 scale-105'
                : isCashedOut
                ? 'text-emerald-400'
                : isFlying
                ? 'text-cyan-400 scale-100'
                : 'text-slate-400'
            }`}
          >
            {isCrashed
              ? `${(finalCrashPoint ?? currentMultiplier ?? 1.0).toFixed(2)}x`
              : `${(currentMultiplier ?? 1.0).toFixed(2)}x`}
          </div>

          {/* Status Badge */}
          <div className="mt-2 text-xs sm:text-sm font-bold uppercase tracking-wider">
            {isCrashed ? (
              <span className="text-rose-500 font-black animate-pulse flex items-center gap-1">
                <Flame className="w-4 h-4" /> {t.games.crash.crashed}!
              </span>
            ) : isCashedOut ? (
              <span className="text-emerald-400 font-extrabold">
                {t.games.crash.cashedOut} @ {(cashedOutMultiplier ?? currentMultiplier ?? 1.0).toFixed(2)}x
              </span>
            ) : isFlying ? (
              <span className="text-cyan-400 animate-pulse font-mono flex items-center gap-1">
                <Plane className="w-3.5 h-3.5" /> Flying...
              </span>
            ) : (
              <span className="text-slate-500">Preparing next flight...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
