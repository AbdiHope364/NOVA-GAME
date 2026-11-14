import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Gift, Lock, ShieldCheck, Wallet } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';
import { useI18nStore } from '../../stores/i18nStore';

interface WalletOverviewProps {
  loading?: boolean;
}

export const WalletOverview: React.FC<WalletOverviewProps> = ({ loading = false }) => {
  const { isAuthenticated } = useAuthStore();
  const { balance, cashBalance, bonusBalance, withdrawableBalance, lockedWinnings, currency } =
    useWalletStore();
  const t = useI18nStore((s) => s.t);
  const d = (t as any).dashboard || {};

  if (loading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4" aria-label="Wallet Overview Loading">
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="h-32 rounded-2xl bg-[#24213A] animate-pulse" />
        ))}
      </section>
    );
  }

  return (
    <section className="space-y-3" aria-label="Wallet Overview">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-bold text-white">Wallet Overview</h2>
        <div className="flex flex-wrap items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-[#8B5CF6]/20 border border-amber-500/40 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <Gift className="w-3.5 h-3.5 text-amber-400" /> Claim 1,000 ETB Bonus
              </Link>
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl bg-[#24213A] hover:bg-[#2f2b4a] border border-white/[0.07] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                {t.common.signIn}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/wallet?tab=deposit"
                className="px-3 py-1.5 rounded-xl bg-[#22C55E]/15 hover:bg-[#22C55E]/25 text-[#22C55E] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" /> {d.deposit || 'Deposit'}
              </Link>
              <Link
                to="/wallet?tab=withdraw"
                className="px-3 py-1.5 rounded-xl bg-[#24213A] hover:bg-[#2f2b4a] border border-white/[0.07] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-[#22D3EE]" /> {d.withdraw || 'Withdraw'}
              </Link>
              <Link
                to="/transactions"
                className="px-3 py-1.5 rounded-xl bg-[#24213A] hover:bg-[#2f2b4a] border border-white/[0.07] text-[#A8A3BC] hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#8B5CF6]" /> {d.transactionHistory || 'Transactions'}
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#A8A3BC] uppercase tracking-wider">
              {d.availableBalance || 'Total Playable Balance'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#22D3EE]/15 text-[#22D3EE] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-white">
              {(isAuthenticated ? balance : 0).toLocaleString()}{' '}
              <span className="text-sm text-[#22D3EE]">{currency}</span>
            </div>
            <p className="text-[11px] text-[#A8A3BC] mt-1">
              {isAuthenticated
                ? `Cash: ${cashBalance.toLocaleString()} ${currency}${
                    bonusBalance > 0 ? ` · Bonus: +${bonusBalance.toLocaleString()} ${currency}` : ''
                  }`
                : 'Sign up or log in to deposit & play for real winnings.'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#24213A] border border-[#8B5CF6]/30 p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider">
              {isAuthenticated ? d.bonusBalance || 'Bonus Balance' : 'Welcome Bonus Offer'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-white">
              {(isAuthenticated ? bonusBalance : 1000).toLocaleString()}{' '}
              <span className="text-sm text-[#8B5CF6]">{currency}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-orange-300 font-medium mt-1">
              {isAuthenticated ? (
                <>
                  <Lock className="w-3 h-3 shrink-0" />
                  <span>{d.nonWithdrawable || 'Promotional credit · Non-withdrawable'}</span>
                </>
              ) : (
                <>
                  <Gift className="w-3 h-3 shrink-0 text-amber-400" />
                  <span className="text-amber-300">Get 1,000 ETB bonus credits after registration</span>
                </>
              )}
            </div>
            {isAuthenticated && lockedWinnings > 0 && (
              <p className="text-[11px] text-[#A8A3BC] mt-1">
                Locked promo winnings: {lockedWinnings.toLocaleString()} {currency}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-[#24213A] border border-[#22C55E]/25 p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#22C55E] uppercase tracking-wider">
              {d.withdrawableBalance || 'Withdrawable Balance'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-mono font-black text-white">
              {(isAuthenticated ? withdrawableBalance : 0).toLocaleString()}{' '}
              <span className="text-sm text-[#22C55E]">{currency}</span>
            </div>
            <p className="text-[11px] text-[#A8A3BC] mt-1">
              Verified cash funds ready for Telebirr, CBE Birr, or bank payout.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
