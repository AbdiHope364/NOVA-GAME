import React from 'react';
import { DiceAnimationPhase } from '../hooks/useDice';

export interface SliderRollerProps {
  targetNumber: number;
  condition: 'UNDER' | 'OVER';
  displayRoll: number | null;
  phase: DiceAnimationPhase;
  lastRoll: number | null;
  won: boolean | null;
  disabled?: boolean;
}

export const SliderRoller: React.FC<SliderRollerProps> = ({
  targetNumber,
  condition,
  displayRoll,
  phase,
  lastRoll,
  won,
}) => {
  const isRolling = phase === 'ROLLING';
  const isSettling = phase === 'SETTLING';
  const isWon = phase === 'WON';
  const isLost = phase === 'LOST';

  // Value to display in the main HUD readout
  const currentValue =
    displayRoll !== null
      ? displayRoll
      : lastRoll !== null
      ? lastRoll
      : targetNumber;

  const formattedDisplay = currentValue.toFixed(2);
  const [whole, decimal] = formattedDisplay.split('.');

  // Compute roll pointer position (0 - 100%)
  const pinPercent = Math.max(0, Math.min(100, currentValue));

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto select-none py-0.5 sm:py-2">
      {/* High-Tech Digital HUD Display Box */}
      <div
        className={`relative w-full max-w-sm rounded-xl sm:rounded-2xl border px-4 py-2.5 sm:px-6 sm:py-5 flex flex-col items-center justify-center transition-all duration-300 shadow-2xl ${
          isWon
            ? 'bg-gradient-to-b from-emerald-950/70 via-slate-900 to-slate-950 border-emerald-500/80 shadow-[0_0_35px_rgba(16,185,129,0.35)] ring-2 ring-emerald-500/40'
            : isLost
            ? 'bg-gradient-to-b from-rose-950/60 via-slate-900 to-slate-950 border-rose-500/70 shadow-[0_0_30px_rgba(239,68,68,0.25)]'
            : isRolling
            ? 'bg-slate-950/90 border-cyan-500/60 shadow-[0_0_25px_rgba(34,211,238,0.2)] animate-pulse'
            : isSettling
            ? 'bg-slate-950/90 border-amber-400/70 shadow-[0_0_25px_rgba(251,191,36,0.3)]'
            : 'bg-slate-950/80 border-slate-800 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* Subtle Ambient HUD Grid Background */}
        <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

        {/* HUD Subtitle Badge */}
        <div className="flex items-center gap-2 mb-1 z-10">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
            {isRolling
              ? 'CALCULATING ODDS...'
              : isSettling
              ? 'LOCKING RESULT...'
              : isWon
              ? 'ROLL RESULT · WINNER!'
              : isLost
              ? 'ROLL RESULT · LOSS'
              : 'ROLL RESULT'}
          </span>
        </div>

        {/* Big Digital Reel Ticker */}
        <div className="flex items-baseline font-mono font-black z-10">
          <span
            className={`text-5xl sm:text-7xl tracking-tight transition-colors duration-200 ${
              isWon
                ? 'text-emerald-400 drop-shadow-[0_0_16px_rgba(16,185,129,0.7)]'
                : isLost
                ? 'text-rose-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                : isRolling
                ? 'text-cyan-400 blur-[0.4px]'
                : isSettling
                ? 'text-amber-300'
                : 'text-white'
            }`}
          >
            {whole}
          </span>
          <span className="text-3xl sm:text-5xl text-slate-500 mx-0.5">.</span>
          <span
            className={`text-3xl sm:text-5xl font-extrabold tracking-tight transition-colors duration-200 ${
              isWon
                ? 'text-emerald-300'
                : isLost
                ? 'text-rose-300'
                : isRolling
                ? 'text-cyan-300 blur-[0.4px]'
                : isSettling
                ? 'text-amber-200'
                : 'text-slate-300'
            }`}
          >
            {decimal}
          </span>
        </div>

        {/* Condition Check Badge: e.g. "42.18 < 50.00" */}
        <div className="mt-1.5 sm:mt-2.5 z-10">
          <span
            className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold inline-flex items-center gap-1.5 border transition-all ${
              isWon
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                : isLost
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <span>Target:</span>
            <span className="text-white font-extrabold">{condition === 'UNDER' ? `< ${targetNumber}` : `> ${targetNumber}`}</span>
            {won !== null && !isRolling && !isSettling && (
              <span className={won ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'}>
                · {won ? 'HIT' : 'MISS'}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Visual Slider Line with Landed Pin Marker */}
      <div className="w-full mt-3 sm:mt-6 px-1 sm:px-3">
        <div className="relative w-full h-4 rounded-full overflow-hidden shadow-inner border border-slate-800">
          {/* Win / Loss color zones along the track */}
          {condition === 'UNDER' ? (
            <div className="w-full h-full flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
                style={{ width: `${targetNumber}%` }}
              />
              <div
                className="h-full bg-slate-800 transition-all duration-300"
                style={{ width: `${100 - targetNumber}%` }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex">
              <div
                className="h-full bg-slate-800 transition-all duration-300"
                style={{ width: `${targetNumber}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${100 - targetNumber}%` }}
              />
            </div>
          )}
        </div>

        {/* Drop pin showing where the roll landed */}
        <div className="relative w-full h-6 mt-1 pointer-events-none">
          <div
            className="absolute -top-5 flex flex-col items-center transition-all duration-500"
            style={{
              left: `${pinPercent}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 shadow-lg ${
                isWon
                  ? 'bg-emerald-400 border-white shadow-emerald-400/80 scale-125'
                  : isLost
                  ? 'bg-rose-500 border-white shadow-rose-500/80'
                  : 'bg-white border-slate-900 shadow-white/50'
              }`}
            />
            <div className="w-0.5 h-2 bg-white/70" />
            <span className="font-mono text-[10px] font-bold text-slate-300 mt-0.5">
              {currentValue.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Slider Labels */}
        <div className="flex justify-between text-[11px] font-mono text-slate-500 font-bold px-1 mt-1">
          <span>0.00</span>
          <span>25.00</span>
          <span>50.00</span>
          <span>75.00</span>
          <span>99.99</span>
        </div>
      </div>
    </div>
  );
};
