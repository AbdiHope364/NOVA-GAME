import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Search,
  Wallet,
  Plus,
  Gift,
  Flame,
  Rocket,
  Gamepad2,
  Swords,
  Trophy,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Dices,
  Crown,
  Award,
  HelpCircle,
  ArrowRight,
  User,
  LogIn,
  LogOut,
  Users,
  History,
  Settings,
  CircleDot,
  Grid,
  Coins,
  Download,
  Smartphone,
} from 'lucide-react';
import { GAMES_CATALOG } from '../../config/games';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';
import { useI18nStore } from '../../stores/i18nStore';
import { usePwaStore } from '../../stores/pwaStore';
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
  const { isAuthenticated, user, logout } = useAuthStore();
  const { promptInstall } = usePwaStore();
  const { cashBalance, bonusBalance, balance, fetchWallet } = useWalletStore();
  const t = useI18nStore((s) => s.t);
  const d = (t as any).dashboard || {};
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Search state
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  // Close overlays on route change
  useEffect(() => {
    setMobileSearchOpen(false);
    setMobileDrawerOpen(false);
    setSearchFocused(false);
  }, [location.pathname]);

  // Focus mobile search input when overlay opens
  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 120);
    }
  }, [mobileSearchOpen]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSearchOpen(false);
        setMobileDrawerOpen(false);
        setSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      setMobileSearchOpen(false);
    } else if (q) {
      navigate(`/games?q=${encodeURIComponent(q)}`);
      setSearchFocused(false);
      setMobileSearchOpen(false);
    }
  };

  const handleQuickTagClick = (tag: string, path?: string) => {
    if (path) {
      navigate(path);
      setMobileSearchOpen(false);
      setQuery('');
    } else {
      setQuery(tag);
    }
  };

  const displayBalance = balance;

  // Horizontal Quick Navigation Chips for mobile
  const quickNavChips = [
    { to: '/', label: 'Lobby', icon: Flame, isExact: true },
    { to: '#install', label: 'Install App', icon: Smartphone, onClick: promptInstall, badge: 'PWA', badgeColor: 'bg-emerald-500 text-slate-950 font-black' },
    { to: '/games', label: 'All Games', icon: Gamepad2, isExact: true },
    { to: '/games/crash', label: 'Crash', icon: Rocket, badge: 'HOT', badgeColor: 'bg-rose-500/90 text-white' },
    { to: '/games/plinko', label: 'Plinko', icon: Layers },
    { to: '/multiplayer', label: '1v1 Arena', icon: Swords, badge: 'PVP', badgeColor: 'bg-cyan-500/90 text-slate-950 font-black' },
    { to: '/games/dama', label: 'Dama', icon: Crown },
    { to: '/games/ludo', label: 'Ludo', icon: Dices },
    { to: '/games/bingo', label: 'Bingo', icon: Trophy },
    { to: '/tournaments', label: 'Tournaments', icon: Award },
    { to: '/bonuses', label: '1,000 ETB Bonus', icon: Gift, badge: 'FREE', badgeColor: 'bg-amber-400 text-slate-950 font-black' },
    { to: '/leaderboard', label: 'Rankings', icon: Trophy },
  ];

  const popularQuickSearches = [
    { label: 'Crash Aviator', path: '/games/crash' },
    { label: 'Plinko', path: '/games/plinko' },
    { label: 'Ethiopian Dama', path: '/games/dama' },
    { label: 'Ludo 3D', path: '/games/ludo' },
    { label: '75-Ball Bingo', path: '/games/bingo' },
    { label: 'Dice', path: '/games/dice' },
    { label: 'Mines', path: '/games/mines' },
    { label: 'Roulette', path: '/games/roulette' },
    { label: 'Chess', path: '/games/chess' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#161426]/95 border-b border-white/[0.08] backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.35)] w-full shrink-0">
        {/* Main Header Top Row */}
        <div className="h-14 sm:h-[68px] px-2 sm:px-4 lg:px-6 flex items-center justify-between gap-1.5 sm:gap-4 w-full">
          {/* Left: Mobile Drawer Trigger + Brand Logo + Desktop Search */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 sm:flex-1 sm:min-w-0">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 border border-white/[0.08] text-violet-400 hover:text-white flex items-center justify-center transition-all shrink-0"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* NOVA Brand Logo with Glow */}
            <Link 
              to="/" 
              className="flex items-center shrink-0 group focus:outline-none" 
              aria-label="NOVA GAMING Home"
            >
              <img
                src="/images/nova-logo.png"
                alt="NOVA GAMING"
                className="h-7 sm:h-9 md:h-10 w-auto max-w-[80px] sm:max-w-[110px] object-contain drop-shadow-[0_0_12px_rgba(139,92,246,0.4)] group-hover:scale-105 transition-transform"
              />
            </Link>

            {/* Desktop / Tablet Search Bar */}
            <div ref={searchWrapRef} className="relative hidden sm:block flex-1 max-w-md ml-1 sm:ml-2">
              <form onSubmit={handleSearchSubmit}>
                <Search className="w-4 h-4 text-[#A8A3BC] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={query}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 160)}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={d.searchGames || 'Search games (Crash, Ludo, Dama...)'}
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

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
            {/* Constant Install App Button (Desktop & Tablet) */}
            <button
              type="button"
              onClick={promptInstall}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600/30 to-indigo-600/30 hover:from-violet-600/50 hover:to-indigo-600/50 active:scale-95 border border-violet-400/40 text-violet-200 hover:text-white text-xs font-bold transition-all shadow-sm group shrink-0"
              title="Install NOVA Gaming App"
              aria-label="Install NOVA Gaming App"
            >
              <Download className="w-3.5 h-3.5 text-violet-400 group-hover:scale-110 transition-transform shrink-0" />
              <span>Install App</span>
              <span className="text-[9px] px-1 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 font-black uppercase">
                PWA
              </span>
            </button>

            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Search games"
              className="sm:hidden w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-95 border border-white/[0.08] text-slate-300 hover:text-white flex items-center justify-center transition-all shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Language Selector (Tablet & Desktop) */}
            <div className="hidden sm:block shrink-0">
              <LanguageSelector />
            </div>

            {/* Notifications Dropdown (Tablet & Desktop) */}
            <div className="hidden sm:block shrink-0">
              <NotificationDropdown
                unreadCount={unreadNotifications}
                onUnreadCountChange={onUnreadCountChange}
              />
            </div>

            {/* Authenticated Wallet & Profile OR Unauthenticated Bonus & Sign In */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* 1,000 ETB Bonus Offer */}
                <Link
                  to="/register"
                  className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-[#8B5CF6]/25 to-[#22D3EE]/25 border border-amber-400/40 text-amber-300 hover:text-white hover:border-amber-300 text-[11px] sm:text-xs font-black transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)] shrink-0 active:scale-95"
                  title="Register to claim 1,000 ETB Welcome Bonus"
                >
                  <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 animate-bounce shrink-0" />
                  <span className="whitespace-nowrap">1,000 ETB<span className="hidden sm:inline"> Bonus</span></span>
                </Link>

                {/* Direct Sign In Button */}
                <Link
                  to="/login"
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-violet-500 text-white text-[11px] sm:text-xs font-bold transition-colors shadow-sm shrink-0"
                >
                  {t.common.signIn}
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* Wallet Balance Display with Quick Deposit */}
                <div className="flex items-center bg-[#221F38] border border-white/10 rounded-xl p-0.5 sm:p-1 pl-2 sm:pl-3 gap-1 sm:gap-2 shadow-inner">
                  <Link
                    to="/wallet"
                    className="flex items-center gap-1 text-xs font-mono font-bold text-white hover:text-emerald-300 transition-colors"
                    title={`Cash: ${cashBalance.toFixed(0)} ETB | Bonus: ${bonusBalance.toFixed(0)} ETB`}
                  >
                    <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#22C55E] shrink-0" />
                    <span className="text-[11px] sm:text-xs font-black">{displayBalance.toLocaleString()}</span>
                    <span className="text-[9px] text-[#A8A3BC] font-semibold">ETB</span>
                  </Link>

                  <Link
                    to="/wallet"
                    aria-label="Quick Deposit"
                    className="inline-flex items-center gap-1 px-1.5 py-1 sm:px-2.5 sm:py-1 rounded-lg bg-[#8B5CF6] hover:bg-violet-500 text-white text-[11px] font-bold transition-colors shadow-[0_0_12px_rgba(139,92,246,0.35)] active:scale-95"
                  >
                    <Plus className="w-3 h-3 font-black" />
                    <span className="hidden sm:inline">{d.deposit || 'Deposit'}</span>
                  </Link>
                </div>

                {/* Profile Dropdown */}
                <UserProfileDropdown />
              </div>
            )}
          </div>
        </div>

        {/* Mobile Horizontal Quick-Navigation Bar (Sticky underneath top row) */}
        <nav 
          aria-label="Mobile Quick Navigation"
          className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 overflow-x-auto no-scrollbar border-t border-white/[0.05] bg-[#11101D]/90 backdrop-blur-md"
        >
          {quickNavChips.map((chip) => {
            const Icon = chip.icon;

            if ((chip as any).onClick) {
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={(chip as any).onClick}
                  className="relative flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs whitespace-nowrap transition-all shrink-0 active:scale-95 bg-gradient-to-r from-violet-600/30 to-indigo-600/30 hover:from-violet-600/50 hover:to-indigo-600/50 border border-violet-400/40 text-violet-200 hover:text-white font-bold cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 text-violet-400" />
                  <span>{chip.label}</span>
                  {chip.badge && (
                    <span className={`text-[9px] px-1 py-0.2 rounded-full font-black uppercase tracking-tight leading-none ${chip.badgeColor || 'bg-violet-500 text-white'}`}>
                      {chip.badge}
                    </span>
                  )}
                </button>
              );
            }

            const isActive = chip.isExact
              ? location.pathname === chip.to
              : location.pathname.startsWith(chip.to);

            return (
              <Link
                key={chip.to}
                to={chip.to}
                className={`relative flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black shadow-[0_0_12px_rgba(139,92,246,0.45)] border border-violet-400/40'
                    : 'bg-[#1D1B30]/90 text-slate-300 hover:text-white border border-white/[0.06] hover:border-white/20 font-semibold'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-violet-400'}`} />
                <span>{chip.label}</span>
                {chip.badge && (
                  <span className={`text-[9px] px-1 py-0.2 rounded-full font-black uppercase tracking-tight leading-none ${chip.badgeColor || 'bg-violet-500 text-white'}`}>
                    {chip.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Mobile Interactive Search Overlay Modal */}
      {mobileSearchOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-start md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileSearchOpen(false)}
        >
          <div 
            className="bg-[#1B1930] border-b border-white/10 p-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-4 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-top-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Row */}
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="w-4 h-4 text-violet-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={mobileSearchInputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search 13+ games (Crash, Ludo, Dama...)"
                  className="w-full bg-[#11101D] border border-white/15 focus:border-violet-500 rounded-xl pl-9 pr-8 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none transition-colors shadow-inner"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>

              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Popular Quick Searches Tags */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Trending Games</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularQuickSearches.map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => handleQuickTagClick(tag.label, tag.path)}
                    className="px-2.5 py-1 rounded-lg bg-[#24213A] hover:bg-violet-600/30 text-xs text-slate-200 border border-white/10 hover:border-violet-500/40 transition-colors font-medium active:scale-95"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Search Results */}
            {query.trim() && (
              <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pt-1 border-t border-white/10">
                {searchResults.length > 0 ? (
                  searchResults.map((game) => (
                    <Link
                      key={game.id}
                      to={game.path}
                      onClick={() => setMobileSearchOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#24213A]/70 hover:bg-violet-600/20 border border-white/5 hover:border-violet-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-sm"
                          style={{ backgroundColor: `${game.accentHex}33`, borderColor: game.accentHex, borderWidth: '1px' }}
                        >
                          {game.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{game.name}</div>
                          <div className="text-[10px] text-slate-400">{game.category} • {game.payout}</div>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-violet-300">
                        Play <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No games found matching "{query}". Try checking "Crash", "Ludo", or "Bingo".
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Full Slide-Out Navigation Drawer */}
      {mobileDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-start md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileDrawerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Drawer"
        >
          <div 
            className="w-[85vw] max-w-[340px] h-full bg-[#161426] border-r border-white/10 shadow-2xl flex flex-col pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-safe animate-in slide-in-from-left duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-4 pb-3 border-b border-white/10 flex items-center justify-between">
              <Link to="/" onClick={() => setMobileDrawerOpen(false)} className="flex items-center gap-2">
                <img
                  src="/images/nova-logo.png"
                  alt="NOVA GAMING"
                  className="h-8 w-auto object-contain drop-shadow-[0_0_10px_rgba(139,92,246,0.35)]"
                />
              </Link>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close navigation drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body Scroll Area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
              {/* Unauthenticated Welcome Offer Banner */}
              {!isAuthenticated ? (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-violet-600/20 to-cyan-500/20 border border-amber-400/40 text-center space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-center gap-1.5 text-amber-300 font-black text-xs tracking-wide uppercase">
                    <Gift className="w-4 h-4 text-amber-400 animate-bounce" />
                    <span>Welcome Bonus Offer</span>
                  </div>
                  <div className="text-lg font-black text-white leading-tight">
                    Get 1,000 ETB Bonus
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Register a free account now and get 1,000 ETB welcome bonus to start playing!
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    <Link
                      to="/register"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs text-center shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all active:scale-95"
                    >
                      Claim 1,000 ETB Bonus
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="w-full py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-bold text-xs text-center border border-white/10 transition-colors"
                    >
                      {t.common.signIn}
                    </Link>
                  </div>
                </div>
              ) : (
                /* Authenticated User Status Box */
                <div className="p-3.5 rounded-2xl bg-[#1E1B33] border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white font-black text-sm flex items-center justify-center shadow-md">
                        {(user?.username || 'NV').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1">
                          {user?.username || 'Player'}
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{user?.role || 'VIP MEMBER'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#11101D] border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Total Wallet</div>
                      <div className="text-sm font-mono font-black text-emerald-400">{balance.toLocaleString()} ETB</div>
                    </div>
                    <Link
                      to="/wallet"
                      onClick={() => setMobileDrawerOpen(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-sm active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Deposit</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Constant Mobile Drawer Install App Card */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-cyan-500/20 border border-violet-500/40 flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-600/40 border border-violet-400/40 flex items-center justify-center text-violet-300 shrink-0">
                    <Smartphone className="w-5 h-5 text-violet-300" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Install NOVA App</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/25 text-emerald-300 font-extrabold uppercase">FREE</span>
                    </div>
                    <div className="text-[10px] text-slate-300">Fast 1-tap play from your home screen</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    promptInstall();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs shrink-0 shadow-md active:scale-95 cursor-pointer"
                >
                  Install
                </button>
              </div>

              {/* Main Navigation Sections */}
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1">
                  Main Navigation
                </div>
                <Link
                  to="/"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    location.pathname === '/' ? 'bg-violet-600 text-white' : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Lobby / Home</span>
                </Link>
                <Link
                  to="/games"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    location.pathname === '/games' ? 'bg-violet-600 text-white' : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4 text-violet-400" />
                  <span>All Games Catalog</span>
                </Link>
                <Link
                  to="/multiplayer"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    location.pathname === '/multiplayer' ? 'bg-violet-600 text-white' : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Swords className="w-4 h-4 text-cyan-400" />
                    <span>1v1 Multiplayer</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">LIVE</span>
                </Link>
                <Link
                  to="/tournaments"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    location.pathname === '/tournaments' ? 'bg-violet-600 text-white' : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Tournaments</span>
                </Link>
              </div>

              {/* Popular Games Quick Launch */}
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1">
                  Popular Games
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Link
                    to="/games/crash"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 flex items-center gap-2 text-xs font-bold text-slate-200"
                  >
                    <Rocket className="w-3.5 h-3.5 text-rose-400" />
                    <span>Crash</span>
                  </Link>
                  <Link
                    to="/games/plinko"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 flex items-center gap-2 text-xs font-bold text-slate-200"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Plinko</span>
                  </Link>
                  <Link
                    to="/games/dama"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 flex items-center gap-2 text-xs font-bold text-slate-200"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dama</span>
                  </Link>
                  <Link
                    to="/games/ludo"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 flex items-center gap-2 text-xs font-bold text-slate-200"
                  >
                    <Dices className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ludo 3D</span>
                  </Link>
                  <Link
                    to="/games/bingo"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/30 flex items-center gap-2 text-xs font-bold text-slate-200"
                  >
                    <Trophy className="w-3.5 h-3.5 text-orange-400" />
                    <span>Bingo 75</span>
                  </Link>
                  <Link
                    to="/games/mines"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 flex items-center gap-2 text-xs font-bold text-slate-200"
                  >
                    <Grid className="w-3.5 h-3.5 text-purple-400" />
                    <span>Mines</span>
                  </Link>
                </div>
              </div>

              {/* Rewards & Community */}
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1">
                  Rewards & Community
                </div>
                <Link
                  to="/bonuses"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span>1,000 ETB Bonus & Rewards</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">PROMO</span>
                </Link>
                <Link
                  to="/leaderboard"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5"
                >
                  <Trophy className="w-4 h-4 text-orange-400" />
                  <span>Leaderboard</span>
                </Link>
                <Link
                  to="/referrals"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5"
                >
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Refer & Earn ETB</span>
                </Link>
                <Link
                  to="/support"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5"
                >
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span>Help & Support</span>
                </Link>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-white/10 space-y-2 bg-[#11101D]/80">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileDrawerOpen(false);
                    navigate('/');
                  }}
                  className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-bold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold text-center transition-colors shadow-md"
                  >
                    {t.common.signIn}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black text-center transition-all shadow-md"
                  >
                    {t.common.register}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
