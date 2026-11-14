import React from 'react';
import { LettiCard as LettiCardType } from '@nova/types';
import { Eye, Lock } from 'lucide-react';
import {
  PokerSuitVector,
  PokerCourtIllustration,
} from '../../../components/common/PokerSuitAndCourt';

interface LettiCardProps {
  card?: LettiCardType | null;
  hidden?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  highlight?: 'NONE' | 'USER_WIN' | 'SYSTEM_WIN' | 'SELECTED' | 'NEWEST';
  flipOnMount?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  labelBadge?: string;
}

const PIP_LAYOUTS: Record<number, Array<[number, number, boolean?]>> = {
  1: [[50, 50]],
  2: [
    [50, 18],
    [50, 82, true],
  ],
  3: [
    [50, 18],
    [50, 50],
    [50, 82, true],
  ],
  4: [
    [28, 20],
    [72, 20],
    [28, 80, true],
    [72, 80, true],
  ],
  5: [
    [28, 20],
    [72, 20],
    [50, 50],
    [28, 80, true],
    [72, 80, true],
  ],
  6: [
    [28, 18],
    [72, 18],
    [28, 50],
    [72, 50],
    [28, 82, true],
    [72, 82, true],
  ],
  7: [
    [28, 18],
    [72, 18],
    [50, 34],
    [28, 50],
    [72, 50],
    [28, 82, true],
    [72, 82, true],
  ],
  8: [
    [28, 18],
    [72, 18],
    [50, 34],
    [28, 50],
    [72, 50],
    [50, 66, true],
    [28, 82, true],
    [72, 82, true],
  ],
  9: [
    [28, 15],
    [72, 15],
    [28, 38],
    [72, 38],
    [50, 50],
    [28, 62, true],
    [72, 62, true],
    [28, 85, true],
    [72, 85, true],
  ],
  10: [
    [28, 15],
    [72, 15],
    [50, 26],
    [28, 38],
    [72, 38],
    [28, 62, true],
    [72, 62, true],
    [50, 74, true],
    [28, 85, true],
    [72, 85, true],
  ],
};

export const LettiCard: React.FC<LettiCardProps> = ({
  card,
  hidden = false,
  size = 'md',
  highlight = 'NONE',
  flipOnMount = false,
  className = '',
  onClick,
  disabled = false,
  labelBadge,
}) => {
  const dimensions = {
    xs: 'w-[34px] h-[48px] sm:w-11 sm:h-16 rounded sm:rounded-md',
    sm: 'w-12 h-[68px] sm:w-16 sm:h-24 rounded-lg sm:rounded-xl',
    md: 'w-20 sm:w-28 h-28 sm:h-40 rounded-xl',
    lg: 'w-28 sm:w-36 h-40 sm:h-52 rounded-2xl',
  };

  if (hidden || !card) {
    const Wrapper: any = onClick ? 'button' : 'div';
    return (
      <Wrapper
        type={onClick ? 'button' : undefined}
        onClick={onClick}
        disabled={disabled}
        className={`${dimensions[size]} bg-gradient-to-br from-[#1b2238] via-[#111626] to-[#0a0d17] border-2 ${
          highlight === 'SELECTED'
            ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_18px_rgba(245,158,11,0.45)] scale-105'
            : 'border-indigo-500/35 hover:border-amber-400/70'
        } shadow-xl flex flex-col items-center justify-center relative overflow-hidden select-none transition-all duration-200 ${
          onClick && !disabled ? 'cursor-pointer hover:-translate-y-0.5 active:scale-95' : ''
        } ${className}`}
      >
        <div className="absolute inset-1 border border-dashed border-indigo-400/25 rounded-lg flex flex-col items-center justify-center bg-slate-950/40">
          {size === 'xs' ? (
            <span className="text-[11px] font-black text-amber-400/85">✦</span>
          ) : (
            <>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-tr from-amber-500/90 to-yellow-400 flex items-center justify-center font-black text-slate-950 shadow-md">
                {labelBadge ? <Lock className="w-4 h-4" /> : 'L'}
              </div>
              {labelBadge && (
                <span className="text-[8px] sm:text-[9px] font-black text-amber-300/90 uppercase tracking-wider mt-1 flex items-center gap-0.5">
                  <Eye className="w-2.5 h-2.5" /> {labelBadge}
                </span>
              )}
            </>
          )}
        </div>
      </Wrapper>
    );
  }

  const isRed = card.color === 'RED';
  const textColor = isRed ? 'text-[#dc2626]' : 'text-[#0f172a]';
  const isCourt = card.rank >= 11;
  const pips = PIP_LAYOUTS[card.rank];

  const borderStyle =
    highlight === 'USER_WIN'
      ? 'border-emerald-500 ring-4 ring-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.55)] scale-105'
      : highlight === 'SYSTEM_WIN'
      ? 'border-rose-500 ring-4 ring-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.55)] scale-105'
      : highlight === 'NEWEST'
      ? 'border-cyan-400 ring-2 ring-cyan-400/60 shadow-[0_0_18px_rgba(34,211,238,0.45)] scale-105'
      : highlight === 'SELECTED'
      ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
      : 'border-slate-400';

  const cornerSuitSize =
    size === 'xs' ? 'w-2 h-2' : size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';

  const pipVectorSize =
    card.rank === 1
      ? size === 'xs'
        ? 'w-5 h-5'
        : size === 'sm'
        ? 'w-8 h-8'
        : size === 'md'
        ? 'w-11 h-11 sm:w-12 sm:h-12'
        : 'w-14 h-14'
      : size === 'xs'
      ? 'w-1.5 h-1.5'
      : size === 'sm'
      ? 'w-2.5 h-2.5'
      : size === 'md'
      ? 'w-3.5 h-3.5 sm:w-4 sm:h-4'
      : 'w-4 h-4 sm:w-5 sm:h-5';

  const Wrapper: any = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      disabled={disabled}
      className={`${dimensions[size]} bg-white border ${borderStyle} shadow-[0_6px_18px_rgba(0,0,0,0.35)] flex flex-col justify-between p-1 sm:p-1.5 relative select-none transition-all duration-200 ${
        flipOnMount ? 'animate-card-flip' : 'animate-in fade-in zoom-in-95'
      } ${
        onClick && !disabled ? 'cursor-pointer hover:-translate-y-0.5 active:scale-95' : ''
      } ${className}`}
    >
      {/* Top Left Classic Poker Corner Index */}
      <div className={`flex flex-col items-center leading-none self-start z-10 ${textColor}`}>
        <span
          className={`font-serif font-semibold tracking-tighter scale-y-110 ${
            size === 'xs'
              ? 'text-[9px]'
              : size === 'sm'
              ? 'text-xs'
              : size === 'md'
              ? 'text-base sm:text-lg'
              : 'text-lg sm:text-xl'
          }`}
        >
          {card.label}
        </span>
        <PokerSuitVector suit={card.suit} className={`${cornerSuitSize} mt-0.5`} />
      </div>

      {/* Center Authentic Pip Grid or Symmetrical Royal Court Portrait */}
      <div
        className={`absolute ${
          isCourt
            ? size === 'xs'
              ? 'inset-x-1.5 sm:inset-x-2.5 inset-y-1.5 sm:inset-y-2'
              : size === 'sm'
              ? 'inset-x-2.5 sm:inset-x-3.5 inset-y-2 sm:inset-y-2.5'
              : 'inset-x-5 sm:inset-x-6 inset-y-3 sm:inset-y-3.5'
            : size === 'xs'
            ? 'inset-x-1.5 sm:inset-x-2 inset-y-1.5 sm:inset-y-2'
            : 'inset-x-4 sm:inset-x-5 inset-y-3 sm:inset-y-4'
        } pointer-events-none ${textColor}`}
      >
        {isCourt ? (
          <PokerCourtIllustration rank={card.rank} suit={card.suit} className="w-full h-full" />
        ) : (
          <div className="relative w-full h-full">
            {pips?.map(([x, y, inverted], idx) => (
              <div
                key={idx}
                className={`absolute -translate-x-1/2 -translate-y-1/2 ${
                  inverted ? 'rotate-180' : ''
                }`}
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <PokerSuitVector suit={card.suit} className={pipVectorSize} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Right Inverted Poker Corner Index */}
      <div className={`flex flex-col items-center leading-none rotate-180 self-end z-10 ${textColor}`}>
        <span
          className={`font-serif font-semibold tracking-tighter scale-y-110 ${
            size === 'xs'
              ? 'text-[9px]'
              : size === 'sm'
              ? 'text-xs'
              : size === 'md'
              ? 'text-base sm:text-lg'
              : 'text-lg sm:text-xl'
          }`}
        >
          {card.label}
        </span>
        <PokerSuitVector suit={card.suit} className={`${cornerSuitSize} mt-0.5`} />
      </div>
    </Wrapper>
  );
};
