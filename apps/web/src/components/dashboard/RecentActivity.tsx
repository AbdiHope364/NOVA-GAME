import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, History } from 'lucide-react';

export interface ActivityRow {
  id: string;
  gameId: string;
  gameName: string;
  mode: 'SOLO' | 'PVP';
  matchCode: string;
  stakeEtb: number;
  payoutEtb: number;
  netProfitEtb: number;
  result: 'WIN' | 'LOSS' | 'DRAW' | 'PENDING';
  status: string;
  createdAt: string;
}

interface RecentActivityProps {
  items: ActivityRow[];
  loading?: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ items, loading = false }) => {
  const getResultBadge = (result: ActivityRow['result']) => {
    if (result === 'WIN') return 'bg-[#22C55E]/15 text-[#22C55E]';
    if (result === 'LOSS') return 'bg-rose-500/15 text-rose-300';
    if (result === 'DRAW') return 'bg-white/10 text-white';
    return 'bg-orange-500/15 text-orange-300';
  };

  return (
    <section
      className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-4 sm:p-5 space-y-3 h-full"
      aria-label="Recent Game Activity"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#8B5CF6]" />
          <h2 className="text-base font-bold text-white">Recent Matches &amp; Activity</h2>
        </div>
        <Link
          to="/history"
          className="text-xs font-bold text-[#22D3EE] hover:underline inline-flex items-center gap-1"
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
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#A8A3BC]">
          No recent games recorded yet. Launch any game above to see live activity here.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[520px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] text-[#A8A3BC] uppercase">
                <th className="py-2.5 pr-3 font-semibold">Game</th>
                <th className="py-2.5 px-3 font-semibold">Match ID</th>
                <th className="py-2.5 px-3 font-semibold">Date</th>
                <th className="py-2.5 px-3 font-semibold">Stake</th>
                <th className="py-2.5 px-3 font-semibold">Result</th>
                <th className="py-2.5 px-3 font-semibold text-right">Net P/L</th>
                <th className="py-2.5 pl-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 pr-3 font-semibold text-white">{item.gameName}</td>
                  <td className="py-2.5 px-3 font-mono text-[#A8A3BC]">{item.matchCode}</td>
                  <td className="py-2.5 px-3 text-[#A8A3BC]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-white">
                    {item.stakeEtb.toLocaleString()} ETB
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getResultBadge(item.result)}`}>
                      {item.result}
                    </span>
                  </td>
                  <td
                    className={`py-2.5 px-3 font-mono font-bold text-right ${
                      item.netProfitEtb > 0
                        ? 'text-[#22C55E]'
                        : item.netProfitEtb < 0
                        ? 'text-rose-400'
                        : 'text-[#A8A3BC]'
                    }`}
                  >
                    {item.netProfitEtb > 0 ? '+' : ''}
                    {item.netProfitEtb.toLocaleString()} ETB
                  </td>
                  <td className="py-2.5 pl-3 text-right text-[11px] text-[#A8A3BC]">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
