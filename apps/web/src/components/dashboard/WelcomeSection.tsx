import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Gift, Plus, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';
import { useI18nStore } from '../../stores/i18nStore';

interface WelcomeSectionProps {
  level?: number;
  xpPercent?: number;
  isVerified?: boolean;
  avatarFrame?: string;
  equippedBadge?: string | null;
  loading?: boolean;
}

const FRAME_CLASSES: Record<string, string> = {
  violet: 'ring-2 ring-[#8B5CF6]',
  cyan: 'ring-2 ring-[#22D3EE]',
  emerald: 'ring-2 ring-[#22C55E]',
  amber: 'ring-2 ring-amber-400',
  crimson: 'ring-2 ring-rose-500',
};

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  level = 1,
  xpPercent = 0,
  isVerified = true,
  avatarFrame,
  equippedBadge,
  loading = false,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const { cashBalance, bonusBalance, balance } = useWalletStore();
  const t = useI18nStore((s) => s.t);
  const d = (t as any).dashboard || {};

  const username = user?.username || 'Player';
  const initials = username.slice(0, 2).toUpperCase();
  const displayBalance = balance;
  const activeFrame = avatarFrame || user?.avatarFrame || 'violet';
  const activeBadge = equippedBadge !== undefined ? equippedBadge : user?.equippedBadge;

  return (
    <section
      aria-label="Player Welcome"
      className="rounded-2xl bg-[#24213A] border border-white/[0.06] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg"
    >
      <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#22D3EE] flex items-center justify-center text-white font-black text-lg sm:text-xl shrink-0 shadow-md ${
            FRAME_CLASSES[activeFrame] || ''
          }`}
        >
          {initials}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate">
              {isAuthenticated
                ? `${d.welcomeBack || 'Welcome back'}, ${username}!`
                : 'Welcome to NOVA GAMING!'}
            </h1>
            {activeBadge && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 text-[11px] font-bold">
                {activeBadge.replace(/_/g, ' ')}
              </span>
            )}
            {isAuthenticated && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  isVerified
                    ? 'bg-[#22C55E]/15 text-[#22C55E]'
                    : 'bg-orange-500/15 text-orange-300'
                }`}
              >
                {isVerified ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {isVerified ? 'Verified' : 'Pending'}
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[#A8A3BC]">
            {d.readyForNextGame || 'Ready for your next game?'}
          </p>

          {isAuthenticated && (
            <div className="flex items-center gap-2.5 pt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#22D3EE]">
                <Sparkles className="w-3 h-3" /> Level {loading ? '—' : level}
              </span>
              <div className="w-28 sm:w-36 h-1.5 rounded-full bg-[#11101D] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] transition-all duration-300"
                  style={{ width: `${Math.min(Math.max(xpPercent, 5), 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#A8A3BC] font-medium">{xpPercent}% XP</span>
            </div>
          )}
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/[0.06] shrink-0">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
              <Gift className="w-3 h-3 text-amber-400" /> Welcome Offer
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-white">
              1,000 <span className="text-sm text-[#22D3EE]">ETB Bonus</span>
            </div>
            <p className="text-[11px] text-[#A8A3BC]">
              Get 1,000 ETB bonus after registering!
            </p>
          </div>

          <Link
            to="/register"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] hover:brightness-110 text-white text-xs sm:text-sm font-black inline-flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)]"
          >
            <Gift className="w-4 h-4" /> Claim 1,000 ETB Bonus
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/[0.06] shrink-0">
          <div className="space-y-0.5">
            <div className="text-[11px] font-semibold text-[#A8A3BC] uppercase tracking-wider">
              {t.common.platformWallet || 'Platform Wallet'}
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-white">
              {displayBalance.toLocaleString()} <span className="text-sm text-[#22D3EE]">ETB</span>
            </div>
            {bonusBalance > 0 ? (
              <div className="text-[11px] text-[#8B5CF6] font-semibold">
                Cash: {cashBalance.toLocaleString()} · Bonus: +{bonusBalance.toLocaleString()} ETB
              </div>
            ) : (
              <div className="text-[11px] text-[#22C55E] font-semibold">
                Available to play all games
              </div>
            )}
          </div>

          <Link
            to="/wallet"
            className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-violet-500 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 transition-colors shadow-[0_0_20px_rgba(139,92,246,0.35)]"
          >
            <Plus className="w-4 h-4" /> Quick {d.deposit || 'Deposit'}
          </Link>
        </div>
      )}
    </section>
  );
};
