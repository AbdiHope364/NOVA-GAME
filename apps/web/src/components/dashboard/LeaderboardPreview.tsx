import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy } from 'lucide-react';

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatarUrl?: string | null;
  gamesPlayed: number;
  wins: number;
  wageredEtb: number;
  points: number;
  isCurrentUser?: boolean;
}

interface LeaderboardPreviewProps {
  entries: LeaderboardEntry[];
  loading?: boolean;
}

export const LeaderboardPreview: React.FC<LeaderboardPreviewProps> = ({
  entries,
  loading = false,
}) => {
  return (
    <section
      className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-4 sm:p-5 space-y-3 h-full"
      aria-label="Leaderboard Preview"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h2 className="text-base font-bold text-white">Weekly Leaderboard</h2>
        </div>
        <Link
          to="/leaderboard"
          className="text-xs font-bold text-[#8B5CF6] hover:underline inline-flex items-center gap-1"
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-11 rounded-xl bg-[#11101D] animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#A8A3BC]">
          Play any game to earn leaderboard ranking points this week!
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const initials = entry.username.slice(0, 2).toUpperCase();
            return (
              <div
                key={`${entry.rank}-${entry.username}`}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  entry.isCurrentUser
                    ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/50'
                    : 'bg-[#11101D] border-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                      entry.rank === 1
                        ? 'bg-amber-500/20 text-amber-300'
                        : entry.rank === 2
                        ? 'bg-white/15 text-white'
                        : entry.rank === 3
                        ? 'bg-orange-500/20 text-orange-300'
                        : 'bg-[#24213A] text-[#A8A3BC]'
                    }`}
                  >
                    #{entry.rank}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#22D3EE] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {entry.username} {entry.isCurrentUser ? '(You)' : ''}
                    </div>
                    <div className="text-[11px] text-[#A8A3BC]">
                      {entry.wins} wins · {entry.gamesPlayed} games
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-[#22D3EE]">
                    {entry.points.toLocaleString()} pts
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
