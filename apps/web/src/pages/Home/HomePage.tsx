import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '@nova/ui';
import { Coins, Dices, Rocket, CircleDot, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  const games = [
    {
      id: 'coin-flip',
      name: 'Coin Flip',
      desc: 'Pick HEADS or TAILS → Enter bet → Win 1.96x instantly.',
      icon: Coins,
      path: '/games/coin-flip',
      badge: 'PLAYABLE NOW 🪙',
      badgeVariant: 'success' as const,
      isPlayable: true,
      color: 'from-amber-500/20 via-slate-900 to-slate-900 border-amber-500/40 text-amber-400',
    },
    {
      id: 'dice',
      name: 'Dice',
      desc: 'Choose target number 1-6 or roll under/over.',
      icon: Dices,
      path: '#',
      badge: 'COMING SOON (Phase 2)',
      badgeVariant: 'info' as const,
      isPlayable: false,
      color: 'from-slate-900 to-slate-900 border-slate-800 text-slate-500 opacity-75',
    },
    {
      id: 'crash',
      name: 'Crash Rocket',
      desc: 'Watch rocket multiplier curve climb up to 1,000,000x.',
      icon: Rocket,
      path: '#',
      badge: 'COMING SOON (Phase 3)',
      badgeVariant: 'info' as const,
      isPlayable: false,
      color: 'from-slate-900 to-slate-900 border-slate-800 text-slate-500 opacity-75',
    },
    {
      id: 'roulette',
      name: 'Roulette',
      desc: 'European single zero roulette wheel.',
      icon: CircleDot,
      path: '#',
      badge: 'COMING SOON (Phase 4)',
      badgeVariant: 'info' as const,
      isPlayable: false,
      color: 'from-slate-900 to-slate-900 border-slate-800 text-slate-500 opacity-75',
    },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-2">
      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl flex flex-col gap-3">
          <Badge variant="info" className="w-fit gap-1.5 items-center">
            <Cpu className="w-3.5 h-3.5" /> NOVA Gaming Multi-Game Platform
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            NOVA GAMING
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Build the platform once, make each game a plug-in module. Starting with 🪙 <strong className="text-amber-400">Coin Flip</strong> to prove the platform architecture, virtual wallet ledger, and provably fair mechanics.
          </p>
        </div>
      </div>

      {/* Game Lobby Grid */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🎮 Game Lobby
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {games.map((g) => {
            const Icon = g.icon;
            return (
              <Card
                key={g.id}
                className={`flex flex-col justify-between bg-gradient-to-b ${g.color} border transition-all ${
                  g.isPlayable ? 'hover:scale-[1.02] shadow-xl' : ''
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center ${g.isPlayable ? 'text-amber-400' : 'text-slate-600'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant={g.badgeVariant}>{g.badge}</Badge>
                  </div>
                  <h3 className="font-extrabold text-xl text-white">{g.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{g.desc}</p>
                </div>

                <div className="mt-6">
                  {g.isPlayable ? (
                    <Link to={g.path}>
                      <Button variant="accent" className="w-full flex items-center justify-center gap-2 py-3 font-bold">
                        PLAY NOW <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button variant="secondary" disabled className="w-full text-xs cursor-not-allowed">
                      COMING SOON
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

