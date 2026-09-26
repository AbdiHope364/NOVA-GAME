import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@nova/ui';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';
import { useI18nStore } from '../../stores/i18nStore';
import { LanguageSelector } from './LanguageSelector';
import { Wallet, LogOut, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { balance } = useWalletStore();
  const t = useI18nStore((s) => s.t);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-xl px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-white">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            N
          </span>
          NOVA<span className="text-amber-400">GAMING</span>
        </Link>
        <Badge variant="info" className="hidden sm:inline-flex gap-1 items-center">
          <ShieldCheck className="w-3 h-3" /> {t.common.provablyFair}
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <LanguageSelector />

        {/* Wallet Balance Display */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-1.5 shadow-inner">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col text-right">
            <span className="text-xs font-mono font-extrabold text-emerald-400">
              {balance.toFixed(0)} ETB
            </span>
            <span className="text-[9px] text-slate-500 font-bold uppercase">{t.common.platformWallet}</span>
          </div>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
            <span className="text-xs font-bold text-slate-300 hidden md:inline">{user?.username}</span>
            <Button variant="secondary" size="sm" onClick={logout} className="p-2">
              <LogOut className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="secondary" size="sm">{t.common.signIn}</Button>
            </Link>
            <Link to="/register">
              <Button variant="accent" size="sm">{t.common.register}</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
