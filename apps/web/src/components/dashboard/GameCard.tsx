import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Users } from 'lucide-react';
import { GameCatalogItem } from '../../config/games';
import { GameThumbnail } from './GameThumbnail';

interface GameCardProps {
  game: GameCatalogItem;
  isDisabled?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (gameId: string) => void;
  playLabel?: string;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  isDisabled = false,
  isFavorite = false,
  onToggleFavorite,
  playLabel = 'Play Now',
}) => {
  return (
    <article
      className={`group rounded-2xl bg-[#24213A] border border-white/[0.06] p-3 flex flex-col justify-between gap-2.5 transition-all duration-200 ${
        isDisabled
          ? 'opacity-65'
          : 'hover:border-[#8B5CF6]/60 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(139,92,246,0.18)]'
      }`}
    >
      <div className="space-y-2.5">
        <div className="relative">
          <GameThumbnail gameId={game.id} compact />

          <span
            className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide backdrop-blur-md ${
              isDisabled
                ? 'bg-orange-500/20 text-orange-300'
                : 'bg-[#22C55E]/20 text-[#22C55E]'
            }`}
          >
            {isDisabled ? 'Maintenance' : 'Available'}
          </span>

          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(game.id)}
              aria-label={isFavorite ? `Remove ${game.name} from favorites` : `Add ${game.name} to favorites`}
              className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer ${
                isFavorite ? 'bg-[#8B5CF6] text-white' : 'bg-[#11101D]/75 text-[#A8A3BC] hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}

          {game.multiplayer && (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#22D3EE]/20 text-[#22D3EE] text-[10px] font-bold backdrop-blur-md">
              <Users className="w-3 h-3" /> {game.multiplayerLabel || 'Multiplayer'}
            </span>
          )}
        </div>

        <div className="space-y-1 px-0.5">
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <h3 className="font-bold text-[13px] sm:text-sm text-white truncate">{game.name}</h3>
            <span className="text-[10px] font-semibold text-[#22D3EE] shrink-0">{game.payout}</span>
          </div>
          <p className="text-[11px] text-[#A8A3BC] line-clamp-2 leading-relaxed">{game.description}</p>
        </div>
      </div>

      {isDisabled ? (
        <button
          type="button"
          disabled
          className="w-full py-2 px-3 rounded-xl bg-[#11101D] text-[#A8A3BC] text-xs font-bold cursor-not-allowed"
        >
          Unavailable
        </button>
      ) : (
        <Link
          to={game.path}
          className="w-full py-2 px-3 rounded-xl bg-[#8B5CF6] hover:bg-violet-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>{playLabel}</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </article>
  );
};
