import React from 'react';
import { MinesResultData } from '../hooks/useMines';

/**
 * Faceted Emerald Diamond Gem SVG (Matches Stake Mines aesthetic)
 */
const GemSvg: React.FC<{ faded?: boolean }> = ({ faded = false }) => (
  <svg
    viewBox="0 0 64 64"
    className={`w-9 h-9 sm:w-12 sm:h-12 transition-all duration-300 ${
      faded
        ? 'opacity-35 scale-75 grayscale-[30%]'
        : 'drop-shadow-[0_0_14px_rgba(0,231,1,0.55)] scale-100 animate-in zoom-in-75'
    }`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="gemTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a7f3d0" />
        <stop offset="100%" stopColor="#22c55e" />
      </linearGradient>
      <linearGradient id="gemMid" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="100%" stopColor="#16a34a" />
      </linearGradient>
      <linearGradient id="gemDark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#15803d" />
        <stop offset="100%" stopColor="#052e16" />
      </linearGradient>
    </defs>
    {/* Top Facet */}
    <polygon points="18,12 46,12 56,26 8,26" fill="url(#gemTop)" />
    <polygon points="18,12 32,26 8,26" fill="#6ee7b7" />
    <polygon points="46,12 56,26 32,26" fill="#10b981" />
    <polygon points="18,12 46,12 32,26" fill="#34d399" />
    {/* Bottom Facet */}
    <polygon points="8,26 56,26 32,54" fill="url(#gemMid)" />
    <polygon points="8,26 22,26 32,54" fill="#22c55e" />
    <polygon points="42,26 56,26 32,54" fill="url(#gemDark)" />
    <polygon points="22,26 42,26 32,54" fill="#16a34a" />
  </svg>
);

/**
 * Spiked Naval Bomb Mine SVG
 */
const BombSvg: React.FC<{ exploded?: boolean; faded?: boolean }> = ({
  exploded = false,
  faded = false,
}) => (
  <svg
    viewBox="0 0 64 64"
    className={`w-9 h-9 sm:w-12 sm:h-12 transition-all duration-300 ${
      faded ? 'opacity-50 scale-75' : 'scale-100'
    } ${exploded ? 'drop-shadow-[0_0_18px_rgba(239,68,68,0.85)]' : ''}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Fuse & Spark */}
    <path
      d="M 40 18 Q 46 8 54 11"
      fill="none"
      stroke="#fb923c"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <circle cx="55" cy="11" r="4" fill="#facc15" />
    <circle cx="55" cy="11" r="2" fill="#ef4444" />

    {/* Spikes */}
    <g fill="#1e293b" stroke="#0f172a" strokeWidth="1.5">
      <rect x="29" y="10" width="6" height="8" rx="1.5" />
      <rect x="29" y="48" width="6" height="8" rx="1.5" />
      <rect x="9" y="30" width="8" height="6" rx="1.5" />
      <rect x="47" y="30" width="8" height="6" rx="1.5" />
      <circle cx="17" cy="19" r="3.5" />
      <circle cx="47" cy="47" r="3.5" />
      <circle cx="17" cy="47" r="3.5" />
    </g>

    {/* Bomb Sphere */}
    <circle
      cx="32"
      cy="33"
      r="17"
      fill={exploded ? '#991b1b' : '#1e293b'}
      stroke={exploded ? '#ef4444' : '#334155'}
      strokeWidth="2.5"
    />
    <circle cx="26" cy="27" r="4" fill="#475569" opacity="0.7" />
    {exploded && <circle cx="32" cy="33" r="6" fill="#ef4444" opacity="0.9" />}
  </svg>
);

export interface MinesGridProps {
  isPlaying: boolean;
  gameOver: boolean;
  revealedTiles: number[];
  minePositions: number[];
  hitTile: number | null;
  lastResult: MinesResultData | null;
  autoMode: boolean;
  selectedAutoTiles: number[];
  onTileClick: (index: number) => void;
}

export const MinesGrid: React.FC<MinesGridProps> = ({
  isPlaying,
  gameOver,
  revealedTiles,
  minePositions,
  hitTile,
  lastResult,
  autoMode,
  selectedAutoTiles,
  onTileClick,
}) => {
  const tiles = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className="relative w-full max-w-[540px] mx-auto">
      {/* 5x5 Tile Grid */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {tiles.map((idx) => {
          const isRevealed = revealedTiles.includes(idx);
          const isMine = minePositions.includes(idx);
          const isHitMine = hitTile === idx;
          const isAutoSelected = autoMode && !isPlaying && selectedAutoTiles.includes(idx);

          // Determine visual state
          if (gameOver && isMine) {
            return (
              <div
                key={idx}
                className={`aspect-square rounded-xl flex items-center justify-center border transition-all duration-200 ${
                  isHitMine
                    ? 'bg-[#3b0d14] border-rose-500/80 shadow-[inset_0_0_20px_rgba(239,68,68,0.4)]'
                    : 'bg-[#071824] border-[#1a2c38]'
                }`}
              >
                <BombSvg exploded={isHitMine} faded={!isHitMine} />
              </div>
            );
          }

          if (isRevealed) {
            return (
              <div
                key={idx}
                className={`aspect-square rounded-xl flex items-center justify-center border transition-all duration-200 ${
                  isAutoSelected
                    ? 'bg-[#4c1d95] border-[#a855f7] shadow-[0_0_16px_rgba(168,85,247,0.4)]'
                    : 'bg-[#071824] border-[#1a2c38] shadow-inner'
                }`}
              >
                <GemSvg />
              </div>
            );
          }

          if (gameOver && !isMine && !isRevealed) {
            return (
              <div
                key={idx}
                className="aspect-square rounded-xl bg-[#071824]/90 border border-[#1a2c38]/80 flex items-center justify-center"
              >
                <GemSvg faded />
              </div>
            );
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onTileClick(idx)}
              disabled={!isPlaying && !autoMode}
              className={`aspect-square rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer disabled:cursor-default ${
                isAutoSelected
                  ? 'bg-[#9333ea] hover:bg-[#a855f7] border-b-[5px] border-[#581c87] shadow-[0_0_18px_rgba(147,51,234,0.45)] active:translate-y-0.5'
                  : isPlaying
                  ? 'bg-[#2f4553] hover:bg-[#3c5769] border-b-[5px] border-[#1a2c38] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 shadow-lg'
                  : 'bg-[#2f4553]/85 border-b-[5px] border-[#1a2c38] opacity-90'
              }`}
              aria-label={`Mine Tile ${idx + 1}`}
            />
          );
        })}
      </div>

      {/* Centered Floating Multiplier Win Overlay Card (Matching Screenshot) */}
      {gameOver && lastResult && lastResult.won && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 p-4">
          <div className="bg-[#1a2c38]/95 backdrop-blur-sm border-2 border-[#00e701] rounded-2xl px-8 py-5 shadow-[0_0_35px_rgba(0,231,1,0.35)] text-center animate-in zoom-in-95 duration-200">
            <div className="font-mono font-black text-3xl sm:text-4xl text-[#00e701] tracking-tight drop-shadow-[0_2px_8px_rgba(0,231,1,0.4)]">
              {lastResult.multiplier.toFixed(2)}×
            </div>
            <div className="mt-2 pt-2 border-t border-[#2f4553] flex items-center justify-center gap-2 font-mono font-bold text-sm sm:text-base text-white">
              <span>+{lastResult.payout.toFixed(2)} ETB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
