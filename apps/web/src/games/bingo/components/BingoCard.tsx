import React from 'react';
import { BingoCardData } from '@nova/types';
import { Star } from 'lucide-react';

export interface BingoCardProps {
  card: BingoCardData;
  userMarks: boolean[][];
  onToggleMark: (r: number, c: number) => void;
  disabled?: boolean;
}

export const getBall3DStyle = (colIdx: number, val: number) => {
  switch (colIdx) {
    case 0: // B - Orange / Red Sphere
      return {
        bg: 'bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#ff5e00_28%,#b81400_85%)]',
        shadow: 'shadow-[inset_0_-2px_4px_rgba(0,0,0,0.45),0_3px_5px_rgba(0,0,0,0.35)]',
      };
    case 1: // I - Royal Blue Sphere
      return {
        bg: 'bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#0077ff_28%,#002b80_85%)]',
        shadow: 'shadow-[inset_0_-2px_4px_rgba(0,0,0,0.45),0_3px_5px_rgba(0,0,0,0.35)]',
      };
    case 2: // N - Red or Emerald Green Sphere
      return val % 2 === 0
        ? {
            bg: 'bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#00c853_28%,#00591f_85%)]',
            shadow: 'shadow-[inset_0_-2px_4px_rgba(0,0,0,0.45),0_3px_5px_rgba(0,0,0,0.35)]',
          }
        : {
            bg: 'bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#ff2b2b_28%,#8b0000_85%)]',
            shadow: 'shadow-[inset_0_-2px_4px_rgba(0,0,0,0.45),0_3px_5px_rgba(0,0,0,0.35)]',
          };
    case 3: // G - Emerald Green Sphere
      return {
        bg: 'bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#00c853_28%,#00591f_85%)]',
        shadow: 'shadow-[inset_0_-2px_4px_rgba(0,0,0,0.45),0_3px_5px_rgba(0,0,0,0.35)]',
      };
    case 4: // O - Royal Violet / Purple Sphere
      return {
        bg: 'bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#8a2be2_28%,#3d0070_85%)]',
        shadow: 'shadow-[inset_0_-2px_4px_rgba(0,0,0,0.45),0_3px_5px_rgba(0,0,0,0.35)]',
      };
    default:
      return {
        bg: 'bg-[radial-gradient(circle_at_35%_25%,#ffffff_0%,#f59e0b_28%,#78350f_85%)]',
        shadow: 'shadow-[inset_0_-2px_4px_rgba(0,0,0,0.45),0_3px_5px_rgba(0,0,0,0.35)]',
      };
  }
};

export const BingoCard: React.FC<BingoCardProps> = ({
  card,
  userMarks,
  onToggleMark,
  disabled,
}) => {
  const headers = [
    { letter: 'B', gradient: 'bg-gradient-to-b from-[#ff5e3a] to-[#ff2a2a]' },
    { letter: 'I', gradient: 'bg-gradient-to-b from-[#2998ff] to-[#0066ff]' },
    { letter: 'N', gradient: 'bg-gradient-to-b from-[#ffcc00] to-[#ff9500]' },
    { letter: 'G', gradient: 'bg-gradient-to-b from-[#34c759] to-[#248a3d]' },
    { letter: 'O', gradient: 'bg-gradient-to-b from-[#af52de] to-[#7828c8]' },
  ];

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* 5x5 Cartella Board Outer Neon Glow Frame */}
      <div className="w-full bg-[#16062f] border-2 border-purple-500/70 rounded-2xl sm:rounded-3xl p-2 sm:p-3 shadow-[0_0_25px_rgba(168,85,247,0.35)] flex flex-col gap-1.5 sm:gap-2">
        {/* B I N G O Header Row */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {headers.map((h, idx) => (
            <div
              key={idx}
              className={`py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl text-center font-black text-lg sm:text-2xl md:text-3xl text-white tracking-wider shadow-md ${h.gradient}`}
            >
              {h.letter}
            </div>
          ))}
        </div>

        {/* 5x5 Matrix Grid */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 aspect-square w-full">
          {card.grid.map((row, rIdx) =>
            row.map((val, cIdx) => {
              const isFree = rIdx === 2 && cIdx === 2;
              const isMarked = userMarks[rIdx]?.[cIdx] || isFree;
              const ballStyle = getBall3DStyle(cIdx, val);

              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  type="button"
                  disabled={disabled && !isFree}
                  onClick={() => onToggleMark(rIdx, cIdx)}
                  className={`relative flex items-center justify-center rounded-xl sm:rounded-2xl transition-all cursor-pointer p-0.5 sm:p-1 overflow-hidden select-none active:scale-95 ${
                    isFree
                      ? 'bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#d97706] border-2 border-amber-300 shadow-md'
                      : 'bg-white border border-slate-200/90 shadow-[0_2px_4px_rgba(0,0,0,0.12)]'
                  }`}
                >
                  {isFree ? (
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <Star className="w-6 h-6 sm:w-9 sm:h-9 text-amber-100 fill-amber-300 drop-shadow-[0_2px_4px_rgba(180,83,9,0.8)] animate-pulse" />
                    </div>
                  ) : isMarked ? (
                    // 3D Spherical Glossy Bingo Ball
                    <div
                      className={`w-[88%] h-[88%] rounded-full flex items-center justify-center relative transition-transform duration-200 animate-in zoom-in-90 ${ballStyle.bg} ${ballStyle.shadow}`}
                    >
                      {/* Gloss Specular Highlight Reflection */}
                      <div className="absolute top-[10%] left-[20%] w-[35%] h-[24%] rounded-full bg-white/60 blur-[0.6px] pointer-events-none" />

                      {/* Crisp White Bold Number with shadow */}
                      <span className="font-black text-white text-base sm:text-2xl md:text-3xl font-sans drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.9)] z-10 leading-none">
                        {val}
                      </span>
                    </div>
                  ) : (
                    // Plain Uncalled Number on White Tile
                    <span className="text-slate-900 font-black text-base sm:text-2xl md:text-3xl font-sans leading-none tracking-tight">
                      {val}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
