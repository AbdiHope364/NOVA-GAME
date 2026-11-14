import React from 'react';
import { Trophy, Medal, X } from 'lucide-react';
import { LeaderboardEntry } from '../types/ticTacToe.types';

export interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-[460px] max-h-[85vh] flex flex-col p-5 rounded-3xl bg-slate-950/95 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white text-base font-black tracking-wide">ARENA LEADERBOARD</h3>
              <p className="text-[11px] text-slate-400">Top ranked Tic-Tac-Toe gladiators</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 mt-4 pr-1">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-semibold">
              No ranked matches recorded yet. Play a match to claim the #1 spot!
            </div>
          ) : (
            entries.map((player) => (
              <div
                key={`lb-${player.userId}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Rank badge */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                      player.rank === 1
                        ? 'bg-amber-400 text-slate-950 font-black shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                        : player.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : player.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {player.rank}
                  </div>

                  <div className="min-w-0">
                    <span className="text-white text-xs sm:text-sm font-bold block truncate">
                      {player.username}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {player.wins}W • {player.losses}L • {player.draws}D ({player.winRate}%)
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-amber-400 font-mono font-bold text-xs sm:text-sm block">
                    {player.rating} ELO
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
