import React from 'react';
import { TttCell } from '../types/ticTacToe.types';

export interface GameCellProps {
  index: number;
  value: TttCell;
  isWinningCell: boolean;
  isClickable: boolean;
  onClick: () => void;
}

export const GameCell: React.FC<GameCellProps> = ({
  index,
  value,
  isWinningCell,
  isClickable,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable && value !== null}
      aria-label={`Board cell ${index + 1}, ${value ? `occupied by ${value}` : 'empty'}`}
      className={`relative aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 select-none overflow-hidden cursor-pointer ${
        value === null && isClickable
          ? 'bg-[#0f172a]/90 hover:bg-[#1e293b] border-2 border-cyan-400/60 shadow-[0_0_15px_rgba(0,229,255,0.25)] hover:border-cyan-300 hover:shadow-[0_0_25px_rgba(0,229,255,0.5)] active:scale-95'
          : value === null
          ? 'bg-[#080d19]/80 border border-slate-800/70 cursor-default opacity-85'
          : 'bg-[#0d162a]/95 border border-slate-700/70 cursor-default'
      } ${
        isWinningCell
          ? 'ring-4 ring-emerald-400 bg-emerald-950/70 shadow-[0_0_35px_rgba(16,185,129,0.7)] border-emerald-300 scale-105 z-20 animate-pulse'
          : ''
      }`}
    >
      {/* Subtle Inner Glass Highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30 pointer-events-none" />

      {/* Symbol: Electric Cyan X */}
      {value === 'X' && (
        <svg
          viewBox="0 0 100 100"
          className={`w-[68%] h-[68%] drop-shadow-[0_0_16px_rgba(0,229,255,0.95)] animate-in zoom-in-75 duration-200 ${
            isWinningCell ? 'text-emerald-300 drop-shadow-[0_0_22px_rgba(16,185,129,1)]' : 'text-[#00e5ff]'
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
        >
          <line x1="20" y1="20" x2="80" y2="80" />
          <line x1="80" y1="20" x2="20" y2="80" />
        </svg>
      )}

      {/* Symbol: Neon Purple O */}
      {value === 'O' && (
        <svg
          viewBox="0 0 100 100"
          className={`w-[68%] h-[68%] drop-shadow-[0_0_16px_rgba(217,70,239,0.95)] animate-in zoom-in-75 duration-200 ${
            isWinningCell ? 'text-emerald-300 drop-shadow-[0_0_22px_rgba(16,185,129,1)]' : 'text-[#d946ef]'
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="15"
        >
          <circle cx="50" cy="50" r="32" />
        </svg>
      )}

      {/* Empty Clickable Cell Target Hint (visible on mobile to invite tap) */}
      {value === null && isClickable && (
        <div className="w-3 h-3 rounded-full bg-cyan-400/40 border border-cyan-400/80 shadow-[0_0_8px_rgba(0,229,255,0.6)] animate-ping pointer-events-none" />
      )}
    </button>
  );
};
