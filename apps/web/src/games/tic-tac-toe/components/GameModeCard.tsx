import React from 'react';
import { Bot, Zap, Swords, Lock, Flame } from 'lucide-react';
import { TttGameMode } from '../types/ticTacToe.types';

export interface GameModeCardProps {
  mode: TttGameMode;
  title: string;
  subtitle: string;
  badge?: string;
  iconName: 'bot' | 'zap' | 'swords' | 'lock' | 'flame';
  isLocked?: boolean;
  onClick: () => void;
}

export const GameModeCard: React.FC<GameModeCardProps> = ({
  mode,
  title,
  subtitle,
  badge,
  iconName,
  isLocked = false,
  onClick,
}) => {
  const renderIcon = () => {
    switch (iconName) {
      case 'bot':
        return <Bot className="w-6 h-6 text-[#00e5ff]" />;
      case 'zap':
        return <Zap className="w-6 h-6 text-amber-400" />;
      case 'swords':
        return <Swords className="w-6 h-6 text-fuchsia-400" />;
      case 'lock':
        return <Lock className="w-6 h-6 text-emerald-400" />;
      case 'flame':
        return <Flame className="w-6 h-6 text-rose-400" />;
    }
  };

  return (
    <button
      type="button"
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      className={`relative w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all duration-300 border ${
        isLocked
          ? 'bg-slate-900/40 border-slate-800/50 opacity-60 cursor-not-allowed'
          : 'bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/80 border-slate-800 hover:border-cyan-500/50 hover:shadow-[0_0_25px_rgba(0,229,255,0.15)] active:scale-[0.99] cursor-pointer'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
          {renderIcon()}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-white font-black text-sm sm:text-base tracking-wide">
              {title}
            </h3>
            {badge && (
              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold px-2 py-0.5 rounded-full uppercase">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="text-slate-500">
        <svg className="w-5 h-5 text-slate-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
};
