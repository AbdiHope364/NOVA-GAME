import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { LudoColor } from '@nova/game-ludo';
import { LUDO_COLORS, LudoTheme } from '../types';

export interface TileProps {
  row: number;
  col: number;
  theme: LudoTheme;
  isStar?: boolean;
  arrowDirection?: 'right' | 'down' | 'left' | 'up' | null;
  arrowColor?: LudoColor | null;
  homeColColor?: LudoColor | null;
  startSquareColor?: LudoColor | null;
  isCenterFinish?: boolean;
  children?: React.ReactNode;
}

export const Tile: React.FC<TileProps> = ({
  row,
  col,
  theme,
  isStar = false,
  arrowDirection = null,
  arrowColor = null,
  homeColColor = null,
  startSquareColor = null,
  isCenterFinish = false,
  children,
}) => {
  // Tile background and border styling
  const getTileClasses = () => {
    // 1. Home paths leading to center
    if (homeColColor) {
      return homeColColor === 'RED'
        ? 'bg-[#E53935] border-black/70 text-white font-black'
        : homeColColor === 'GREEN'
        ? 'bg-[#43A047] border-black/70 text-white font-black'
        : homeColColor === 'YELLOW'
        ? 'bg-[#FDD835] border-black/70 text-slate-950 font-black'
        : 'bg-[#1E88E5] border-black/70 text-white font-black';
    }

    // 2. Center 3x3 finish background
    if (isCenterFinish) {
      return 'bg-white border-black/60';
    }

    // 3. Regular outer track squares & start arrow squares (white with crisp dark grid borders)
    return 'bg-white border-slate-700/80 text-slate-900';
  };

  return (
    <div
      role="gridcell"
      aria-label={`Board cell row ${row} column ${col}${
        isStar ? ' safe square' : ''
      }${startSquareColor ? ` ${startSquareColor} start` : ''}`}
      className={`relative flex items-center justify-center border-[0.8px] select-none text-[8px] transition-colors ${getTileClasses()}`}
    >
      {/* Directional Start Arrow in Player's Color */}
      {arrowDirection && !children && (
        <div
          className="flex items-center justify-center pointer-events-none drop-shadow-sm"
          aria-hidden="true"
        >
          {arrowDirection === 'right' && (
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E53935] stroke-[3.5]" />
          )}
          {arrowDirection === 'down' && (
            <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#43A047] stroke-[3.5]" />
          )}
          {arrowDirection === 'left' && (
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F57F17] stroke-[3.5]" />
          )}
          {arrowDirection === 'up' && (
            <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1E88E5] stroke-[3.5]" />
          )}
        </div>
      )}

      {/* Outlined Star Icon for Safe Squares (as in Ludo Club / King) */}
      {isStar && !children && (
        <div className="pointer-events-none drop-shadow-sm" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-none stroke-slate-500 stroke-[2.2]">
            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
          </svg>
        </div>
      )}

      {/* Central 3x3 Finishing Triangles meeting in the center */}
      {row === 7 && col === 7 && (
        <div className="absolute -inset-[100%] z-10 pointer-events-none flex items-center justify-center overflow-hidden border border-black/80">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Top Green Triangle */}
            <polygon points="0,0 100,0 50,50" fill="#43A047" />
            {/* Right Yellow Triangle */}
            <polygon points="100,0 100,100 50,50" fill="#FDD835" />
            {/* Bottom Blue Triangle */}
            <polygon points="100,100 0,100 50,50" fill="#1E88E5" />
            {/* Left Red Triangle */}
            <polygon points="0,100 0,0 50,50" fill="#E53935" />

            {/* Crisp Dividers */}
            <line x1="0" y1="0" x2="100" y2="100" stroke="#000000" strokeWidth="1.5" />
            <line x1="100" y1="0" x2="0" y2="100" stroke="#000000" strokeWidth="1.5" />
          </svg>
        </div>
      )}

      {/* Placed Tokens */}
      {children}
    </div>
  );
};
