import React from 'react';
import { Trophy, User, Coins } from 'lucide-react';
import { CartellaRoundConfig } from '@nova/types';

interface CartellaStatsProps {
  roundConfig: CartellaRoundConfig;
}

export const CartellaStats: React.FC<CartellaStatsProps> = ({ roundConfig }) => {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 w-full select-none">
      {/* 1. STAKE CARD */}
      <div className="flex items-center gap-2 sm:gap-2.5 bg-gradient-to-b from-[#220745] to-[#16042e] border border-purple-700/60 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 shrink-0 shadow-inner">
          <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-tight leading-none">
            Stake
          </span>
          <span className="text-xs sm:text-base font-black text-amber-300 truncate leading-tight mt-0.5">
            {roundConfig.stake} ETB
          </span>
          <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 leading-none">
            (per slot)
          </span>
        </div>
      </div>

      {/* 2. PRIZE CARD */}
      <div className="flex items-center gap-2 sm:gap-2.5 bg-gradient-to-b from-[#220745] to-[#16042e] border border-purple-700/60 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-slate-950 shrink-0 shadow-inner">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-tight leading-none">
            Prize
          </span>
          <span className="text-xs sm:text-base font-black text-amber-300 truncate leading-tight mt-0.5">
            {roundConfig.prize} ETB
          </span>
        </div>
      </div>

      {/* 3. ADMIN FEE CARD */}
      <div className="flex items-center gap-2 sm:gap-2.5 bg-gradient-to-b from-[#220745] to-[#16042e] border border-purple-700/60 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-md">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-inner">
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-tight leading-none">
            Admin Fee
          </span>
          <span className="text-xs sm:text-base font-black text-amber-300 truncate leading-tight mt-0.5">
            {roundConfig.adminFee} ETB
          </span>
        </div>
      </div>
    </div>
  );
};
