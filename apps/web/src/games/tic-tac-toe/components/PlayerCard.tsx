import React from 'react';
import { FrontendTttPlayer, TttSymbol } from '../types/ticTacToe.types';

export interface PlayerCardProps {
  player: FrontendTttPlayer;
  isCurrentTurn: boolean;
  isLocalPlayer: boolean;
  remainingSeconds?: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentTurn,
  isLocalPlayer,
  remainingSeconds,
}) => {
  const isX = player.symbol === 'X';

  return (
    <div
      className={`relative flex items-center gap-2.5 p-2 sm:p-2.5 rounded-2xl transition-all duration-300 ${
        isCurrentTurn
          ? isX
            ? 'bg-cyan-950/40 border-2 border-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.4)]'
            : 'bg-fuchsia-950/40 border-2 border-[#d946ef] shadow-[0_0_20px_rgba(217,70,239,0.4)]'
          : 'bg-slate-900/60 border border-slate-800/80 opacity-80'
      }`}
    >
      {/* Symbol Badge */}
      <div
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-lg sm:text-xl shrink-0 shadow-lg ${
          isX
            ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/40 shadow-[0_0_10px_rgba(0,229,255,0.3)]'
            : 'bg-[#d946ef]/20 text-[#d946ef] border border-[#d946ef]/40 shadow-[0_0_10px_rgba(217,70,239,0.3)]'
        }`}
      >
        {player.symbol}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-white text-xs sm:text-sm font-bold truncate">
            {player.username}
          </span>
          {isLocalPlayer && (
            <span className="text-[9px] bg-slate-800 text-slate-300 font-bold px-1.5 py-0.2 rounded-full">
              YOU
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-400 font-semibold">
          <span>{player.rating} ELO</span>
          {!player.isConnected && (
            <span className="text-rose-400 animate-pulse font-bold">• Disconnected</span>
          )}
        </div>
      </div>

      {/* Turn Countdown Badge */}
      {isCurrentTurn && remainingSeconds !== undefined && (
        <div
          className={`shrink-0 px-2 py-0.5 rounded-lg text-xs font-black tracking-tight ${
            remainingSeconds <= 5
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
              : 'bg-white/10 text-white'
          }`}
        >
          {remainingSeconds}s
        </div>
      )}
    </div>
  );
};
