import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '@nova/ui';
import { Coins, Dices, Rocket, CircleDot, ShieldCheck, Cpu, Layers } from 'lucide-react';

export const HomePage: React.FC = () => {
  const games = [
    {
      id: 'coin-flip',
      name: 'Coin Flip',
      desc: 'Pick Heads or Tails. 1.98x payout multiplier.',
      icon: Coins,
      path: '/games/coin-flip',
      badge: '99.0% RTP',
      color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400',
    },
    {
      id: 'dice',
      name: 'Provably Fair Dice',
      desc: 'Set custom win chance & roll under/over target.',
      icon: Dices,
      path: '/games/dice',
      badge: '99.0% RTP',
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
    },
    {
      id: 'crash',
      name: 'Crash Rocket',
      desc: 'Watch the curve climb up to 1,000,000x multiplier!',
      icon: Rocket,
      path: '/games/crash',
      badge: '99.0% RTP',
      color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400',
    },
    {
      id: 'roulette',
      name: 'European Roulette',
      desc: 'Single Zero 37-slot roulette wheel with 36x multipliers.',
      icon: CircleDot,
      path: '/games/roulette',
      badge: '97.3% RTP',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl flex flex-col gap-4">
          <Badge variant="info" className="w-fit gap-1.5 items-center">
            <Cpu className="w-3.5 h-3.5" /> Core Platform Monorepo Architecture
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Build Once. Plug-In Unlimited Games.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            NOVA Gaming decouples shared services (Authentication, Wallet Ledger, Provably Fair HMAC Engine, Audit Logging) from individual game plug-ins (`coin-flip`, `dice`, `crash`, `roulette`).
          </p>
        </div>
      </div>

      {/* Game Cards Lobby */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" /> Plug-in Game Lobby
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {games.map((g) => {
            const Icon = g.icon;
            return (
              <Card key={g.id} className={`flex flex-col justify-between bg-gradient-to-b ${g.color} border transition-all hover:scale-[1.02]`}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="warning">{g.badge}</Badge>
                  </div>
                  <h3 className="font-bold text-lg text-white">{g.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{g.desc}</p>
                </div>
                <Link to={g.path} className="mt-6">
                  <Button variant="primary" className="w-full">
                    PLAY GAME NOW
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
