import React from 'react';
import { Gamepad2, Sparkles, ShieldCheck, Trophy, Dices } from 'lucide-react';

export interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  icon?: 'gamepad' | 'sparkles' | 'shield' | 'trophy' | 'dice';
  compact?: boolean;
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading Arena...',
  submessage = 'Connecting to Provably Fair Game Engine',
  icon = 'gamepad',
  compact = false,
  className = '',
}) => {
  const IconComponent =
    icon === 'sparkles'
      ? Sparkles
      : icon === 'shield'
      ? ShieldCheck
      : icon === 'trophy'
      ? Trophy
      : icon === 'dice'
      ? Dices
      : Gamepad2;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center select-none ${
        compact ? 'py-8 px-4' : 'min-h-[380px] sm:min-h-[460px] py-12 px-4'
      } ${className}`}
    >
      {/* Radiant Glowing Gyroscope / Orbital Rings */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Soft Ambient Neon Glow Behind Rings */}
        <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-cyan-500/20 via-violet-600/25 to-pink-500/20 blur-2xl animate-pulse" />

        {/* Outer Orbital Ring with Gradient Border */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-transparent border-t-cyan-400 border-r-violet-500 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '2.5s' }}>
          {/* Orbital Satellite Dot */}
          <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]" />
        </div>

        {/* Middle Counter-Spinning Ring */}
        <div
          className="absolute w-18 h-18 sm:w-20 sm:h-20 rounded-full border border-dashed border-violet-400/50 animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '4s' }}
        />

        {/* Inner Glowing Hex / Core */}
        <div className="absolute w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#1a2333] to-[#0c101c] border border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.25)] flex items-center justify-center transform hover:scale-105 transition-transform">
          <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-300 animate-pulse" />
        </div>
      </div>

      {/* Title / Main Message with Animated Shimmer Dots */}
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base sm:text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-violet-300">
          {message}
        </h3>
        {submessage && (
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            {submessage}
          </p>
        )}
      </div>

      {/* Sleek Neon Shimmer Progress Track */}
      <div className="mt-5 w-44 sm:w-56 h-1 rounded-full bg-slate-800/80 overflow-hidden relative border border-slate-700/50">
        <div
          className="absolute top-0 bottom-0 w-24 rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-violet-500 animate-shimmer-bar"
        />
      </div>

      {/* Security & Fairness Pill */}
      <div className="mt-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-300 uppercase tracking-widest">
        <ShieldCheck className="w-3 h-3 text-cyan-400" />
        <span>SHA-256 Provably Fair</span>
      </div>
    </div>
  );
};

export interface ButtonSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

export const ButtonSpinner: React.FC<ButtonSpinnerProps> = ({
  size = 'sm',
  className = '',
  color = 'currentColor',
}) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <svg
      className={`animate-spin ${sizeMap[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3.5"
      />
      <path
        className="opacity-90"
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 5,
  className = '',
}) => {
  return (
    <div className={`p-4 space-y-3 ${className}`}>
      {/* Table Header Placeholder */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5 pb-3 border-b border-slate-800">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 rounded bg-slate-800/80 animate-shimmer relative overflow-hidden"
          />
        ))}
      </div>

      {/* Row Placeholders */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="p-3 rounded-xl bg-[#0b101b]/60 border border-slate-800/60 grid gap-3 grid-cols-2 sm:grid-cols-5 items-center animate-shimmer relative overflow-hidden"
        >
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              className={`h-4 rounded ${
                c === 0 ? 'bg-cyan-500/20 w-3/4' : 'bg-slate-800/70'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export interface SkeletonCardsProps {
  count?: number;
  className?: string;
}

export const SkeletonCards: React.FC<SkeletonCardsProps> = ({
  count = 3,
  className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
}) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl bg-[#111827] border border-slate-800/80 space-y-3 animate-shimmer relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80" />
            <div className="w-16 h-5 rounded-full bg-slate-800/60" />
          </div>
          <div className="w-2/3 h-4 rounded bg-slate-800" />
          <div className="w-full h-3 rounded bg-slate-800/60" />
          <div className="w-4/5 h-3 rounded bg-slate-800/40" />
          <div className="pt-2 flex justify-between items-center border-t border-slate-800/50">
            <div className="w-20 h-4 rounded bg-slate-800/60" />
            <div className="w-14 h-7 rounded-lg bg-violet-600/30" />
          </div>
        </div>
      ))}
    </div>
  );
};
