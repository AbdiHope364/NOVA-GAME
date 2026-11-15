import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Gamepad2,
  Wallet,
  User,
  Menu,
  X,
  Swords,
  ArrowLeftRight,
  Gift,
  Users,
  History,
  Trophy,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Award,
  UserCheck,
  Download,
  Smartphone,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useI18nStore } from '../../stores/i18nStore';
import { usePwaStore } from '../../stores/pwaStore';

interface MobileBottomNavigationProps {
  unreadNotifications?: number;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  unreadNotifications = 0,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();
  const { promptInstall } = usePwaStore();
  const t = useI18nStore((s) => s.t);
  const d = (t as any).dashboard || {};

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (moreOpen && drawerRef.current) {
      drawerRef.current.scrollTop = 0;
    }
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [moreOpen]);

  const primaryTabs = [
    { to: '/', label: d.dashboard || 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/games', label: 'Games', icon: Gamepad2 },
    { to: '/wallet', label: 'Wallet', icon: Wallet },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const moreLinks = [
    { to: '/multiplayer', label: d.multiplayer || 'Multiplayer', icon: Swords, color: 'text-[#22D3EE]' },
    { to: '/tournaments', label: 'Tournaments', icon: Award, color: 'text-[#8B5CF6]' },
    { to: '/friends', label: 'Friends', icon: UserCheck, color: 'text-[#22C55E]' },
    { to: '/missions', label: 'Daily & Badges', icon: Trophy, color: 'text-amber-400' },
    { to: '/transactions', label: d.transactions || 'Transactions', icon: ArrowLeftRight, color: 'text-[#22C55E]' },
    { to: '/bonuses', label: d.bonusesRewards || 'Bonuses & Rewards', icon: Gift, color: 'text-[#8B5CF6]' },
    { to: '/referrals', label: d.referralProgram || 'Referral Program', icon: Users, color: 'text-[#22D3EE]' },
    { to: '/history', label: d.gameHistory || 'Game History', icon: History, color: 'text-[#A8A3BC]' },
    { to: '/leaderboard', label: d.leaderboard || 'Leaderboard', icon: Trophy, color: 'text-orange-400' },
    {
      to: '/notifications',
      label: d.notifications || 'Notifications',
      icon: Bell,
      color: 'text-[#8B5CF6]',
      badge: unreadNotifications,
    },
    { to: '/settings', label: d.settings || 'Settings', icon: Settings, color: 'text-[#A8A3BC]' },
    { to: '/support', label: d.helpSupport || 'Help & Support', icon: HelpCircle, color: 'text-[#22D3EE]' },
  ];

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col justify-start md:hidden animate-in fade-in duration-200"
          onClick={() => setMoreOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="More Navigation Options"
        >
          <div
            ref={drawerRef}
            className="bg-[#1B1930] border-b border-cyan-500/30 rounded-b-3xl p-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-6 space-y-4 max-h-[88vh] overflow-y-auto shadow-2xl ring-1 ring-cyan-500/20 animate-in slide-in-from-top-6 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <img
                  src="/images/nova-logo.png"
                  alt="NOVA GAMING"
                  className="h-9 w-auto object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close more menu"
                className="w-8 h-8 rounded-full bg-[#24213A] text-white flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Constant Install App Action in More Menu */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-violet-600/25 via-indigo-600/25 to-cyan-500/25 border border-violet-500/40 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-violet-600/40 border border-violet-400/40 flex items-center justify-center text-violet-300 shrink-0">
                  <Download className="w-5 h-5 text-violet-300 animate-bounce" />
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Install NOVA App</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 font-extrabold uppercase">
                      PWA
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">Fast 1-tap play from your home screen</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  promptInstall();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs shrink-0 shadow-md active:scale-95 cursor-pointer"
              >
                Install
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      setMoreOpen(false);
                      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#24213A] border border-white/[0.06] hover:border-[#8B5CF6]/50 active:scale-95 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                      <span className="text-xs font-semibold text-white truncate">
                        {item.label}
                      </span>
                    </div>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#8B5CF6] text-white text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full py-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> {d.logout || 'Logout'}
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => {
                  setMoreOpen(false);
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }}
                className="w-full py-3 rounded-xl bg-[#8B5CF6] text-white text-xs font-bold flex items-center justify-center"
              >
                {t.common.signIn}
              </Link>
            )}
          </div>
        </div>
      )}

      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#1B1930]/95 border-t border-white/[0.08] backdrop-blur-xl md:hidden px-1 pt-1.5 pb-safe flex items-center justify-around shadow-2xl"
      >
        {primaryTabs.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl min-w-[56px] min-h-[46px] transition-colors ${
                  isActive ? 'text-[#8B5CF6]' : 'text-[#A8A3BC] hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold leading-none">{item.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          className={`relative flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl min-w-[56px] min-h-[46px] transition-colors ${
            moreOpen ? 'text-[#22D3EE]' : 'text-[#A8A3BC] hover:text-white'
          }`}
        >
          <div className="relative">
            <Menu className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#8B5CF6]" />
            )}
          </div>
          <span className="text-[10px] font-semibold leading-none">{d.more || 'More'}</span>
        </button>
      </nav>
    </>
  );
};
