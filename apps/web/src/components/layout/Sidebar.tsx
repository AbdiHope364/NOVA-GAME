import React from 'react';
import { NavLink } from 'react-router-dom';
import { useI18nStore } from '../../stores/i18nStore';
import { Coins, Dices, Rocket, CircleDot, ShieldCheck, Home, Trophy, Wallet, Settings, Layers, Sparkles, Crown, Shield, Bomb, Gift } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const t = useI18nStore((s) => s.t);

  return (
    <aside className="hidden md:flex w-64 bg-slate-900/60 border-r border-slate-800/80 p-4 flex-col gap-6 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto no-scrollbar">
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
          to="/games/plinko"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Plinko Pyramid</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">HOT</span>
        </NavLink>

        <NavLink
          to="/games/hilo"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Hi-Lo Cards</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">NEW</span>
        </NavLink>

        <NavLink
          to="/games/letti"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Letti Cards</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">NEW</span>
        </NavLink>

        <NavLink
          to="/games/dama"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Ethiopian Dama</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">CLASSIC</span>
        </NavLink>

        <NavLink
          to="/games/limbo"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Rocket className="w-4 h-4 text-amber-400" />
            <span>Limbo Rocket</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">NEW</span>
        </NavLink>

        <NavLink
          to="/games/bingo"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>75-Ball Bingo</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">PLAY</span>
        </NavLink>

        <NavLink
          to="/games/coin-flip"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 shadow-lg shadow-yellow-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span>{t.games.coinFlip.title}</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">PLAY</span>
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
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">PLAY</span>
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
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">PLAY</span>
        </NavLink>

        <NavLink
          to="/games/roulette"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <CircleDot className="w-4 h-4 text-emerald-400" />
            <span>{t.games.roulette.title}</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PLAY</span>
        </NavLink>

        <NavLink
          to="/games/mines"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Bomb className="w-4 h-4 text-emerald-400" />
            <span>Mines Gems</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">PLAY</span>
        </NavLink>

        <NavLink
          to="/wallet"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Wallet className="w-4 h-4 text-cyan-400" />
            <span>Wallet Ledger</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">PAY</span>
        </NavLink>

        <NavLink
          to="/promotions"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Gift className="w-4 h-4 text-amber-400" />
            <span>Bonus &amp; Referrals</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">1000%</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-purple-500/15 border border-purple-500/40 text-purple-300 shadow-lg shadow-purple-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-purple-400" />
            <span>Settings & Fair</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">SEED</span>
        </NavLink>

        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10'
                : 'text-slate-300 hover:bg-slate-800/50'
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Admin Control</span>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">PANEL</span>
        </NavLink>
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
