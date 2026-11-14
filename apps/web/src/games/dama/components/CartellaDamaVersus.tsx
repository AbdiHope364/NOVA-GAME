import React from 'react';
import { Clock } from 'lucide-react';

interface CartellaDamaVersusProps {
  player1Name: string;
  player2Name: string;
  isPlayer1Turn: boolean;
  timeFormatted: string;
}

export const CartellaDamaVersus: React.FC<CartellaDamaVersusProps> = ({
  player1Name,
  player2Name,
  isPlayer1Turn,
  timeFormatted,
}) => {
  return (
    <div className="grid grid-cols-12 gap-1.5 sm:gap-2.5 w-full items-center select-none">
      {/* Left: Player 1 (You / White) */}
      <div
        className={`col-span-5 flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl border transition-all ${
          isPlayer1Turn
            ? 'bg-gradient-to-r from-[#0d1f4d] to-[#120836] border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
            : 'bg-[#180833] border-purple-900/60 opacity-80'
        }`}
      >
        {/* Avatar */}
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-black text-sm border-2 border-blue-300 shadow-md shrink-0">
          <span>{player1Name?.[0]?.toUpperCase() || 'A'}</span>
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs sm:text-sm font-extrabold text-white truncate leading-tight">
            {player1Name}
          </span>
          <div className="mt-0.5">
            {isPlayer1Turn ? (
              <span className="inline-flex px-2 py-0.5 rounded-full bg-blue-500 text-white font-black text-[9px] sm:text-[10px] tracking-wide uppercase shadow-[0_0_8px_rgba(59,130,246,0.8)]">
                Your Turn
              </span>
            ) : (
              <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold text-[9px] sm:text-[10px] tracking-wide">
                Waiting...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center: Turn Countdown Clock */}
      <div className="col-span-2 flex items-center justify-center">
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#0a1845]/90 border border-blue-400/80 shadow-[0_0_15px_rgba(59,130,246,0.6)] text-white font-mono font-black text-xs sm:text-sm whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
          <span>{timeFormatted}</span>
        </div>
      </div>

      {/* Right: Player 2 (Opponent / Black) */}
      <div
        className={`col-span-5 flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl border transition-all ${
          !isPlayer1Turn
            ? 'bg-gradient-to-l from-[#450a24] to-[#1a0636] border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
            : 'bg-[#180833] border-purple-900/60 opacity-80'
        }`}
      >
        {/* Avatar */}
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-amber-600 to-rose-700 flex items-center justify-center text-white font-black text-sm border-2 border-rose-400 shadow-md shrink-0">
          <span>{player2Name?.[0]?.toUpperCase() || 'B'}</span>
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs sm:text-sm font-extrabold text-white truncate leading-tight">
            {player2Name}
          </span>
          <div className="mt-0.5">
            {!isPlayer1Turn ? (
              <span className="inline-flex px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[9px] sm:text-[10px] tracking-wide uppercase shadow-[0_0_8px_rgba(244,63,94,0.8)]">
                Their Turn
              </span>
            ) : (
              <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold text-[9px] sm:text-[10px] tracking-wide">
                Waiting...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
