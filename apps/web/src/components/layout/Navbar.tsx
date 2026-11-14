import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@nova/ui';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';
import { useI18nStore } from '../../stores/i18nStore';
import { LanguageSelector } from './LanguageSelector';
import { Wallet, ShieldCheck, Plus, Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { balance, fetchWallet } = useWalletStore();
  const t = useI18nStore((s) => s.t);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-xl px-2.5 sm:px-6 py-2 flex items-center justify-between shadow-lg w-full">
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <Link 
          to="/" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-1.5 font-black text-sm sm:text-lg tracking-tight text-white shrink-0"
          aria-label="NOVA GAMING Home"
        >
          <img
            src="/images/nova-logo.png"
            alt="NOVA GAMING"
            className="h-9 sm:h-10 w-auto object-contain drop-shadow-[0_0_10px_rgba(139,92,246,0.35)]"
          />
        </Link>
        <Badge variant="info" className="hidden lg:inline-flex gap-1 items-center">
          <ShieldCheck className="w-3 h-3" /> {t.common.provablyFair}
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Language Selector */}
        <LanguageSelector />

        {/* Wallet Balance Display with Quick Deposit */}
        <Link 
          to="/wallet"
          className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800/90 rounded-xl px-2 sm:px-3 py-1 shadow-inner transition-colors group shrink-0"
          title="Go to Wallet"
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="flex flex-col text-right">
            <span className="text-xs sm:text-sm font-mono font-black text-emerald-400 leading-tight">
              {balance.toLocaleString()} <span className="text-[9px] sm:text-xs">ETB</span>
            </span>
            <span className="text-[7.5px] sm:text-[9px] text-slate-500 font-bold uppercase hidden sm:inline leading-none">{t.common.platformWallet}</span>
          </div>
          <span className="bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 rounded-lg p-0.5 ml-0.5 transition-colors">
            <Plus className="w-3 h-3 font-bold" />
          </span>
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-800/80 pl-1.5 sm:pl-2 shrink-0">
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] font-black uppercase tracking-wider hover:bg-amber-500 hover:text-slate-950 transition-colors"
                title="Admin Dashboard"
              >
                <Shield className="w-3 h-3" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            <Link 
              to="/settings" 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 flex items-center justify-center text-xs font-black text-cyan-300 transition-colors"
              title="Account Settings"
            >
              {user?.username ? user.username.substring(0, 2).toUpperCase() : 'NV'}
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link to="/login">
              <Button variant="primary" size="sm" className="px-2.5 py-1 text-xs h-7.5 sm:h-8 font-black tracking-tight">{t.common.signIn}</Button>
            </Link>
            <Link to="/register" className="hidden sm:inline-flex">
              <Button variant="accent" size="sm" className="px-2.5 py-1 text-xs h-7.5 sm:h-8 font-black tracking-tight">{t.common.register}</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
