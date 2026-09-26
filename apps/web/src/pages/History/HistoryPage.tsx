import React, { useEffect, useState } from 'react';
import { Card, Badge } from '@nova/ui';
import { api } from '../../services/api';
import { ShieldCheck, History } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [bets, setBets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBets() {
      try {
        const res = await api.get('/games/bets/history');
        setBets(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBets();
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-purple-400" /> Bet History & Provably Fair Audit
          </h2>
          <p className="text-xs text-slate-400">Cryptographically verifiable game outcomes</p>
        </div>
        <Badge variant="info" className="gap-1 items-center">
          <ShieldCheck className="w-3.5 h-3.5" /> HMAC-SHA256 Validated
        </Badge>
      </div>

      <Card className="overflow-x-auto p-0 border-slate-800">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-950/60">
              <th className="p-4">Game</th>
              <th className="p-4">Bet</th>
              <th className="p-4">Multiplier</th>
              <th className="p-4">Payout</th>
              <th className="p-4">Provably Fair Hash</th>
              <th className="p-4">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 font-mono">
            {bets.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                  No bet history found. Play games to generate provably fair audit records!
                </td>
              </tr>
            ) : (
              bets.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-sans font-bold capitalize text-white">{b.gameId}</td>
                  <td className="p-4">${b.amount.toFixed(2)}</td>
                  <td className="p-4">{b.multiplier}x</td>
                  <td className={`p-4 font-bold ${b.won ? 'text-emerald-400' : 'text-slate-500'}`}>
                    ${b.payout.toFixed(2)}
                  </td>
                  <td className="p-4 text-xs text-slate-400 max-w-xs truncate" title={b.serverSeedHash}>
                    {b.serverSeedHash}
                  </td>
                  <td className="p-4 text-xs text-slate-500 font-sans">
                    {new Date(b.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
