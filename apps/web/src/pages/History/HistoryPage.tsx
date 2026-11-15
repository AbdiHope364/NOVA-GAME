import React, { useEffect, useState } from 'react';
import { Calendar, Eye, History, ShieldCheck, X } from 'lucide-react';
import { api } from '../../services/api';
import { GAMES_CATALOG } from '../../config/games';
import { useAuthStore } from '../../stores/authStore';
import { SkeletonTable } from '../../components/common/LoadingSpinner';

interface HistoryItem {
  id: string;
  gameId: string;
  gameName: string;
  mode: 'SOLO' | 'PVP';
  matchCode: string;
  stakeEtb: number;
  payoutEtb: number;
  netProfitEtb: number;
  multiplier: number;
  result: 'WIN' | 'LOSS' | 'DRAW' | 'PENDING';
  status: string;
  createdAt: string;
  details?: Record<string, any>;
}

export const HistoryPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState<string>('ALL');
  const [resultFilter, setResultFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedMatch, setSelectedMatch] = useState<HistoryItem | null>(null);

  const loadHistory = async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/dashboard/history', {
        params: {
          gameId: gameFilter,
          result: resultFilter,
          ...(dateFrom ? { from: dateFrom } : {}),
          ...(dateTo ? { to: dateTo } : {}),
          limit: 120,
        },
      });
      setItems(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [isAuthenticated, gameFilter, resultFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (!selectedMatch) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedMatch(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedMatch]);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-violet-400" /> Game History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Complete match history across all solo games, Letti 1v1 duels, and Ethiopian Dama PvP.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" /> Provably Fair Audited
        </span>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-[#111827] border border-slate-800/80 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="space-y-1">
          <label htmlFor="hist-game" className="text-slate-400 font-semibold block">
            Game
          </label>
          <select
            id="hist-game"
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
          >
            <option value="ALL">All 11 Games</option>
            {GAMES_CATALOG.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="hist-result" className="text-slate-400 font-semibold block">
            Outcome
          </label>
          <select
            id="hist-result"
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
          >
            <option value="ALL">All Results</option>
            <option value="WIN">Wins Only</option>
            <option value="LOSS">Losses Only</option>
            <option value="DRAW">Draws</option>
            <option value="PENDING">Pending / Live</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="hist-from" className="text-slate-400 font-semibold flex items-center gap-1">
            <Calendar className="w-3 h-3" /> From Date
          </label>
          <input
            id="hist-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="hist-to" className="text-slate-400 font-semibold flex items-center gap-1">
            <Calendar className="w-3 h-3" /> To Date
          </label>
          <input
            id="hist-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-2xl bg-[#111827] border border-slate-800/80 overflow-x-auto">
        {loading ? (
          <SkeletonTable rows={5} columns={8} />
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-xs sm:text-sm text-slate-400">
            No matching games found for the selected filters.
          </div>
        ) : (
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase bg-[#0b101b]">
                <th className="py-3 px-4 font-semibold">Game</th>
                <th className="py-3 px-4 font-semibold">Match ID</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Stake</th>
                <th className="py-3 px-4 font-semibold">Payout</th>
                <th className="py-3 px-4 font-semibold">Result</th>
                <th className="py-3 px-4 font-semibold text-right">Net Result</th>
                <th className="py-3 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-white">
                    {item.gameName}
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.mode}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{item.matchCode}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-200">
                    {item.stakeEtb.toLocaleString()} ETB
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-200">
                    {item.payoutEtb.toLocaleString()} ETB
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.result === 'WIN'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : item.result === 'LOSS'
                          ? 'bg-rose-500/15 text-rose-300'
                          : item.result === 'DRAW'
                          ? 'bg-slate-700 text-slate-200'
                          : 'bg-orange-500/15 text-orange-300'
                      }`}
                    >
                      {item.result}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-4 font-mono font-bold text-right ${
                      item.netProfitEtb > 0
                        ? 'text-emerald-400'
                        : item.netProfitEtb < 0
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.netProfitEtb > 0 ? '+' : ''}
                    {item.netProfitEtb.toLocaleString()} ETB
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedMatch(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Match Details Modal */}
      {selectedMatch && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedMatch(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Match Details"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">{selectedMatch.gameName}</h2>
                <span className="text-xs font-mono text-slate-400">
                  Match #{selectedMatch.matchCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
                aria-label="Close match details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-xl bg-[#0b101b] p-3">
                <span className="text-slate-400 block">Stake</span>
                <strong className="text-white font-mono">
                  {selectedMatch.stakeEtb.toLocaleString()} ETB
                </strong>
              </div>
              <div className="rounded-xl bg-[#0b101b] p-3">
                <span className="text-slate-400 block">Payout</span>
                <strong className="text-emerald-400 font-mono">
                  {selectedMatch.payoutEtb.toLocaleString()} ETB
                </strong>
              </div>
              <div className="rounded-xl bg-[#0b101b] p-3">
                <span className="text-slate-400 block">Outcome</span>
                <strong className="text-white">{selectedMatch.result}</strong>
              </div>
              <div className="rounded-xl bg-[#0b101b] p-3">
                <span className="text-slate-400 block">Mode</span>
                <strong className="text-cyan-300">{selectedMatch.mode}</strong>
              </div>
            </div>

            {selectedMatch.details && (
              <div className="rounded-xl bg-[#0b101b] border border-slate-800 p-3 text-[11px] font-mono text-slate-300 overflow-x-auto">
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(selectedMatch.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
