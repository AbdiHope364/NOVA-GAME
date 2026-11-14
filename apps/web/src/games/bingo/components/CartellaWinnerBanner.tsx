import React from 'react';
import { Trophy } from 'lucide-react';
import { CartellaRoundConfig } from '@nova/types';

interface CartellaWinnerBannerProps {
  roundConfig: CartellaRoundConfig;
}

export const CartellaWinnerBanner: React.FC<CartellaWinnerBannerProps> = ({ roundConfig }) => {
  return (
    <div className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-[#210940] via-[#2d0e57] to-[#210940] border-2 border-amber-500/60 rounded-2xl p-2.5 sm:p-3 shadow-[0_0_18px_rgba(245,158,11,0.25)] select-none">
      {/* 3D Golden Trophy Icon */}
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 flex items-center justify-center text-slate-950 shrink-0 shadow-lg border border-amber-200">
        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 fill-amber-300" />
      </div>

      <div className="flex flex-col text-left min-w-0">
        <div className="text-xs sm:text-base font-black text-white leading-tight">
          Win with:{' '}
          <span className="text-amber-300 drop-shadow-sm font-black">
            {roundConfig.patternName} Pattern
          </span>
        </div>
        <div className="text-[11px] sm:text-xs text-purple-200/90 font-medium leading-tight mt-0.5 truncate">
          {roundConfig.patternDescription}
        </div>
      </div>
    </div>
  );
};
