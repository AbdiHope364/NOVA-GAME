import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Wallet } from 'lucide-react';
import { GAMES_CATALOG } from '../../config/games';
import { useWalletStore } from '../../stores/walletStore';
import { useI18nStore } from '../../stores/i18nStore';
import { LanguageSelector } from '../layout/LanguageSelector';
import { NotificationDropdown } from './NotificationDropdown';
import { UserProfileDropdown } from './UserProfileDropdown';

interface DashboardHeaderProps {
  unreadNotifications: number;
  onUnreadCountChange: (count: number) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  unreadNotifications,
  onUnreadCountChange,
}) => {
  const { cashBalance, bonusBalance, balance, fetchWallet } = useWalletStore();
  const t = useI18nStore((s) => s.t);
  const d = (t as any).dashboard || {};
  const navigate = useNavigate();

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return GAMES_CATALOG.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (searchResults.length === 1) {
      navigate(searchResults[0].path);
      setQuery('');
      setSearchFocused(false);
    } else if (q) {
      navigate(`/games?q=${encodeURIComponent(q)}`);
      setSearchFocused(false);
    }
  };

  const displayBalance = balance;

  return (
    <header className="sticky top-0 z-30 h-[72px] bg-[#1B1930]/95 border-b border-white/[0.06] backdrop-blur-xl px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-2 sm:gap-4 w-full shrink-0">
      {/* Mobile Brand + Search Games */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Link to="/" className="md:hidden flex items-center shrink-0" aria-label="NOVA GAMING Home">
          <img
            src="/images/nova-logo.png"
            alt="NOVA GAMING"
            className="h-10 w-auto max-w-[110px] object-contain drop-shadow-[0_0_10px_rgba(139,92,246,0.35)]"
          />
        </Link>

        {/* Search Games Input */}
        <div ref={searchWrapRef} className="relative hidden sm:block flex-1 max-w-md">
          <form onSubmit={handleSearchSubmit}>
            <Search className="w-4 h-4 text-[#A8A3BC] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={d.searchGames || 'Search games...'}
              aria-label="Search games"
              className="w-full bg-[#11101D] border border-white/10 focus:border-[#8B5CF6] rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-white placeholder:text-[#A8A3BC]/70 focus:outline-none transition-colors"
            />
          </form>

          {searchFocused && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 rounded-2xl bg-[#24213A] border border-white/10 shadow-2xl overflow-hidden z-50">
              {searchResults.map((g) => (
                <Link
                  key={g.id}
                  to={g.path}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    navigate(g.path);
                    setQuery('');
                    setSearchFocused(false);
                  }}
                  className="flex items-center justify-between px-3.5 py-2.5 hover:bg-white/5 transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{g.name}</div>
                    <div className="text-[11px] text-[#A8A3BC]">{g.category}</div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#22D3EE]">{g.payout}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <Link
          to="/games"
          aria-label="Search games"
          className="sm:hidden w-9 h-9 rounded-xl bg-[#24213A] hover:bg-[#2d2947] border border-white/10 text-[#A8A3BC] hover:text-white flex items-center justify-center transition-colors shrink-0"
        >
          <Search className="w-4 h-4" />
        </Link>

        <div className="hidden lg:block">
          <LanguageSelector />
        </div>

        <NotificationDropdown
          unreadCount={unreadNotifications}
          onUnreadCountChange={onUnreadCountChange}
        />

        {/* Wallet Balance + Deposit CTA */}
        <div className="flex items-center bg-[#24213A] border border-white/10 rounded-xl p-1 pl-3 gap-2.5 shadow-sm">
          <Link
            to="/wallet"
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-white"
            title={`Cash: ${cashBalance.toFixed(0)} ETB | Bonus: ${bonusBalance.toFixed(0)} ETB`}
          >
            <Wallet className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
            <span>{displayBalance.toLocaleString()}</span>
            <span className="text-[10px] text-[#A8A3BC]">ETB</span>
          </Link>

          <Link
            to="/wallet"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-violet-500 text-white text-xs font-bold transition-colors shadow-[0_0_16px_rgba(139,92,246,0.35)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{d.deposit || 'Deposit'}</span>
          </Link>
        </div>

        <UserProfileDropdown />
      </div>
    </header>
  );
};
