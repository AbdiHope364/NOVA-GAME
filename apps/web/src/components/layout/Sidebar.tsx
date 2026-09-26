import React from 'react';
import { NavLink } from 'react-router-dom';
import { Gamepad2, Coins, Dices, Rocket, CircleDot, History, Wallet, ShieldCheck } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const games = [
    { id: 'coin-flip', name: 'Coin Flip', icon: Coins, path: '/games/coin-flip', color: 'text-amber-400' },
    { id: 'dice', name: 'Dice', icon: Dices, path: '/games/dice', color: 'text-cyan-400' },
    { id: 'crash', name: 'Crash Rocket', icon: Rocket, path: '/games/crash', color: 'text-rose-400' },
    { id: 'roulette', name: 'Roulette', icon: CircleDot, path: '/games/roulette', color: 'text-emerald-400' },
  ];

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800/80 p-4 flex flex-col gap-6 shrink-0 min-h-[calc(100vh-57px)]">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-3">
          Game Plug-in Modules
        </span>
        {games.map((g) => {
          const Icon = g.icon;
          return (
            <NavLink
              key={g.id}
              to={g.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 border border-cyan-500/30 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className={`w-4 h-4 ${g.color}`} />
              <span>{g.name}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="flex flex-col gap-1 border-t border-slate-800 pt-4">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-3">
          Platform Services
        </span>
        <NavLink
          to="/wallet"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition-all ${
              isActive ? 'bg-cyan-500/10 border border-cyan-500/30 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`
          }
        >
          <Wallet className="w-4 h-4 text-cyan-400" />
          <span>Wallet Ledger</span>
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-sm transition-all ${
              isActive ? 'bg-cyan-500/10 border border-cyan-500/30 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`
          }
        >
          <History className="w-4 h-4 text-purple-400" />
          <span>Bet History & Audit</span>
        </NavLink>
      </div>

      <div className="mt-auto bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-300 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Provably Fair Core
        </div>
        <p className="text-[11px] text-slate-500">
          All plug-in games run on cryptographic HMAC-SHA256 seed pairs.
        </p>
      </div>
    </aside>
  );
};
