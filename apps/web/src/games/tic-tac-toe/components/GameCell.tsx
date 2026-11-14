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
          ? 'bg-slate-900/50 hover:bg-slate-800/80 border border-cyan-500/20 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] active:scale-95'
          : 'bg-[#0d162a]/70 border border-slate-700/50 cursor-default'
      } ${
        isWinningCell
          ? 'ring-2 ring-emerald-400 bg-emerald-950/40 shadow-[0_0_30px_rgba(16,185,129,0.5)] border-emerald-400'
          : ''
      }`}
    >
      {/* Subtle Inner Glass Highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20 pointer-events-none" />

      {/* Symbol: Electric Cyan X */}
      {value === 'X' && (
        <svg
          viewBox="0 0 100 100"
          className={`w-3/5 h-3/5 drop-shadow-[0_0_12px_rgba(0,229,255,0.85)] animate-in zoom-in-75 duration-200 ${
            isWinningCell ? 'text-emerald-300 drop-shadow-[0_0_18px_rgba(16,185,129,0.95)]' : 'text-[#00e5ff]'
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
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
          className={`w-3/5 h-3/5 drop-shadow-[0_0_12px_rgba(217,70,239,0.85)] animate-in zoom-in-75 duration-200 ${
            isWinningCell ? 'text-emerald-300 drop-shadow-[0_0_18px_rgba(16,185,129,0.95)]' : 'text-[#d946ef]'
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="13"
        >
          <circle cx="50" cy="50" r="32" />
        </svg>
      )}

      {/* Empty Cell Hover Hint */}
      {value === null && isClickable && (
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
};
