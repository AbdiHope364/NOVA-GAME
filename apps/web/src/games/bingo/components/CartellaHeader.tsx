import React from 'react';
import { Menu } from 'lucide-react';

interface CartellaHeaderProps {
  onMenuToggle?: () => void;
}

export const CartellaHeader: React.FC<CartellaHeaderProps> = ({ onMenuToggle }) => {
  return (
    <div className="relative flex items-center justify-between w-full pt-1 pb-2 px-1 select-none overflow-hidden">
      {/* Decorative Floating 3D Ball Left (7 Purple) */}
      <div className="absolute -left-3 top-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[radial-gradient(circle_at_35%_28%,#ffffff_0%,#9333ea_30%,#3b0764_85%)] shadow-xl opacity-90 pointer-events-none flex items-center justify-center text-white font-black font-mono text-sm sm:text-base border border-purple-400/40 transform -rotate-12">
        <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">7</span>
      </div>

      {/* Decorative Floating 3D Ball Right (88 Gold) */}
      <div className="absolute -right-3 top-2 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[radial-gradient(circle_at_35%_28%,#ffffff_0%,#f59e0b_30%,#78350f_85%)] shadow-xl opacity-90 pointer-events-none flex items-center justify-center text-white font-black font-mono text-xs sm:text-sm border border-amber-300/40 transform rotate-12">
        <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">88</span>
      </div>

      {/* Left: 🔴 Live Bingo Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b0636]/90 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.3)] z-10">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
        </span>
        <span className="text-[11px] sm:text-xs font-black text-white tracking-wider uppercase">
          Live Bingo
        </span>
      </div>

      {/* Center: NovaGame Royal Logo with Golden Crown */}
      <div className="flex flex-col items-center justify-center z-10 px-2">
        <div className="relative flex items-center justify-center">
          {/* Royal Golden Crown */}
          <div className="absolute -top-3.5 left-1 transform -rotate-6 filter drop-shadow-[0_2px_4px_rgba(245,158,11,0.8)]">
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
        <span className="text-[10px] sm:text-[11px] font-bold text-purple-200/90 tracking-widest uppercase -mt-1 drop-shadow-sm">
          Play • Win • Enjoy
        </span>
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
