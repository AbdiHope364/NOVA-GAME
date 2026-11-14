import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { api } from '../../services/api';
import { LeaderboardEntry } from '../../components/dashboard/LeaderboardPreview';

export const LeaderboardPage: React.FC = () => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('weekly');
  const [metric, setMetric] = useState<'points' | 'wins' | 'wagered'>('points');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/dashboard/leaderboard', { params: { period, metric } })
      .then((res) => {
        if (res.data?.data) {
          setEntries(res.data.data.entries || []);
          setMyEntry(res.data.data.myEntry || null);
        }
      })
      .catch(() => {
        setEntries([]);
        setMyEntry(null);
      })
      .finally(() => setLoading(false));
  }, [period, metric]);

  const periods: Array<{ id: 'daily' | 'weekly' | 'monthly' | 'all'; label: string }> = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'all', label: 'All-Time' },
  ];

  const metrics: Array<{ id: 'points' | 'wins' | 'wagered'; label: string }> = [
    { id: 'points', label: 'Total Points' },
    { id: 'wins', label: 'Total Wins' },
    { id: 'wagered', label: 'Volume (ETB)' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-400" /> Player Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Public ranking across solo and multiplayer matches. Private account data is never displayed.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as any)}
            aria-label="Ranking metric"
            className="bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-violet-500"
          >
            {metrics.map((m) => (
              <option key={m.id} value={m.id}>
                Rank by: {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              period === p.id
                ? 'bg-violet-600 text-white'
                : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Current User Summary Card */}
      {myEntry && (
        <div className="rounded-2xl bg-violet-500/10 border border-violet-500/35 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl bg-violet-600 text-white font-black text-sm">
              #{myEntry.rank}
            </span>
            <div>
              <div className="text-sm font-bold text-white">Your Current Rank ({myEntry.username})</div>
              <div className="text-xs text-slate-300">
                {myEntry.wins} wins · {myEntry.gamesPlayed} games played
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-mono font-black text-cyan-300">
              {myEntry.points.toLocaleString()} pts
            </div>
            <div className="text-[11px] text-slate-400">
              {myEntry.wageredEtb.toLocaleString()} ETB played
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="rounded-2xl bg-[#111827] border border-slate-800/80 overflow-x-auto">
        {loading ? (
          <div className="p-5 space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="p-10 text-center text-xs sm:text-sm text-slate-400">
            No ranked activity recorded for this period yet.
          </div>
        ) : (
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[520px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase bg-[#0b101b]">
                <th className="py-3 px-4 font-semibold">Rank</th>
                <th className="py-3 px-4 font-semibold">Player</th>
                <th className="py-3 px-4 font-semibold">Games</th>
                <th className="py-3 px-4 font-semibold">Wins</th>
                <th className="py-3 px-4 font-semibold text-right">Volume</th>
                <th className="py-3 px-4 font-semibold text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {entries.map((entry) => (
                <tr
                  key={`${entry.rank}-${entry.username}`}
                  className={entry.isCurrentUser ? 'bg-violet-500/10' : 'hover:bg-slate-800/30'}
                >
                  <td className="py-3 px-4 font-mono font-bold text-white">#{entry.rank}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {entry.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-white">
                        {entry.username} {entry.isCurrentUser ? '(You)' : ''}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{entry.gamesPlayed}</td>
                  <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">{entry.wins}</td>
                  <td className="py-3 px-4 font-mono text-slate-300 text-right">
                    {entry.wageredEtb.toLocaleString()} ETB
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-cyan-300 text-right">
                    {entry.points.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
