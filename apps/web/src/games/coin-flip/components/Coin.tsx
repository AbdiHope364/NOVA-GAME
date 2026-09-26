import React from 'react';

export interface CoinProps {
  isFlipping: boolean;
  result: 'HEADS' | 'TAILS' | null;
  choice: 'HEADS' | 'TAILS';
}

export const Coin: React.FC<CoinProps> = ({ isFlipping, result, choice }) => {
  const displaySide = result || choice;

  return (
    <div className="flex flex-col items-center justify-center my-6">
      <div className="perspective-1000 w-36 h-36 relative">
        <div
          className={`w-full h-full rounded-full border-4 shadow-2xl transition-all duration-700 transform-style-3d flex items-center justify-center ${
            isFlipping
              ? 'animate-spin-flip border-amber-400 bg-amber-400/20 shadow-amber-400/50'
              : result === 'HEADS' || (result === null && choice === 'HEADS')
              ? 'border-amber-400 bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 text-slate-950 shadow-amber-400/40'
              : 'border-cyan-400 bg-gradient-to-tr from-cyan-600 via-blue-500 to-indigo-400 text-slate-950 shadow-cyan-400/40'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1 select-none">
            <span className="text-5xl">
              {isFlipping ? '🪙' : displaySide === 'HEADS' ? '👑' : '🦅'}
            </span>
            <span className="text-xs font-black tracking-widest uppercase text-slate-950">
              {isFlipping ? 'FLIPPING...' : displaySide}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
