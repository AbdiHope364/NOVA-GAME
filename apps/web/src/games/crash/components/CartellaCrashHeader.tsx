import React from 'react';
import { Menu, Play, Eye } from 'lucide-react';

interface CartellaCrashHeaderProps {
  onMenuToggle?: () => void;
  viewerCount?: number;
}

export const CartellaCrashHeader: React.FC<CartellaCrashHeaderProps> = ({
  onMenuToggle,
  viewerCount = 1420,
}) => {
  return (
    <div className="relative flex items-center justify-between w-full pt-1 pb-2 px-1 select-none overflow-hidden">
      {/* Decorative Floating 3D Gold Coin (Top-Left) */}
      <div className="absolute -left-3 -top-1 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[radial-gradient(circle_at_35%_28%,#ffffff_0%,#f59e0b_35%,#78350f_85%)] shadow-2xl opacity-90 pointer-events-none flex items-center justify-center border border-amber-300/50 transform -rotate-12">
        <span className="text-white font-black text-xs drop-shadow-md">ETB</span>
      </div>

      {/* Decorative Floating 3D Gold Coin (Top-Right) */}
      <div className="absolute -right-3 -top-1 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[radial-gradient(circle_at_35%_28%,#ffffff_0%,#f59e0b_35%,#78350f_85%)] shadow-2xl opacity-90 pointer-events-none flex items-center justify-center border border-amber-300/50 transform rotate-12">
        <span className="text-white font-black text-xs drop-shadow-md">★</span>
      </div>

      {/* Left: ▶ Live 👁 1,420 Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c0738]/90 border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.35)] z-10">
        <div className="flex items-center gap-1 text-red-500 font-black text-[11px] sm:text-xs">
          <Play className="w-2.5 h-2.5 fill-red-500" />
          <span>Live</span>
        </div>
        <div className="flex items-center gap-1 text-purple-200 font-bold text-[10px] sm:text-[11px] ml-0.5">
          <Eye className="w-3 h-3 text-purple-300" />
          <span>{viewerCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Center: NovaGame Aviator Royal Crown Branding */}
      <div className="flex flex-col items-center justify-center z-10 px-2">
        <div className="relative flex items-center justify-center">
          {/* Royal Golden Crown */}
          <div className="absolute -top-3.5 left-0 transform -rotate-6 filter drop-shadow-[0_2px_4px_rgba(245,158,11,0.8)]">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black italic tracking-tight bg-gradient-to-b from-[#fff3b0] via-[#ffd700] to-[#e6a100] bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(245,158,11,0.5)]">
            NovaGame
          </h1>
        </div>

        {/* Purple Ribbon Banner: ★ Aviator ★ */}
        <div className="relative px-3.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 border border-purple-400/60 shadow-md text-white font-black text-[11px] sm:text-xs tracking-widest uppercase -mt-1 flex items-center gap-1">
          <span className="text-amber-300 text-[10px]">★</span>
          <span>Aviator</span>
          <span className="text-amber-300 text-[10px]">★</span>
        </div>
      </div>

      {/* Right: Hamburger Menu Action */}
      <button
        type="button"
        onClick={onMenuToggle}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#220747] border border-purple-500/50 hover:border-purple-400 flex items-center justify-center text-white transition-all shadow-md active:scale-95 z-10 cursor-pointer"
        aria-label="Menu"
      >
        <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-purple-200" />
      </button>
    </div>
  );
};
