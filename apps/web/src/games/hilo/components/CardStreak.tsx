import React from 'react';
import { HiLoStep } from '@nova/types';
import { PlayingCard } from './PlayingCard';
import { ArrowUp, ArrowDown, SkipForward, Check, X } from 'lucide-react';

interface CardStreakProps {
  history: HiLoStep[];
}

export const CardStreak: React.FC<CardStreakProps> = ({ history }) => {
  if (history.length <= 1) return null;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Card Streak History ({history.length} Cards)
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
        {history.map((step, idx) => {
          const isCurrent = idx === history.length - 1;
          return (
            <div
              key={`${step.card.index}-${idx}`}
              className={`flex items-center gap-1.5 shrink-0 ${
                isCurrent ? 'scale-105 ring-2 ring-amber-400/50 rounded-xl p-0.5' : 'opacity-85'
              }`}
            >
              <div className="relative">
                <PlayingCard card={step.card} size="sm" />
                {step.guess && (
                  <div
                    className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border ${
                      step.correct
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md'
                        : 'bg-rose-600 text-white border-rose-400 shadow-md'
                    }`}
                  >
                    {step.correct ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 stroke-[3]" />}
                  </div>
                )}
              </div>

              {/* Arrow linking to next step */}
              {idx < history.length - 1 && history[idx + 1].guess && (
                <div className="flex flex-col items-center justify-center px-0.5">
                  {history[idx + 1].guess === 'HI' && (
                    <span className="text-[10px] font-black text-emerald-400 flex items-center">
                      <ArrowUp className="w-3 h-3" /> HI
                    </span>
                  )}
                  {history[idx + 1].guess === 'LO' && (
                    <span className="text-[10px] font-black text-cyan-400 flex items-center">
                      <ArrowDown className="w-3 h-3" /> LO
                    </span>
                  )}
                  {history[idx + 1].guess === 'SKIP' && (
                    <span className="text-[10px] font-black text-slate-400 flex items-center">
                      <SkipForward className="w-3 h-3" />
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

