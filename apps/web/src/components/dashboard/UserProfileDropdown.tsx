import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, History, LogOut, Settings, Shield, User, Wallet } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useI18nStore } from '../../stores/i18nStore';

export const UserProfileDropdown: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const t = useI18nStore((s) => s.t);
  const d = (t as any).dashboard || {};
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <Link
          to="/login"
          className="px-3 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-violet-500 text-white text-xs font-bold transition-colors"
        >
          {t.common.signIn}
        </Link>
        <Link
          to="/register"
          className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-[#24213A] hover:bg-[#2d2947] border border-white/10 text-white text-xs font-bold transition-colors"
        >
          {t.common.register}
        </Link>
      </div>
    );
  }

  const initials = (user?.username || 'NV').slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="User profile menu"
        className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl bg-[#24213A] hover:bg-[#2d2947] border border-white/10 transition-colors cursor-pointer"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#22D3EE] flex items-center justify-center text-white text-xs font-black shrink-0">
          {initials}
        </div>
        <span className="hidden lg:inline text-xs font-semibold text-white max-w-[100px] truncate">
          {user?.username || 'Player'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#A8A3BC] hidden sm:inline" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#24213A] border border-white/10 shadow-2xl py-2 z-50"
        >
          <div className="px-4 py-2 border-b border-white/[0.08]">
            <div className="text-xs font-bold text-white truncate">{user?.username || 'Player'}</div>
            <div className="text-[11px] text-[#A8A3BC] truncate">{user?.email || ''}</div>
          </div>

          <div className="py-1">
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-orange-300 hover:bg-white/[0.05]"
              >
                <Shield className="w-3.5 h-3.5" /> Admin Dashboard
              </Link>
            )}
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#A8A3BC] hover:bg-white/[0.05] hover:text-white"
            >
              <User className="w-3.5 h-3.5 text-[#22D3EE]" /> {d.profile || 'My Profile'}
            </Link>
            <Link
              to="/wallet"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#A8A3BC] hover:bg-white/[0.05] hover:text-white"
            >
              <Wallet className="w-3.5 h-3.5 text-[#22C55E]" /> Wallet
            </Link>
            <Link
              to="/history"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#A8A3BC] hover:bg-white/[0.05] hover:text-white"
            >
              <History className="w-3.5 h-3.5 text-[#8B5CF6]" /> {d.gameHistory || 'Game History'}
            </Link>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#A8A3BC] hover:bg-white/[0.05] hover:text-white"
            >
              <Settings className="w-3.5 h-3.5 text-[#A8A3BC]" /> {d.settings || 'Settings'}
            </Link>
          </div>

          <div className="pt-1 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
                navigate('/login');
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> {d.logout || 'Logout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
