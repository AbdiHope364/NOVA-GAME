import React from 'react';
import { Trophy, Flame, CheckCircle2, XCircle } from 'lucide-react';

export interface ResultProps {
  won: boolean;
  multiplier: number;
  crashPoint: number;
  payout: number;
  betAmount: number;
}

export const Result: React.FC<ResultProps> = ({ won, multiplier, crashPoint, payout, betAmount }) => {
  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between transition-all shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 select-none ${
        won
          ? 'bg-gradient-to-r from-emerald-950/80 via-[#0a2f1d]/90 to-emerald-950/80 border-emerald-400/80 text-emerald-300 shadow-[0_0_25px_rgba(52,211,153,0.25)]'
          : 'bg-gradient-to-r from-rose-950/80 via-[#2d0a14]/90 to-rose-950/80 border-rose-500/80 text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.25)]'
      }`}
    >
      <div className="flex items-center gap-3">
        {won ? (
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-emerald-400 filter drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>
        ) : (
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-rose-500/20 border border-rose-500/60 flex items-center justify-center">
            <Flame className="w-6 h-6 text-rose-500 filter drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />
          </div>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm sm:text-base uppercase tracking-wider">
              {won ? 'YOU CASHED OUT!' : 'BET LOST'}
            </span>
            {won && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest border border-emerald-400/40">
                YOU WON!
              </span>
            )}
          </div>
          <span className="text-xs text-slate-300/90 font-medium">
            {won
              ? `Cashed out at ${(multiplier ?? 1.0).toFixed(2)}x before plane crashed at ${(crashPoint ?? 1.0).toFixed(2)}x`
              : `Plane crashed at ${(crashPoint ?? 1.0).toFixed(2)}x before cashout`}
          </span>
        </div>
      </div>

      <div className="text-right font-mono">
        <div className={`text-base sm:text-lg font-black ${won ? 'text-emerald-400' : 'text-rose-400'}`}>
          {won ? `+${payout} ETB` : `-${betAmount} ETB`}
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {won ? `${(multiplier ?? 1.0).toFixed(2)}x Payout` : '0.00x Loss'}
        </div>
      </div>
    </div>
  );
};
