import React from 'react';
import { LudoColor } from '@nova/game-ludo';

export interface LudoPawn3DProps {
  color: LudoColor;
  isSelectable?: boolean;
  isStepping?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  tokenNumber?: number;
  variant?: 'pawn' | 'gem';
}

const COLOR_GRADIENTS: Record<
  LudoColor,
  {
    primary: string;
    light: string;
    dark: string;
    accent: string;
    glow: string;
    ring: string;
  }
> = {
  RED: {
    primary: '#EF4444',
    light: '#FCA5A5',
    dark: '#991B1B',
    accent: '#FECACA',
    glow: 'rgba(239, 68, 68, 0.85)',
    ring: '#F87171',
  },
  GREEN: {
    primary: '#22C55E',
    light: '#86EFAC',
    dark: '#166534',
    accent: '#DCFCE7',
    glow: 'rgba(34, 197, 94, 0.85)',
    ring: '#4ADE80',
  },
  YELLOW: {
    primary: '#FACC15',
    light: '#FEF08A',
    dark: '#854D0E',
    accent: '#FEF9C3',
    glow: 'rgba(250, 204, 21, 0.85)',
    ring: '#FDE047',
  },
  BLUE: {
    primary: '#3B82F6',
    light: '#93C5FD',
    dark: '#1E40AF',
    accent: '#DBEAFE',
    glow: 'rgba(59, 130, 246, 0.85)',
    ring: '#60A5FA',
  },
};

export const LudoPawn3D: React.FC<LudoPawn3DProps> = ({
  color,
  isSelectable = false,
  isStepping = false,
  onClick,
  size = 'md',
  tokenNumber,
  variant = 'gem',
}) => {
  const g = COLOR_GRADIENTS[color];

  // =========================================================================
  // GLOWING NEON GEM / ORB VARIANT (Matches "LUDO GLOW: PREMIUM")
  // =========================================================================
  if (variant === 'gem') {
    const gemSizeClass =
      size === 'sm'
        ? 'w-5 h-5 sm:w-6 sm:h-6'
        : size === 'lg'
        ? 'w-10 h-10 sm:w-11 sm:h-11'
        : 'w-7 h-7 sm:w-8 sm:h-8';

    return (
      <div
        onClick={isSelectable ? onClick : undefined}
        className={`relative inline-flex items-center justify-center select-none ${
          isSelectable
            ? 'cursor-pointer transform hover:scale-125 active:scale-95 transition-transform z-30'
            : isStepping
            ? 'z-40 scale-125 -translate-y-2.5 transition-all duration-150'
            : 'cursor-default transition-all duration-150'
        }`}
        style={{
          filter: isSelectable || isStepping
            ? `drop-shadow(0 0 16px ${g.glow}) drop-shadow(0 0 24px ${g.ring})`
            : `drop-shadow(0 0 8px ${g.glow})`,
        }}
        title={`${color} Gem Token${tokenNumber !== undefined ? ` #${tokenNumber}` : ''}${
          isSelectable ? ' (Tap to Move)' : ''
        }`}
      >
        {/* Pulsing Outer Neon Beacon when selectable or stepping */}
        {(isSelectable || isStepping) && (
          <div
            className="absolute inset-0 rounded-full animate-ping pointer-events-none opacity-90"
            style={{ backgroundColor: isStepping ? '#FFFFFF' : g.primary }}
          />
        )}

        {/* 3D Glowing Domed Neon Orb */}
        <div
          className={`${gemSizeClass} rounded-full relative flex items-center justify-center transition-all ${
            isSelectable
              ? 'animate-bounce ring-2 ring-white scale-110'
              : isStepping
              ? 'ring-2 ring-white shadow-[0_0_20px_#FFFFFF] scale-115'
              : ''
          }`}
          style={{
            background: `radial-gradient(circle at 35% 30%, #FFFFFF 0%, ${g.light} 30%, ${g.primary} 70%, ${g.dark} 100%)`,
            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.6), 0 0 12px ${g.glow}`,
            border: `1.5px solid ${g.light}`,
          }}
        >
          {/* Top Specular Glint Reflection */}
          <div className="absolute top-1 left-1.5 w-2 h-1 rounded-full bg-white/80 rotate-[-25deg] blur-[0.3px]" />

          {/* Optional Token Number in Core */}
          {tokenNumber !== undefined && (
            <span className="text-[9px] font-black text-slate-950 opacity-90 drop-shadow">
              {tokenNumber}
            </span>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // CLASSIC 3D PAWN VARIANT
  // =========================================================================
  const scaleClass =
    size === 'sm'
      ? 'w-6 h-7 sm:w-7 sm:h-8'
      : size === 'lg'
      ? 'w-10 h-12 sm:w-12 sm:h-14'
      : 'w-7 h-9 sm:w-8 sm:h-10';

  return (
    <div
      onClick={isSelectable ? onClick : undefined}
      className={`relative inline-flex flex-col items-center justify-center select-none ${
        isSelectable
          ? 'cursor-pointer transform hover:scale-115 active:scale-95 transition-transform z-30'
          : 'cursor-default'
      }`}
      style={{
        filter: isSelectable
          ? `drop-shadow(0 0 10px ${g.glow}) drop-shadow(0 6px 12px rgba(0,0,0,0.7))`
          : 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))',
      }}
      title={`${color} Pawn${tokenNumber !== undefined ? ` #${tokenNumber}` : ''}${
        isSelectable ? ' (Click to Move)' : ''
      }`}
    >
      {isSelectable && (
        <div
          className="absolute -bottom-1 w-7 h-3 rounded-full animate-ping pointer-events-none opacity-80"
          style={{ backgroundColor: g.ring }}
        />
      )}

      <div
        className={`absolute -bottom-0.5 w-6 h-2 rounded-full bg-black/60 blur-[1px] transition-transform ${
          isSelectable ? 'scale-75 opacity-40' : 'scale-100 opacity-70'
        }`}
      />

      <svg
        viewBox="0 0 40 50"
        className={`${scaleClass} ${
          isSelectable ? 'animate-bounce' : ''
        } transition-transform duration-200`}
        style={{
          transformOrigin: 'bottom center',
        }}
      >
        <defs>
          <radialGradient id={`pawnHead-${color}`} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="25%" stopColor={g.light} stopOpacity="0.9" />
            <stop offset="65%" stopColor={g.primary} />
            <stop offset="100%" stopColor={g.dark} />
          </radialGradient>

          <linearGradient id={`pawnBody-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={g.dark} />
            <stop offset="30%" stopColor={g.light} />
            <stop offset="60%" stopColor={g.primary} />
            <stop offset="100%" stopColor={g.dark} />
          </linearGradient>

          <linearGradient id={`pawnBase-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={g.light} />
            <stop offset="40%" stopColor={g.primary} />
            <stop offset="100%" stopColor={g.dark} />
          </linearGradient>
        </defs>

        <ellipse cx="20" cy="45" rx="16" ry="4" fill={g.dark} />
        <path
          d="M 5 43 Q 20 40 35 43 L 36 45 Q 20 48 4 45 Z"
          fill={`url(#pawnBase-${color})`}
          stroke="#000000"
          strokeWidth="0.5"
          strokeOpacity="0.3"
        />
        <ellipse cx="20" cy="42" rx="14" ry="3.5" fill={`url(#pawnHead-${color})`} />
        <path
          d="M 13 22 Q 15 35 7 42 Q 20 44 33 42 Q 25 35 27 22 Z"
          fill={`url(#pawnBody-${color})`}
          stroke="#000000"
          strokeWidth="0.5"
          strokeOpacity="0.2"
        />
        <ellipse cx="20" cy="22" rx="7.5" ry="2" fill={g.light} />
        <ellipse cx="20" cy="22.5" rx="7" ry="1.6" fill={g.primary} />
        <circle
          cx="20"
          cy="12"
          r="9.5"
          fill={`url(#pawnHead-${color})`}
          stroke="#000000"
          strokeWidth="0.5"
          strokeOpacity="0.25"
        />
        <ellipse
          cx="17"
          cy="8.5"
          rx="3.5"
          ry="2"
          transform="rotate(-25 17 8.5)"
          fill="#FFFFFF"
          opacity="0.85"
        />
      </svg>

      {tokenNumber !== undefined && (
        <span className="absolute -top-1 right-0 rounded-full bg-slate-900/90 text-white text-[9px] font-black w-3.5 h-3.5 flex items-center justify-center border border-white/40 shadow">
          {tokenNumber}
        </span>
      )}
    </div>
  );
};
