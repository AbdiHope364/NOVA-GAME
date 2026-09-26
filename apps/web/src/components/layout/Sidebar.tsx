import React from 'react';
import { NavLink } from 'react-router-dom';
import { useI18nStore } from '../../stores/i18nStore';
import { Coins, Dices, Rocket, CircleDot, ShieldCheck, Home } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const t = useI18nStore((s) => s.t);

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800/80 p-4 flex flex-col gap-6 shrink-0 min-h-[calc(100vh-57px)]">
      <div className="flex flex-col gap-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`
          }
        >
          <Home className="w-4 h-4 text-amber-400" />
          <span>{t.common.gameLobby}</span>
        </NavLink>
      </div>

      <div className="flex flex-col gap-1 border-t border-slate-800/80 pt-4">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-3">
          {t.common.playableModules}
        </span>
        <NavLink
          to="/games/coin-flip"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{t.games.coinFlip.title}</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">PLAY 🪙</span>
        </NavLink>

        <NavLink
          to="/games/dice"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Dices className="w-4 h-4 text-cyan-400" />
            <span>{t.games.dice.title}</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">PLAY 🎲</span>
        </NavLink>

        <NavLink
          to="/games/crash"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300 shadow-lg shadow-rose-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Rocket className="w-4 h-4 text-rose-400" />
            <span>{t.games.crash.title}</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">PLAY 🚀</span>
        </NavLink>
      </div>

      <div className="flex flex-col gap-1 border-t border-slate-800/80 pt-4 opacity-70">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-3">
          {t.common.roadmapModules}
        </span>
        <div className="flex items-center justify-between px-3 py-2.5 text-slate-500 text-sm font-semibold">
          <div className="flex items-center gap-3">
            <CircleDot className="w-4 h-4 text-slate-600" />
            <span>{t.games.roulette.title}</span>
          </div>
          <span className="text-[9px] uppercase font-bold text-slate-600">Phase 4</span>
        </div>
      </div>

      <div className="mt-auto bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-300 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          {t.common.provablyFairEngine}
        </div>
        <p className="text-[11px] text-slate-500 leading-normal">
          {t.common.hmacValidation}
        </p>
      </div>
    </aside>
  );
};
