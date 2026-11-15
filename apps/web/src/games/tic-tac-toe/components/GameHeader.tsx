import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Volume2, VolumeX, Trophy, ShieldCheck, Wallet, Plus, HelpCircle } from 'lucide-react';
import { UserTttStats } from '../types/ticTacToe.types';
import { useWalletStore } from '../../../stores/walletStore';

export interface GameHeaderProps {
  onBack?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenHelp?: () => void;
  userStats: UserTttStats;
  soundEnabled: boolean;
  onToggleSound: () => void;
  matchId?: string;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  onBack,
  onOpenLeaderboard,
  onOpenHelp,
  userStats,
  soundEnabled,
  onToggleSound,
  matchId,
}) => {
  const { balance } = useWalletStore();

  return (
    <header className="w-full flex items-center justify-between py-2.5 px-2 sm:px-4 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md z-30 select-none">
      {/* Brand & Back Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all"
            aria-label="Back to home"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-xs sm:text-base font-black tracking-wider text-white">
              NOVA <span className="text-[#00e5ff]">TIC-TAC-TOE</span>
            </h1>
            <span className="text-[9px] sm:text-[10px] bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 font-black px-1.5 py-0.2 rounded uppercase">
              ARENA
            </span>
          </div>
          {matchId && (
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-mono">ID: {matchId.slice(-8)}</p>
          )}
        </div>
      </div>

      {/* Controls & Stats */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Wallet Balance Badge */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Link
            to="/wallet"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700 text-[11px] sm:text-xs font-mono font-black text-emerald-400 hover:text-emerald-300 transition-colors"
            title="Wallet Balance"
          >
            <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
            <span>{balance.toLocaleString()} ETB</span>
          </Link>
          <Link
            to="/wallet?tab=deposit"
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center active:scale-95 transition-all shadow-md"
            title="Deposit funds"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>

        {/* Rating Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-bold text-amber-300">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>{userStats.rating} ELO</span>
        </div>

        {/* How to Play CTA */}
        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900 border border-slate-700/80 text-cyan-400 hover:text-cyan-300 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
            aria-label="How to Play"
            title="How to Play & Rules"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}

        {/* Leaderboard CTA */}
        {onOpenLeaderboard && (
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900 border border-slate-700/80 text-amber-400 hover:text-amber-300 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
            aria-label="Leaderboard"
            title="View Leaderboard"
          >
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={onToggleSound}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
          aria-label="Toggle sound"
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
          )}
        </button>
      </div>
    </header>
  );
};
