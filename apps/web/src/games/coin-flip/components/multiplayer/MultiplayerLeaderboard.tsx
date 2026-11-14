import React from 'react';
import { Trophy, Medal, Flame } from 'lucide-react';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  wins: number;
  matches: number;
  earnings: number;
}

export interface MultiplayerLeaderboardProps {
  entries: LeaderboardEntry[];
}

export const MultiplayerLeaderboard: React.FC<MultiplayerLeaderboardProps> = ({ entries }) => {
  return (
    <div className="w-full rounded-2xl bg-[#0c101c]/90 border border-slate-800/90 p-4 sm:p-5 select-none shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
            Arena High Rollers Leaderboard
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">Live Standings</span>
      </div>

      {entries.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 font-mono">
          No matches recorded on the leaderboard yet. Be the first to win!
        </div>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto no-scrollbar font-mono text-xs">
          {entries.map((player, idx) => {
            const winRate = player.matches > 0 ? Math.round((player.wins / player.matches) * 100) : 0;
            return (
              <div
                key={player.userId}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#070b14] border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 text-center font-black ${
                      idx === 0
                        ? 'text-amber-400'
                        : idx === 1
                        ? 'text-slate-300'
                        : idx === 2
                        ? 'text-amber-600'
                        : 'text-slate-600'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-xs">{player.username}</span>
                    <span className="text-[10px] text-slate-500">
                      {player.wins}W · {player.matches - player.wins}L ({winRate}% WR)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-emerald-400 font-extrabold text-xs block">
                    +{player.earnings.toFixed(0)} ETB
                  </span>
                  <span className="text-[10px] text-slate-600">Earnings</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
