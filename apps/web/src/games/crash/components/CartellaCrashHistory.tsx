import React from 'react';
import { History } from 'lucide-react';

interface CartellaCrashHistoryProps {
  history: number[];
}

export const CartellaCrashHistory: React.FC<CartellaCrashHistoryProps> = ({ history }) => {
  const displayHistory = history.length > 0 ? history : [2.45, 1.88, 14.5, 1.15, 4.2, 1.95, 8.5];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 w-full bg-[#16062f]/90 border border-purple-900/70 rounded-2xl p-1.5 sm:p-2 shadow-inner overflow-x-auto no-scrollbar select-none">
      <span className="text-[10px] sm:text-xs font-black text-purple-300 uppercase px-2 shrink-0 flex items-center gap-1">
        <History className="w-3.5 h-3.5 text-amber-400" />
        <span>Rounds:</span>
      </span>

      {displayHistory.slice(0, 16).map((mult, idx) => {
        const isMega = mult >= 10.0;
        const isWin = mult >= 2.0;

        return (
          <span
            key={idx}
            className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl shrink-0 transition-transform ${
              isMega
                ? 'bg-gradient-to-r from-amber-500/30 via-yellow-400/30 to-amber-500/30 text-amber-300 border border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                : isWin
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_6px_rgba(52,211,153,0.3)]'
                : 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
            }`}
          >
            {isMega && <span className="mr-0.5 text-amber-300">★</span>}
            {(mult ?? 1.0).toFixed(2)}x
          </span>
        );
      })}
    </div>
  );
};
