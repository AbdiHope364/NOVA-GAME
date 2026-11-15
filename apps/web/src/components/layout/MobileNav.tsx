import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Home,
  Rocket,
  Layers,
  Wallet,
  Gamepad2,
  X,
  CircleDot,
  Dices,
  Trophy,
  Grid,
  Coins,
  ShieldCheck,
  Flame,
  Settings,
  Sparkles,
  Crown,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const location = useLocation();

  // Automatically close the games menu whenever user navigates or route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const mainNavItems = [
    { to: '/', label: 'Lobby', icon: Home, end: true },
    { to: '/games/plinko', label: 'Plinko', icon: Layers },
    { to: '/games/crash', label: 'Crash', icon: Rocket },
    { to: '/games/limbo', label: 'Limbo', icon: Flame },
    { to: '/wallet', label: 'Wallet', icon: Wallet },
  ];

  // Games button is active if the menu is open, OR if user is on a game not listed directly in mainNavItems
  const isOtherGameActive =
    location.pathname.startsWith('/games/') &&
    !mainNavItems.some((item) => item.to === location.pathname);

  const allGames = [
    { to: '/games/plinko', label: 'Plinko Pyramid', icon: Layers, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
    { to: '/games/crash', label: 'Aviator Crash', icon: Rocket, color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' },
    { to: '/games/limbo', label: 'Limbo Rocket', icon: Flame, color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30' },
    { to: '/games/roulette', label: 'Mini Roulette', icon: CircleDot, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
    { to: '/games/dice', label: 'Provable Dice', icon: Dices, color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' },
    { to: '/games/bingo', label: '75-Ball Bingo', icon: Trophy, color: 'text-orange-400 bg-orange-500/15 border-orange-500/30' },
    { to: '/games/mines', label: 'Mines Sweeper', icon: Grid, color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' },
    { to: '/games/coin-flip', label: '3D Coin Flip', icon: Coins, color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30' },
    { to: '/games/hilo', label: 'Hi-Lo Cards', icon: Sparkles, color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' },
    { to: '/games/letti', label: 'Letti Cards', icon: Sparkles, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
    { to: '/games/dama', label: 'Ethiopian Dama', icon: Crown, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
  ];

  return (
    <>
      {/* Mobile All-Games Top Sheet Modal */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col justify-start md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="bg-slate-900 border-b border-slate-700/80 rounded-b-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 max-h-[82vh] overflow-y-auto pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-6 ring-1 ring-cyan-500/20 animate-in slide-in-from-top-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
                <span className="font-black text-white text-base">All 10 Casino & Board Modules</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                aria-label="Close games menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {allGames.map((g) => {
                const Icon = g.icon;
                return (
                  <Link
                    key={g.to}
                    to={g.to}
                    onClick={() => {
                      setIsMenuOpen(false);
                      const mainEl = document.querySelector('main');
                      if (mainEl) {
                        mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-850 border border-slate-800 flex items-center gap-3 transition-all active:scale-95"
                  >
                    <div className={`p-2 rounded-xl border ${g.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-bold text-white truncate">{g.label}</span>
                      <span className="text-[10px] text-slate-400">Provably Fair</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <Link
              to="/settings"
              onClick={() => {
                setIsMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="mt-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-cyan-300 flex items-center justify-between border border-cyan-500/20"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Provably Fair Seed Settings</span>
              </div>
              <Settings className="w-4 h-4 text-cyan-400" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl md:hidden px-1 pt-1 pb-safe flex items-center justify-around shadow-2xl">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => {
                setIsMenuOpen(false);
                const mainEl = document.querySelector('main');
                if (mainEl) {
                  mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 rounded-xl transition-all min-w-[48px] min-h-[46px] ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 font-extrabold scale-105 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 active:scale-95'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}

        {/* More Games Launcher Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1.5 rounded-xl transition-all min-w-[48px] min-h-[46px] ${
            isMenuOpen
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 scale-105'
              : isOtherGameActive
              ? 'bg-amber-500/15 text-amber-300 font-extrabold scale-105 border border-amber-500/30'
              : 'text-slate-400 hover:text-slate-200 active:scale-95'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span className="text-[10px] font-bold tracking-tight">Games</span>
        </button>
      </nav>
    </>
  );
};
