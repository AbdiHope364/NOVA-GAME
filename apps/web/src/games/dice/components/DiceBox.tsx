import React from 'react';
import { DiceAnimationPhase, DiceResultData } from '../hooks/useDice';
import { Premium3DDice } from './Premium3DDice';
import { SliderRoller } from './SliderRoller';

export interface DiceBoxProps {
  mode: 'SINGLE' | 'SLIDER';
  phase: DiceAnimationPhase;
  displayRoll: number | null;
  targetNumber: number;
  singlePick: number;
  condition: 'UNDER' | 'OVER';
  lastResult: DiceResultData | null;
  isRolling: boolean;
}

export const DiceBox: React.FC<DiceBoxProps> = ({
  mode,
  phase,
  displayRoll,
  targetNumber,
  singlePick,
  condition,
  lastResult,
  isRolling,
}) => {
  const currentRollValue =
    displayRoll !== null
      ? displayRoll
      : lastResult
      ? lastResult.roll
      : mode === 'SINGLE'
      ? singlePick
      : targetNumber;

  const won = lastResult ? lastResult.won : null;

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-b from-[#0e1628] via-[#090e1a] to-[#060a12] border border-slate-800/80 p-5 sm:p-8 flex flex-col items-center justify-center shadow-[inset_0_2px_12px_rgba(0,0,0,0.8),0_12px_36px_rgba(0,0,0,0.5)]">
      {/* Overhead Studio Lighting Glow Spotlights */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Mode-Specific Centerpiece */}
      {mode === 'SINGLE' ? (
        <div className="w-full flex flex-col items-center justify-center">
          {/* Status Badge */}
          <div className="mb-2">
            <span
              className={`px-3.5 py-1 rounded-full text-[11px] font-mono font-black tracking-widest uppercase border transition-all ${
                phase === 'WON'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : phase === 'LOST'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : isRolling
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800'
              }`}
            >
              {isRolling
                ? 'ROLLING...'
                : phase === 'SETTLING'
                ? 'SETTLING...'
                : phase === 'WON'
                ? 'WINNER!'
                : phase === 'LOST'
                ? 'TRY AGAIN'
                : `TARGET: DIE #${singlePick}`}
            </span>
          </div>

          {/* 3D Dice */}
          <Premium3DDice
            value={Math.round(currentRollValue)}
            phase={phase}
            size={110}
          />

          {/* Pick Comparison Pill */}
          <div className="mt-2 flex items-center gap-3 text-xs font-mono font-bold">
            <span className="text-slate-400">
              Pick: <span className="text-cyan-400 font-black">#{singlePick}</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">
              Result:{' '}
              <span
                className={`font-black ${
                  phase === 'WON'
                    ? 'text-emerald-400'
                    : phase === 'LOST'
                    ? 'text-rose-400'
                    : 'text-white'
                }`}
              >
                #{Math.round(currentRollValue)}
              </span>
            </span>
          </div>
        </div>
      ) : (
        <SliderRoller
          targetNumber={targetNumber}
          condition={condition}
          displayRoll={displayRoll}
          phase={phase}
          lastRoll={lastResult ? lastResult.roll : null}
          won={won}
        />
      )}
    </div>
  );
};
