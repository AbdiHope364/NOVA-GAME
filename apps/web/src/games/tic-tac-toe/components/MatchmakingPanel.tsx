import React from 'react';
import { Loader2, X, Shield, Swords } from 'lucide-react';
import { TttGameMode } from '../types/ticTacToe.types';

export interface MatchmakingPanelProps {
  mode: TttGameMode;
  userRating: number;
  username: string;
  onCancel: () => void;
  statusMessage?: string | null;
}

export const MatchmakingPanel: React.FC<MatchmakingPanelProps> = ({
  mode,
  userRating,
  username,
  onCancel,
  statusMessage,
}) => {
  return (
    <div className="w-full max-w-[420px] mx-auto p-6 rounded-3xl bg-slate-950/90 border border-cyan-500/30 shadow-[0_0_50px_rgba(0,229,255,0.2)] backdrop-blur-2xl text-center select-none animate-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-500/30">
          {mode === 'RANKED' ? 'Ranked Matchmaking' : 'Quick Match'}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center active:scale-90"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Radar Scanning Ring */}
      <div className="relative w-36 h-36 mx-auto my-6 flex items-center justify-center">
        {/* Animated Expanding Radar Rings */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping duration-1000" />
        <div className="absolute inset-4 rounded-full border border-cyan-500/40 animate-pulse duration-700" />
        <div className="absolute inset-8 rounded-full border border-cyan-400/60" />

        {/* Center Arena Icon */}
        <div className="relative z-10 w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.6)]">
          <Swords className="w-8 h-8 text-cyan-300 animate-bounce" />
        </div>
      </div>

      {/* Status Info */}
      <h3 className="text-white text-base sm:text-lg font-black tracking-wide">
        SEARCHING FOR OPPONENT
      </h3>
      <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
        {statusMessage || 'Scanning competitive player pool within your skill rating...'}
      </p>

      {/* Player Snapshot */}
      <div className="mt-6 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
            👤
          </div>
          <div className="text-left">
            <span className="text-white text-xs font-bold block">{username}</span>
            <span className="text-[10px] text-slate-400 font-semibold">{userRating} ELO</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Searching...</span>
        </div>
      </div>

      {/* Cancel CTA */}
      <button
        type="button"
        onClick={onCancel}
        className="w-full mt-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold tracking-wider transition-all active:scale-95 cursor-pointer"
      >
        CANCEL MATCHMAKING
      </button>
    </div>
  );
};
