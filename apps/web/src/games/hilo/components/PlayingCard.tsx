import React from 'react';
import { HiLoCard } from '@nova/types';
import {
  PokerSuitVector,
  PokerCourtIllustration,
} from '../../../components/common/PokerSuitAndCourt';

interface PlayingCardProps {
  card?: HiLoCard;
  isFlipped?: boolean; // If true, card back is shown
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isWinner?: boolean;
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

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  isFlipped = false,
  size = 'md',
  className = '',
  isWinner,
}) => {
  const dimensions = {
    sm: 'w-14 h-20 rounded-lg',
    md: 'w-24 sm:w-28 h-36 sm:h-40 rounded-xl',
    lg: 'w-32 sm:w-36 h-48 sm:h-52 rounded-2xl',
  };

  if (isFlipped || !card) {
    return (
      <div
        className={`${dimensions[size]} bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-2 border-indigo-500/40 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden select-none active:scale-95 transition-all ${className}`}
      >
        <div className="absolute inset-1.5 border border-dashed border-indigo-400/30 rounded-xl flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center font-black text-slate-950 text-sm sm:text-base shadow-lg shadow-amber-500/20">
            ?
          </div>
        </div>
      </div>
    );
  }

  const isRed = card.color === 'RED';
  const textColor = isRed ? 'text-[#dc2626]' : 'text-[#0f172a]';
  const isCourt = card.rank >= 11;
  const pips = PIP_LAYOUTS[card.rank];

  const cornerSuitSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';

  const pipVectorSize =
    card.rank === 1
      ? size === 'sm'
        ? 'w-7 h-7'
        : size === 'md'
        ? 'w-12 h-12'
        : 'w-16 h-16'
      : size === 'sm'
      ? 'w-2 h-2'
      : size === 'md'
      ? 'w-3.5 h-3.5'
      : 'w-4 h-4 sm:w-5 sm:h-5';

  return (
    <div
      className={`${dimensions[size]} bg-white border ${
        isWinner
          ? 'border-emerald-500 ring-4 ring-emerald-500/35 scale-105'
          : 'border-slate-400'
      } shadow-[0_8px_24px_rgba(0,0,0,0.4)] flex flex-col justify-between p-1.5 sm:p-2 relative select-none transition-all duration-300 animate-in fade-in zoom-in-95 ${className}`}
    >
      {/* Top Left Classic Poker Corner Index */}
      <div className={`flex flex-col items-center leading-none self-start z-10 ${textColor}`}>
        <span
          className={`font-serif font-semibold tracking-tighter scale-y-110 ${
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
          }`}
        >
          {card.label}
        </span>
        <PokerSuitVector suit={card.suit} className={`${cornerSuitSize} mt-0.5`} />
      </div>

      {/* Center Authentic Multi-Pip Layout or Symmetrical Royal Court Portrait */}
      <div
        className={`absolute ${
          isCourt
            ? size === 'sm'
              ? 'inset-x-3.5 inset-y-2.5'
              : 'inset-x-5 sm:inset-x-6 inset-y-3 sm:inset-y-4'
            : size === 'sm'
            ? 'inset-x-2.5 inset-y-2'
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
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
          }`}
        >
          {card.label}
        </span>
        <PokerSuitVector suit={card.suit} className={`${cornerSuitSize} mt-0.5`} />
      </div>
    </div>
  );
};
