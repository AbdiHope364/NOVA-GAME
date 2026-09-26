import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@nova/ui';
import { Users, DollarSign, Activity, ShieldAlert, Layers } from 'lucide-react';

export function App() {
  const [stats, setStats] = useState<any>({
    userCount: 142,
    betCount: 3890,
    totalTurnover: 125430.0,
    totalPayout: 122100.0,
    grossGamingRevenue: 3330.0,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            🛡️ NOVA Gaming Admin Dashboard
          </h1>
          <p className="text-xs text-slate-400">Platform analytics, GGR metrics, and plug-in game management</p>
        </div>
        <Badge variant="info">Monorepo System Control</Badge>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col gap-2 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Total Users</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-3xl font-extrabold text-white">{stats.userCount}</span>
        </Card>

        <Card className="flex flex-col gap-2 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Total Bets Placed</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-3xl font-extrabold text-white">{stats.betCount}</span>
        </Card>

        <Card className="flex flex-col gap-2 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Wager Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-3xl font-extrabold text-emerald-400 font-mono">
            ${stats.totalTurnover.toLocaleString()}
          </span>
        </Card>

        <Card className="flex flex-col gap-2 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Gross Gaming Revenue (GGR)</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-3xl font-extrabold text-amber-400 font-mono">
            ${stats.grossGamingRevenue.toLocaleString()}
          </span>
        </Card>
      </div>

      {/* Plug-in Game Modules List */}
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" /> Plug-in Game Engine Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['coin-flip', 'dice', 'crash', 'roulette'].map((g) => (
            <div key={g} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white uppercase text-sm">{g}</span>
                <Badge variant="success">Active Plug-in</Badge>
              </div>
              <p className="text-xs text-slate-500">Decoupled module running via `@nova/game-${g}`</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default App;
