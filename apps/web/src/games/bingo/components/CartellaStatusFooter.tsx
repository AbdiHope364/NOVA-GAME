import React from 'react';
import { Users } from 'lucide-react';
import { CartellaRoundConfig } from '@nova/types';

interface CartellaStatusFooterProps {
  roundConfig: CartellaRoundConfig;
  countdown: number;
}

export const CartellaStatusFooter: React.FC<CartellaStatusFooterProps> = ({
  roundConfig,
  countdown,
}) => {
  // SVG circular countdown calculations
  const totalSeconds = roundConfig.nextNumberCountdown || 45;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (countdown / totalSeconds) * circumference;

  return (
    <div className="flex items-center justify-between gap-2 w-full select-none">
      {/* 1. Left: Circular Countdown Timer */}
      <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 68 68">
          {/* Background Ring */}
          <circle
            cx="34"
            cy="34"
            r={radius}
            stroke="#230a47"
            strokeWidth="5"
            fill="transparent"
          />
          {/* Progress Ring with Cyan to Magenta Gradient */}
          <defs>
            <linearGradient id="countdownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <circle
            cx="34"
            cy="34"
            r={radius}
            stroke="url(#countdownGrad)"
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Center Text inside Countdown Ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-base sm:text-xl font-black text-white leading-none font-sans drop-shadow-sm">
            {countdown}s
          </span>
          <span className="text-[8px] sm:text-[9px] font-bold text-slate-300 tracking-tight leading-tight mt-0.5 max-w-[50px]">
            Next Number in
          </span>
        </div>
      </div>

      {/* 2. Center: Game Status Pill with Pulsing LED */}
      <div className="flex flex-col items-center justify-center flex-1">
        <span className="text-[10px] sm:text-xs font-bold text-purple-200 uppercase tracking-wider mb-1">
          Game Status
        </span>
        <div className="flex items-center gap-2 px-5 sm:px-7 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 border border-green-300/50 shadow-[0_0_20px_rgba(34,197,94,0.6)] text-white font-black text-xs sm:text-base tracking-widest uppercase">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <span>{roundConfig.status === 'ON_GOING' ? 'ON GOING' : roundConfig.status}</span>
        </div>
      </div>

      {/* 3. Right: Active Players Card */}
      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-[#220745] to-[#16042e] border border-purple-700/60 rounded-2xl p-2 sm:p-3 w-20 sm:w-24 shrink-0 shadow-md">
        <Users className="w-5 h-5 text-purple-300 mb-0.5" />
        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-none">
          Players
        </span>
        <span className="text-xs sm:text-base font-black text-amber-300 leading-tight mt-0.5 font-mono">
          {roundConfig.activePlayers} / {roundConfig.maxSlots}
        </span>
      </div>
    </div>
  );
};
