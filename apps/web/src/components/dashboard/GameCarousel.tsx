import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Users } from 'lucide-react';
import { GameCatalogItem } from '../../config/games';
import { GameThumbnail } from './GameThumbnail';

interface GameCarouselProps {
  games: GameCatalogItem[];
  disabledGames: Set<string>;
  maintenanceMode: boolean;
}

export const GameCarousel: React.FC<GameCarouselProps> = ({
  games,
  disabledGames,
  maintenanceMode,
}) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="space-y-3" aria-label="Featured Games">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">Featured Games</h2>
          <p className="text-xs text-[#A8A3BC]">Most popular instant &amp; multiplayer games</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scrollBy(-320)}
            aria-label="Scroll featured games left"
            className="w-8 h-8 rounded-xl bg-[#24213A] hover:bg-[#2f2b4a] border border-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(320)}
            aria-label="Scroll featured games right"
            className="w-8 h-8 rounded-xl bg-[#24213A] hover:bg-[#2f2b4a] border border-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-1 no-scrollbar"
      >
        {games.map((game) => {
          const isDisabled = maintenanceMode || disabledGames.has(game.id);
          return (
            <div
              key={game.id}
              className="snap-start shrink-0 w-[250px] sm:w-[275px] rounded-2xl bg-[#24213A] border border-white/[0.06] hover:border-[#8B5CF6]/55 p-3.5 flex flex-col justify-between gap-3 transition-all"
            >
              <div className="space-y-2.5">
                <div className="relative">
                  <GameThumbnail gameId={game.id} />
                  {game.multiplayer && (
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] text-[10px] font-bold backdrop-blur-md">
                      <Users className="w-3 h-3" /> {game.multiplayerLabel || 'Multiplayer'}
                    </span>
                  )}
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#11101D]/85 text-[#8B5CF6] text-[10px] font-bold">
                    {game.payout}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-white">{game.name}</h3>
                  <p className="text-xs text-[#A8A3BC] line-clamp-2 mt-0.5">{game.description}</p>
                </div>
              </div>

              {isDisabled ? (
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 rounded-xl bg-[#11101D] text-[#A8A3BC] text-xs font-bold cursor-not-allowed"
                >
                  Under Maintenance
                </button>
              ) : (
                <Link
                  to={game.path}
                  className="w-full py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-violet-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Play {game.shortName}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
