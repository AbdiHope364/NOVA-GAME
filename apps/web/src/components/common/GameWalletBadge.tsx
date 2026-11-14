import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Plus } from 'lucide-react';
import { useWalletStore } from '../../stores/walletStore';

export interface GameWalletBadgeProps {
  className?: string;
  showDeposit?: boolean;
}

export const GameWalletBadge: React.FC<GameWalletBadgeProps> = ({
  className = '',
  showDeposit = true,
}) => {
  const { balance, currency, fetchWallet } = useWalletStore();

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return (
    <div className={`flex items-center gap-1.5 select-none ${className}`}>
      <Link
        to="/wallet"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 shadow-md transition-all text-xs font-mono font-black text-emerald-400 hover:text-emerald-300"
        title="View Wallet Balance"
      >
        <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>
          {balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {currency || 'ETB'}
        </span>
      </Link>

      {showDeposit && (
        <Link
          to="/wallet?tab=deposit"
          className="w-7 h-7 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-90 transition-all cursor-pointer"
          title="Deposit funds"
          aria-label="Deposit funds"
        >
          <Plus className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
};
