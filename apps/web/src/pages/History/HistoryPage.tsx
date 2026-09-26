import React, { useEffect, useState } from 'react';
import { Card, Badge } from '@nova/ui';
import { api } from '../../services/api';
import { useI18nStore } from '../../stores/i18nStore';
import { ShieldCheck, History, Coins, Dices, Rocket } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [bets, setBets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = useI18nStore((s) => s.t);

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
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-purple-400" /> Platform Shared Game History
          </h2>
          <p className="text-xs text-slate-400">Audit game history across Coin Flip, Dice & Crash</p>
        </div>
        <Badge variant="info" className="gap-1 items-center">
          <ShieldCheck className="w-3.5 h-3.5" /> {t.common.provablyFair}
        </Badge>
      </div>

      <Card className="overflow-x-auto p-0 border-slate-800">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase bg-slate-950/60">
              <th className="p-4">Game</th>
              <th className="p-4">Bet Amount</th>
              <th className="p-4">Result</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 font-mono">
            {bets.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                  No bet history found. Play games to populate platform shared audit history!
                </td>
              </tr>
            ) : (
              bets.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-sans font-bold capitalize text-white flex items-center gap-2">
                    {b.gameId === 'coin-flip' ? <Coins className="w-4 h-4 text-amber-400" /> : b.gameId === 'dice' ? <Dices className="w-4 h-4 text-cyan-400" /> : <Rocket className="w-4 h-4 text-rose-400" />}
                    {b.gameId === 'coin-flip' ? 'Coin Flip' : b.gameId === 'dice' ? 'Dice' : 'Crash Rocket'}
                  </td>
                  <td className="p-4">{b.amount} ETB</td>
                  <td className="p-4 text-xs font-semibold text-slate-300">
                    {b.outcome?.crashPoint ? `${b.outcome.crashPoint}x` : b.outcome?.result || b.outcome?.roll || JSON.stringify(b.outcome)}
                  </td>
                  <td className="p-4 font-sans">
                    <span className={`px-2.5 py-1 text-xs font-extrabold rounded-md ${b.won ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                      {b.won ? 'WIN' : 'LOSS'}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-bold ${b.won ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {b.won ? `+${b.payout} ETB` : '+0 ETB'}
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
