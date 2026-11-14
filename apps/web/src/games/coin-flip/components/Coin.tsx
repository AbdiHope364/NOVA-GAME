import React, { useMemo } from 'react';
import { HeadsCoinSvg, TailsCoinSvg } from './CoinArtwork';
import { FlipAnimationPhase } from '../hooks/useCoinFlip';

export interface CoinProps {
  isFlipping: boolean;
  flipPhase?: FlipAnimationPhase;
  result: 'HEADS' | 'TAILS' | null;
  choice: 'HEADS' | 'TAILS';
  won?: boolean | null;
}

export const Coin: React.FC<CoinProps> = ({
  isFlipping,
  flipPhase = 'IDLE',
  result,
  choice,
  won = null,
}) => {
  const activeSide = result || choice;
  const isHeads = activeSide === 'HEADS';

  const isIdle = flipPhase === 'IDLE';
  const isSpinning = flipPhase === 'FLIPPING';
  const isSettling = flipPhase === 'SETTLING';
  const isResult = flipPhase === 'RESULT';

  const isWin = isResult && won === true;
  const isLoss = isResult && won === false;

  // Compute final settle angle: multiple complete 360° spins + target side (0° for Heads, 180° for Tails)
  const settleTransform = useMemo(() => {
    const extraSpins = 1440; // 4 full 360-degree rotations
    const targetAngle = isHeads ? 0 : 180;
    return `translateY(0px) rotateY(${extraSpins + targetAngle}deg) scale(1)`;
  }, [isHeads]);

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-8 select-none relative w-full">
      {/* Cinematic Studio Lighting Halo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      {isWin && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[420px] h-80 sm:h-[420px] bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      )}

      {/* 3D Perspective Stage */}
      <div className="relative w-48 h-48 sm:w-60 sm:h-60 md:w-68 md:h-68 perspective-1000 flex items-center justify-center">
        {/* Dynamic Ground Shadow */}
        <div
          className={`absolute -bottom-6 w-36 sm:w-48 h-5 rounded-full blur-md transition-all duration-500 pointer-events-none ${
            isWin
              ? 'bg-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.8)] scale-110 opacity-90'
              : isLoss
              ? 'bg-rose-500/30 shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-90 opacity-70'
              : isSpinning
              ? 'bg-black/70 animate-coin-shadow-tumble'
              : isSettling
              ? 'bg-black/80 scale-100 opacity-80'
              : 'bg-black/60 animate-coin-shadow-idle'
          }`}
        />

        {/* Victory Celebration Aura Ring */}
        {isWin && (
          <div className="absolute inset-0 rounded-full animate-gold-win pointer-events-none" />
        )}
        {isLoss && (
          <div className="absolute inset-0 rounded-full animate-lose-pulse pointer-events-none" />
        )}

        {/* 3D Coin Model */}
        <div
          className={`w-full h-full relative rounded-full transform-style-3d transition-all ${
            isSpinning
              ? 'animate-coin-tumble'
              : isIdle
              ? 'animate-coin-idle'
              : ''
          }`}
          style={{
            transform: isSpinning
              ? undefined
              : isIdle
              ? undefined
              : isSettling
              ? settleTransform
              : isHeads
              ? 'translateY(0px) rotateY(0deg) scale(1)'
              : 'translateY(0px) rotateY(180deg) scale(1)',
            transition: isSettling
              ? 'transform 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.15)'
              : isResult
              ? 'transform 0.3s ease-out'
              : undefined,
          }}
        >
          {/* FRONT SIDE - GOLD HEADS (Winged Helmet) */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center backface-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <div className="relative w-full h-full">
              <HeadsCoinSvg className="w-full h-full" />
              {/* Outer Metallic Bevel Ring */}
              <div className="absolute inset-0 rounded-full border-4 border-amber-300/40 pointer-events-none shadow-[inset_0_2px_8px_rgba(255,255,255,0.7),inset_0_-3px_8px_rgba(0,0,0,0.6)]" />
            </div>
          </div>

          {/* BACK SIDE - GOLD TAILS (Warrior Crest) */}
          <div
            className="absolute inset-0 rounded-full flex items-center justify-center backface-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="relative w-full h-full">
              <TailsCoinSvg className="w-full h-full" />
              {/* Outer Metallic Bevel Ring */}
              <div className="absolute inset-0 rounded-full border-4 border-amber-300/40 pointer-events-none shadow-[inset_0_2px_8px_rgba(255,255,255,0.7),inset_0_-3px_8px_rgba(0,0,0,0.6)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Status / Outcome Label under Coin */}
      <div className="mt-7 flex flex-col items-center">
        <span
          className={`px-4 py-1.5 rounded-full text-xs font-mono font-black uppercase tracking-widest border transition-all duration-300 shadow-lg ${
            isWin
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.45)] ring-2 ring-emerald-500/40'
              : isLoss
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
              : isSpinning
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
              : isSettling
              ? 'bg-amber-500/20 text-amber-300 border-amber-400/60'
              : 'bg-slate-900/80 text-slate-400 border-slate-800'
          }`}
        >
          {isSpinning
            ? 'FLIPPING COIN...'
            : isSettling
            ? 'CATCHING...'
            : isWin
            ? `WINNER! · ${result || activeSide}`
            : isLoss
            ? `RESULT · ${result || activeSide}`
            : `SELECTED · ${activeSide}`}
        </span>
      </div>
    </div>
  );
};
