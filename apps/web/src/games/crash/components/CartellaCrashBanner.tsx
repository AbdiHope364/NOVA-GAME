import React from 'react';
import { Trophy } from 'lucide-react';

export const CartellaCrashBanner: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center gap-2 w-full select-none pt-1">
      {/* 1. Winner Condition Banner */}
      <div className="flex items-center justify-center gap-2.5 w-full bg-gradient-to-r from-[#210940] via-[#2d0e57] to-[#210940] border-2 border-amber-500/60 rounded-2xl py-2 px-3 shadow-[0_0_15px_rgba(245,158,11,0.25)] z-10">
        <Trophy className="w-5 h-5 text-amber-400 fill-amber-300 shrink-0" />
        <span className="text-xs sm:text-sm font-bold text-white text-center">
          Cash out before the plane flies away to{' '}
          <span className="text-amber-300 font-black tracking-wide">WIN!</span>
        </span>
      </div>

      {/* 2. Good Luck Banner */}
      <div className="flex items-center justify-center gap-2 w-[80%] max-w-[280px] bg-gradient-to-r from-[#1c0836] via-[#2a0e4d] to-[#1c0836] border border-amber-500/40 rounded-full py-1.5 px-4 shadow-md z-10">
        <span className="text-amber-400 text-xs">★</span>
        <span className="text-amber-200 font-black text-xs sm:text-sm tracking-wider uppercase">
          Good Luck & Fly High!
        </span>
        <span className="text-amber-400 text-xs">★</span>
      </div>
    </div>
  );
};
