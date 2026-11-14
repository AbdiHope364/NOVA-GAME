import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Gamepad2,
  Swords,
  Wallet,
  Gift,
  Users,
  History,
  Trophy,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Award,
  UserCheck,
  Download,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useI18nStore } from '../../stores/i18nStore';
import { usePwaStore } from '../../stores/pwaStore';

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  unreadNotifications?: number;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  collapsed,
  onToggleCollapse,
  unreadNotifications = 0,
}) => {
  const { isAuthenticated, logout } = useAuthStore();
  const { promptInstall } = usePwaStore();
  const t = useI18nStore((s) => s.t);
  const navigate = useNavigate();

  const d = (t as any).dashboard || {};

  const mainItems = [
    { to: '/', label: d.dashboard || 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/games', label: d.allGames || 'All Games', icon: Gamepad2 },
    { to: '/multiplayer', label: d.multiplayer || 'Multiplayer', icon: Swords, badge: '1v1' },
    { to: '/tournaments', label: 'Tournaments', icon: Award },
  ];

  const accountItems = [
    { to: '/wallet', label: d.myWallet || 'My Wallet', icon: Wallet },
    { to: '/bonuses', label: d.bonusesRewards || 'Bonuses & Rewards', icon: Gift },
    { to: '/referrals', label: d.referralProgram || 'Referral Program', icon: Users },
    { to: '/history', label: d.gameHistory || 'Game History', icon: History },
  ];

  const socialItems = [
    { to: '/leaderboard', label: d.leaderboard || 'Leaderboard', icon: Trophy },
    { to: '/friends', label: 'Friends', icon: UserCheck },
  ];

  const settingsItems = [
    {
      to: '/notifications',
      label: d.notifications || 'Notifications',
      icon: Bell,
      count: unreadNotifications,
    },
    { to: '/settings', label: d.settings || 'Settings', icon: Settings },
    { to: '/support', label: d.helpSupport || 'Help & Support', icon: HelpCircle },
  ];

  const renderGroup = (
    title: string,
    items: Array<{ to: string; label: string; icon: any; end?: boolean; badge?: string; count?: number }>
  ) => (
    <div className="space-y-1">
      {!collapsed && (
        <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#A8A3BC]/70">
          {title}
        </div>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center ${
                collapsed ? 'justify-center px-2' : 'justify-between px-3'
              } py-2 rounded-xl text-[13px] font-semibold transition-all ${
                isActive
                  ? 'bg-[#8B5CF6]/20 text-white border border-[#8B5CF6]/45 shadow-[0_0_16px_rgba(139,92,246,0.2)]'
                  : 'text-[#A8A3BC] hover:text-white hover:bg-[#24213A] border border-transparent'
              }`
            }
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className="w-4 h-4 shrink-0 text-current" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </div>
            {!collapsed && item.badge && (
              <span className="px-1.5 py-0.5 rounded-md bg-[#22D3EE]/15 text-[#22D3EE] text-[10px] font-bold">
                {item.badge}
              </span>
            )}
            {!collapsed && typeof item.count === 'number' && item.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#8B5CF6] text-white text-[10px] font-bold">
                {item.count > 99 ? '99+' : item.count}
              </span>
            )}
          </NavLink>
        );
      })}
    </div>
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      aria-label="Primary Sidebar Navigation"
      className={`hidden md:flex flex-col justify-between shrink-0 bg-[#1B1930] border-r border-white/[0.06] sticky top-0 h-screen transition-all duration-200 ${
        collapsed ? 'w-[76px] px-2.5 py-4' : 'w-[240px] px-3.5 py-4'
      }`}
    >
      <div className="space-y-4 overflow-y-auto no-scrollbar">
        {/* Brand Header (aligned to 72px height) + Collapse Button */}
        <div
          className={`flex items-center ${
            collapsed ? 'justify-center flex-col gap-2 py-1' : 'justify-between gap-2 min-h-[48px]'
          }`}
        >
          <NavLink to="/" className="flex items-center min-w-0" aria-label="NOVA GAMING Home">
            {collapsed ? (
              <img
                src="/images/nova-icon.png"
                alt="NOVA GAMING"
                className="w-10 h-10 rounded-xl object-contain shrink-0 drop-shadow-[0_0_12px_rgba(139,92,246,0.45)]"
              />
            ) : (
              <img
                src="/images/nova-logo.png"
                alt="NOVA GAMING"
                className="h-12 w-auto max-w-[162px] object-contain shrink-0 drop-shadow-[0_0_14px_rgba(139,92,246,0.35)]"
              />
            )}
          </NavLink>

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-7 h-7 rounded-lg bg-[#24213A] hover:bg-[#2f2b4a] border border-white/10 text-[#A8A3BC] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="space-y-4 pt-1">
          {renderGroup('MAIN', mainItems)}
          {renderGroup('MY ACCOUNT', accountItems)}
          {renderGroup('SOCIAL', socialItems)}
          {renderGroup('SETTINGS', settingsItems)}
        </nav>
      </div>

      {/* Constant Install App Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={promptInstall}
          title={collapsed ? "Install App" : undefined}
          className={`w-full flex items-center ${
            collapsed ? 'justify-center px-2' : 'justify-between px-3'
          } py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600/25 via-indigo-600/25 to-cyan-500/25 hover:from-violet-600/40 hover:to-indigo-600/40 border border-violet-500/35 text-violet-200 hover:text-white transition-all shadow-sm group active:scale-95`}
        >
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform shrink-0" />
            {!collapsed && <span>Install App</span>}
          </div>
          {!collapsed && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-black uppercase">
              PWA
            </span>
          )}
        </button>
      </div>

      {/* Footer Logout Action */}
      <div className="pt-3 border-t border-white/[0.06]">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? d.logout || 'Logout' : undefined}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center px-2' : 'gap-2.5 px-3'
            } py-2.5 rounded-xl text-[13px] font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{d.logout || 'Logout'}</span>}
          </button>
        ) : (
          <NavLink
            to="/login"
            className={`w-full flex items-center ${
              collapsed ? 'justify-center px-2' : 'justify-center gap-2 px-3'
            } py-2.5 rounded-xl text-xs font-bold bg-[#8B5CF6] hover:bg-violet-500 text-white transition-colors`}
          >
            <span>{collapsed ? 'In' : t.common.signIn}</span>
          </NavLink>
        )}
      </div>
    </aside>
  );
};
