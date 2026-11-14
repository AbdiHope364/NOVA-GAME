import React from 'react';
import { Trophy } from 'lucide-react';

export const CartellaDamaBanner: React.FC = () => {
  return (
    <div className="relative flex flex-col items-center gap-2.5 w-full max-w-[460px] mx-auto select-none pt-1">
      {/* Decorative Floating 3D Black Checker (Bottom-Left) */}
      <div className="absolute -left-3 bottom-0 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[radial-gradient(circle_at_35%_28%,#444444_0%,#181818_40%,#050505_95%)] shadow-2xl opacity-90 pointer-events-none flex items-center justify-center border border-stone-800 transform rotate-12">
        <div className="w-[60%] h-[60%] rounded-full border border-stone-700/60" />
      </div>

      {/* Decorative Floating 3D White Checker (Bottom-Right) */}
      <div className="absolute -right-3 bottom-0 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[radial-gradient(circle_at_35%_28%,#ffffff_0%,#f5f5f4_35%,#a8a29e_85%)] shadow-2xl opacity-90 pointer-events-none flex items-center justify-center border border-white/60 transform -rotate-12">
        <div className="w-[60%] h-[60%] rounded-full border border-stone-300/50" />
      </div>

      {/* 1. Winner Condition Banner */}
      <div className="flex items-center justify-center gap-2.5 w-full bg-gradient-to-r from-[#210940] via-[#2d0e57] to-[#210940] border-2 border-amber-500/60 rounded-2xl py-2 px-3 shadow-[0_0_15px_rgba(245,158,11,0.25)] z-10">
        <Trophy className="w-5 h-5 text-amber-400 fill-amber-300 shrink-0" />
        <span className="text-xs sm:text-sm font-bold text-white text-center">
          First to capture all opponent&apos;s pieces{' '}
          <span className="text-amber-300 font-black tracking-wide">WINS!</span>
        </span>
      </div>

      {/* 2. Good Luck Banner */}
      <div className="flex items-center justify-center gap-2 w-[80%] max-w-[280px] bg-gradient-to-r from-[#1c0836] via-[#2a0e4d] to-[#1c0836] border border-amber-500/40 rounded-full py-1.5 px-4 shadow-md z-10">
        <span className="text-amber-400 text-xs">★</span>
        <span className="text-amber-200 font-black text-xs sm:text-sm tracking-wider uppercase">
          Good Luck!
        </span>
        <span className="text-amber-400 text-xs">★</span>
      </div>
    </div>
  );
};
