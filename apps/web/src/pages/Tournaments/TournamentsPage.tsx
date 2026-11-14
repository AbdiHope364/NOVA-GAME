import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Crown, Swords, Trophy } from 'lucide-react';

export const TournamentsPage: React.FC = () => {
  const competitions = [
    {
      title: 'Letti Card 1v1 Weekly Arena',
      game: 'Letti Card Face-to-Face',
      status: 'Open Play · Weekly Ranking',
      description: 'Compete in 1v1 Letti Card matches to climb the weekly player leaderboard.',
      to: '/games/letti',
      cta: 'Play Letti 1v1',
      icon: Swords,
      accent: 'text-[#8B5CF6] bg-[#8B5CF6]/15',
    },
    {
      title: 'Ethiopian Dama Classic Ladder',
      game: 'Ethiopian Dama 1v1',
      status: 'Open Play · Skill Ladder',
      description: 'Challenge opponents in head-to-head Ethiopian Dama matches and track your ranking points.',
      to: '/games/dama',
      cta: 'Enter Dama Lobby',
      icon: Crown,
      accent: 'text-[#22D3EE] bg-[#22D3EE]/15',
    },
    {
      title: '75-Ball Bingo Community Rounds',
      game: '75-Ball Bingo',
      status: 'Live Rounds Active',
      description: 'Join scheduled Bingo rooms and compete for line, four-corner, and full-house patterns.',
      to: '/games/bingo',
      cta: 'Open Bingo Room',
      icon: Trophy,
      accent: 'text-[#22C55E] bg-[#22C55E]/15',
    },
  ];

  return (
    <div className="w-full space-y-5">
      <div className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#22D3EE]">
            <Award className="w-4 h-4" /> Competitive Arenas
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
            Tournaments &amp; Ladders
          </h1>
          <p className="text-xs sm:text-sm text-[#A8A3BC] mt-0.5">
            Enter live competitive rooms and earn ranking points toward the Daily, Weekly, and Monthly Leaderboards.
          </p>
        </div>

        <Link
          to="/leaderboard"
          className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-violet-500 text-white text-xs font-bold transition-colors"
        >
          View Live Leaderboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {competitions.map((comp) => {
          const Icon = comp.icon;
          return (
            <div
              key={comp.title}
              className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${comp.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#11101D] text-[10px] font-bold text-[#22C55E]">
                    {comp.status}
                  </span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{comp.title}</h2>
                  <p className="text-xs text-[#A8A3BC] mt-1 leading-relaxed">
                    {comp.description}
                  </p>
                </div>
              </div>

              <Link
                to={comp.to}
                className="w-full py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-violet-500 text-white text-xs font-bold text-center transition-colors"
              >
                {comp.cta}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
