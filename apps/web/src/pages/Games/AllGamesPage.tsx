import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Gamepad2, Heart, Search, Users, HelpCircle, BookOpen } from 'lucide-react';
import { api } from '../../services/api';
import { GAMES_CATALOG, GameCategory, useFavoriteGames } from '../../config/games';
import { GameCard } from '../../components/dashboard/GameCard';
import { HowToPlayModal } from '../../components/common/HowToPlayModal';

export const AllGamesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState<string>(searchParams.get('q') || '');
  const [category, setCategory] = useState<'ALL' | GameCategory>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'SINGLE' | 'MULTI'>('ALL');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [disabledGames, setDisabledGames] = useState<Set<string>>(new Set());
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedHelpGameId, setSelectedHelpGameId] = useState<string | null>(null);

  const { favorites, toggleFavorite } = useFavoriteGames();

  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam !== null) {
      setQuery(qParam);
    }
  }, [searchParams]);

  useEffect(() => {
    api
      .get('/games/configs')
      .then((res) => {
        const data = res.data?.data;
        if (data?.games) {
          setDisabledGames(
            new Set<string>(data.games.filter((g: any) => !g.enabled).map((g: any) => g.gameId))
          );
        }
        if (data?.platform?.maintenanceMode !== undefined) {
          setMaintenanceMode(Boolean(data.platform.maintenanceMode));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GAMES_CATALOG.filter((g) => {
      if (category !== 'ALL' && g.category !== category) return false;
      if (modeFilter === 'MULTI' && !g.multiplayer) return false;
      if (modeFilter === 'SINGLE' && !g.singlePlayer) return false;
      if (favoritesOnly && !favorites.includes(g.id)) return false;
      if (
        q &&
        !g.name.toLowerCase().includes(q) &&
        !g.description.toLowerCase().includes(q) &&
        !g.category.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [query, category, modeFilter, favoritesOnly, favorites]);

  const categories: Array<{ id: 'ALL' | GameCategory; label: string }> = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'INSTANT', label: 'Instant' },
    { id: 'CARDS', label: 'Cards' },
    { id: 'STRATEGY', label: 'Strategy' },
    { id: 'TABLE', label: 'Table & Bingo' },
    { id: 'ARCADE', label: 'Arcade' },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-[#8B5CF6]" /> All Games ({GAMES_CATALOG.length})
              </h1>
              <button
                type="button"
                onClick={() => setSelectedHelpGameId('tic-tac-toe')}
                className="px-2.5 py-1 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="View Rules & How to Play for all games"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>How to Play Guides</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#A8A3BC] mt-0.5">
              Search, filter by category or multiplayer mode, and bookmark your favorite games.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value) {
                  setSearchParams({ q: e.target.value }, { replace: true });
                } else {
                  setSearchParams({}, { replace: true });
                }
              }}
              placeholder="Search games..."
              aria-label="Filter games by name"
              className="w-full bg-[#0b101b] border border-slate-800 focus:border-violet-500 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Category + Mode + Favorites Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  category === c.id
                    ? 'bg-violet-600 text-white'
                    : 'bg-[#0b101b] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-[#0b101b] border border-slate-800 p-0.5 text-xs">
              {(
                [
                  { id: 'ALL', label: 'All' },
                  { id: 'SINGLE', label: 'Single-Player' },
                  { id: 'MULTI', label: 'Multiplayer' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModeFilter(m.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    modeFilter === m.id ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m.id === 'MULTI' && <Users className="w-3 h-3 inline mr-1" />}
                  {m.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setFavoritesOnly((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
                favoritesOnly
                  ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                  : 'bg-[#0b101b] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-current' : ''}`} /> Favorites ({favorites.length})
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => (
            <div key={idx} className="h-64 rounded-2xl bg-[#24213A] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-10 text-center space-y-2">
          <p className="text-sm font-bold text-white">No games matched your filters.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('ALL');
              setModeFilter('ALL');
              setFavoritesOnly(false);
              setSearchParams({}, { replace: true });
            }}
            className="text-xs font-bold text-[#22D3EE] hover:underline cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isDisabled={maintenanceMode || disabledGames.has(game.id)}
              isFavorite={favorites.includes(game.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Global How to Play Documentation Modal */}
      <HowToPlayModal
        isOpen={Boolean(selectedHelpGameId)}
        onClose={() => setSelectedHelpGameId(null)}
        defaultGameId={selectedHelpGameId || 'tic-tac-toe'}
      />
    </div>
  );
};
