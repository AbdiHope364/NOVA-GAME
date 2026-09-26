import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from '@nova/ui';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';
import { Wallet, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { balance, currency } = useWalletStore();

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-xl px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-white">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20">
            N
          </span>
          NOVA<span className="text-cyan-400">GAMING</span>
        </Link>
        <Badge variant="info" className="hidden sm:inline-flex gap-1 items-center">
          <ShieldCheck className="w-3 h-3" /> Plug-in Architecture
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <Link to="/wallet" className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-1.5 hover:border-cyan-500/50 transition-colors">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col text-right">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  ${balance.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">{currency}</span>
              </div>
            </Link>

            <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xs font-bold">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-semibold text-slate-200 hidden md:inline">{user?.username}</span>
              </div>
              <Button variant="secondary" size="sm" onClick={logout} className="p-2">
                <LogOut className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="secondary" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">Register</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
