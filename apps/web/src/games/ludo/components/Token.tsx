import React from 'react';
import { LudoColor } from '@nova/game-ludo';
import { LUDO_COLORS } from '../types';

export interface TokenProps {
  color: LudoColor;
  tokenIndex: number;
  isLegal: boolean;
  isStepping?: boolean;
  isCaptured?: boolean;
  stackCount?: number;
  stackOffsetIndex?: number;
  size?: 'sm' | 'md' | 'lg';
  showColorblindSymbol?: boolean;
  onClick?: () => void;
}

// Exact vibrant glossy palette matching the reference image
const TOKEN_PALETTES: Record<
  LudoColor,
  {
    headLight: string;
    headMid: string;
    headDark: string;
    bodyLight: string;
    bodyMid: string;
    bodyDark: string;
    collarLight: string;
    collarDark: string;
    glow: string;
  }
> = {
  RED: {
    headLight: '#FF7373',
    headMid: '#E52B2B',
    headDark: '#8A0A0A',
    bodyLight: '#FF5C5C',
    bodyMid: '#DC2626',
    bodyDark: '#7F1D1D',
    collarLight: '#FFA3A3',
    collarDark: '#991B1B',
    glow: 'rgba(239, 68, 68, 0.9)',
  },
  GREEN: {
    headLight: '#4ADE80',
    headMid: '#00B050',
    headDark: '#0A5C2A',
    bodyLight: '#34D399',
    bodyMid: '#059669',
    bodyDark: '#064E3B',
    collarLight: '#86EFAC',
    collarDark: '#047857',
    glow: 'rgba(34, 197, 94, 0.9)',
  },
  BLUE: {
    headLight: '#60A5FA',
    headMid: '#0088E8',
    headDark: '#0A4A8A',
    bodyLight: '#38BDF8',
    bodyMid: '#0284C7',
    bodyDark: '#0C4A6E',
    collarLight: '#93C5FD',
    collarDark: '#0369A1',
    glow: 'rgba(56, 189, 248, 0.9)',
  },
  YELLOW: {
    headLight: '#FEF08A',
    headMid: '#FFDA00',
    headDark: '#997300',
    bodyLight: '#FDE047',
    bodyMid: '#EAB308',
    bodyDark: '#78350F',
    collarLight: '#FEF9C3',
    collarDark: '#CA8A04',
    glow: 'rgba(234, 179, 8, 0.9)',
  },
};

export const Token: React.FC<TokenProps> = ({
  color,
  tokenIndex,
  isLegal,
  isStepping = false,
  isCaptured = false,
  stackCount = 1,
  stackOffsetIndex = 0,
  size = 'md',
  showColorblindSymbol = false,
  onClick,
}) => {
  const meta = LUDO_COLORS[color];
  const p = TOKEN_PALETTES[color];

  // Stack offset positioning if multiple tokens share the same cell
  const getOffsetStyle = () => {
    if (stackCount <= 1) return {};
    const offsetX = (stackOffsetIndex % 2 === 0 ? -1 : 1) * 3;
    const offsetY = stackOffsetIndex >= 2 ? 3 : -3;
    return {
      transform: `translate(${offsetX}px, ${offsetY}px)${isStepping ? ' translateY(-8px)' : ''}`,
    };
  };

  const dimensionClasses =
    size === 'sm'
      ? 'w-6 h-7 sm:w-7 sm:h-8'
      : size === 'lg'
      ? 'w-10 h-12 sm:w-11 sm:h-13'
      : 'w-7 h-9 sm:w-8 sm:h-10';

  return (
    <div
      role="button"
      tabIndex={isLegal ? 0 : -1}
      aria-label={`${meta.label} token ${tokenIndex + 1}${
        isLegal ? ' - movable' : ''
      }${stackCount > 1 ? ` (Stack of ${stackCount})` : ''}`}
      onClick={isLegal ? onClick : undefined}
      onKeyDown={(e) => {
        if (isLegal && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      style={{
        ...getOffsetStyle(),
        filter: isLegal
          ? `drop-shadow(0 0 12px ${p.glow}) drop-shadow(0 4px 8px rgba(0,0,0,0.6))`
          : 'drop-shadow(0 3px 5px rgba(0,0,0,0.55))',
      }}
      className={`relative inline-flex flex-col items-center justify-center select-none transition-all duration-150 min-w-[34px] min-h-[34px] ${
        isLegal
          ? 'cursor-pointer hover:scale-115 active:scale-95 z-30'
          : 'cursor-default opacity-95'
      } ${isStepping ? 'animate-bounce -translate-y-2 z-40' : ''} ${
        isCaptured ? 'animate-ping opacity-50' : ''
      }`}
    >
      {/* Pulsing Move Halo when legal to move */}
      {isLegal && (
        <span
          className="absolute -inset-1 rounded-full animate-ping opacity-80 pointer-events-none"
          style={{ backgroundColor: meta.hex }}
        />
      )}

      {/* Stack Count Badge (x2, x3) */}
      {stackCount > 1 && stackOffsetIndex === 0 && (
        <span className="absolute -top-1.5 -right-1 z-30 px-1 py-0.2 rounded-full bg-slate-950 border border-amber-400 text-[8px] font-black text-amber-300 shadow pointer-events-none">
          x{stackCount}
        </span>
      )}

      {/* 3D Glossy Candy Pawn Piece (Matching Screenshot) */}
      <div className={`relative ${dimensionClasses} flex flex-col items-center justify-between`}>
        {/* Bulb Head (Spherical 3D shaded with top-left specular reflection) */}
        <div
          className="w-[66%] aspect-square rounded-full shadow-md relative overflow-hidden flex items-center justify-center border border-white/30"
          style={{
            background: `radial-gradient(circle at 35% 28%, ${p.headLight} 0%, ${p.headMid} 55%, ${p.headDark} 100%)`,
          }}
        >
          {/* Top-Left Specular Reflection Crescent */}
          <div className="absolute top-0.5 left-1 w-2 h-1 rounded-full bg-white/90 rotate-[-30deg] blur-[0.2px]" />

          {/* Optional colorblind symbol */}
          {showColorblindSymbol && (
            <span
              className={`text-[8px] font-black drop-shadow pointer-events-none ${
                color === 'YELLOW' ? 'text-slate-950' : 'text-white'
              }`}
            >
              {meta.letter}
            </span>
          )}
        </div>

        {/* Torus Collar Ring */}
        <div
          className="w-[44%] h-[11%] rounded-full shadow-sm"
          style={{
            background: `linear-gradient(to right, ${p.collarDark}, ${p.collarLight}, ${p.collarDark})`,
            border: '0.5px solid rgba(0,0,0,0.3)',
          }}
        >
          <div className="w-full h-[30%] bg-white/40 rounded-full" />
        </div>

        {/* Flared Conical Body (with vertical side specular highlight) */}
        <div
          className="w-[78%] h-[42%] rounded-t-sm rounded-b-md shadow-md relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${p.bodyLight} 0%, ${p.bodyMid} 50%, ${p.bodyDark} 100%)`,
            clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
          }}
        >
          {/* Left Vertical Specular Sheen */}
          <div className="absolute inset-y-0 left-[22%] w-[20%] bg-white/40 blur-[0.4px]" />
        </div>

        {/* Heavy Flanged Base Ring (Rests inside the board slot) */}
        <div
          className="w-full h-[16%] rounded-full shadow-lg"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${p.headLight} 0%, ${p.headMid} 60%, ${p.headDark} 100%)`,
            border: '0.8px solid rgba(0,0,0,0.5)',
          }}
        >
          <div className="w-[85%] h-[25%] mx-auto bg-white/40 rounded-full mt-0.5" />
        </div>
      </div>
    </div>
  );
};
