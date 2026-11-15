import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import {
  Gift,
  Users,
  Copy,
  Share2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
  Lock,
  Sparkles,
  ShieldCheck,
  X,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { LoadingScreen } from '../../components/common/LoadingSpinner';

export const PromotionsPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const loadPromotions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/promotions/summary');
      setData(res.data.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, [isAuthenticated]);

  const referralUrl =
    data?.referral?.code && typeof window !== 'undefined'
      ? `${window.location.origin}/register?ref=${data.referral.code}`
      : '';

  const handleCopy = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleShare = async () => {
    if (!referralUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join NOVA GAMING — 1000% Welcome Bonus!',
          text: `Register on NOVA GAMING with my invite link for a 1000% Welcome Bonus!`,
          url: referralUrl,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    handleCopy();
  };

  if (loading) {
    return (
      <LoadingScreen
        message="Loading Bonuses & VIP Rewards..."
        submessage="Fetching active deposit matches, daily bonus milestones, and referral tiers"
        icon="sparkles"
      />
    );
  }

  const ws = data?.walletSeparation || {
    cashBalance: 0,
    bonusBalance: 0,
    lockedWinnings: 0,
    withdrawableBalance: 0,
  };
  const campaign = data?.campaign;
  const wb = data?.welcomeBonus;
  const elig = data?.withdrawalEligibility;
  const ref = data?.referral;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2 px-2 sm:px-0 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Gift className="w-6 h-6 text-amber-400" /> Bonus &amp; Referral Hub
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track your 1000% Welcome Promotional Bonus, separated wallet balances, and friend referral rewards.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-cyan-300 hover:text-cyan-200 cursor-pointer"
          >
            Bonus Terms &amp; Conditions
          </button>
          <button
            type="button"
            onClick={loadPromotions}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-cyan-500/15 border border-amber-500/40 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
              1000% Welcome Offer Active
            </span>
            <h2 className="text-lg font-black text-white">
              Register an Account to Claim Your Promotional Bonus &amp; Personal Referral Link
            </h2>
            <p className="text-xs text-slate-300">
              Base: {campaign?.promoBaseEtb ?? 10} ETB → <strong>{campaign?.bonusPercent ?? 1000}% Bonus ({campaign?.maxBonusEtb ?? 100} ETB)</strong> credited separately as promotional balance.
            </p>
          </div>
          <Link
            to="/register"
            className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0"
          >
            Register Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 4-Way Separated Wallet Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-cyan-400" /> Cash Balance
          </span>
          <p className="text-xl sm:text-2xl font-mono font-black text-white mt-1">
            {ws.cashBalance.toFixed(2)} <span className="text-xs text-slate-400">ETB</span>
          </p>
          <span className="text-[10px] text-slate-500">Deposited &amp; unlocked funds</span>
        </div>

        <div className="bg-[#111827] border border-amber-500/30 rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Bonus Balance
          </span>
          <p className="text-xl sm:text-2xl font-mono font-black text-amber-300 mt-1">
            {ws.bonusBalance.toFixed(2)} <span className="text-xs text-amber-400/80">ETB</span>
          </p>
          <span className="text-[10px] text-slate-500">Promotional credit only</span>
        </div>

        <div className="bg-[#111827] border border-purple-500/30 rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> Locked Winnings
          </span>
          <p className="text-xl sm:text-2xl font-mono font-black text-purple-300 mt-1">
            {ws.lockedWinnings.toFixed(2)} <span className="text-xs text-purple-400/80">ETB</span>
          </p>
          <span className="text-[10px] text-slate-500">Unlocks on deposit + wagering</span>
        </div>

        <div className="bg-[#111827] border border-emerald-500/30 rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Withdrawable
          </span>
          <p className="text-xl sm:text-2xl font-mono font-black text-emerald-300 mt-1">
            {ws.withdrawableBalance.toFixed(2)} <span className="text-xs text-emerald-400/80">ETB</span>
          </p>
          <span className="text-[10px] text-slate-500">Cleared for withdrawal</span>
        </div>
      </div>

      {/* Main Grid: 1000% Registration Bonus Card & Referral Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Registration Bonus Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-black uppercase tracking-wider">
                {campaign?.bonusPercent ?? 1000}% Welcome Bonus
              </span>
              <h2 className="text-lg font-black text-white mt-1.5">Registration Promotional Bonus</h2>
            </div>
            {wb && (
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                  wb.status === 'COMPLETED'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : wb.status === 'ACTIVE'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {wb.status}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 block text-[11px]">Bonus Received</span>
              <span className="text-base font-mono font-black text-white">
                {wb ? wb.bonusAmountReceivedEtb.toFixed(2) : (campaign?.maxBonusEtb ?? 100).toFixed(2)} ETB
              </span>
            </div>
            <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 block text-[11px]">Current Bonus Balance</span>
              <span className="text-base font-mono font-black text-amber-300">
                {ws.bonusBalance.toFixed(2)} ETB
              </span>
            </div>
          </div>

          {/* Wagering Usage Progress */}
          <div className="space-y-2 bg-[#0b101b] border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Wagering Progress ({campaign?.wageringMultiplier ?? 5}×)</span>
              <span className="font-mono font-bold text-cyan-300">
                {wb ? `${wb.wageredEtb.toFixed(0)} / ${wb.wagerTargetEtb.toFixed(0)} ETB (${wb.progressPercent}%)` : '0%'}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${wb?.progressPercent ?? 0}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Eligible Games: <strong className="text-slate-200">{wb?.eligibleGames || campaign?.eligibleGames || 'ALL'}</strong>
              {wb?.expiresAt && ` • Expires ${new Date(wb.expiresAt).toLocaleDateString()}`}
            </p>
          </div>

          {/* Eligibility Status Pills */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b101b] border border-slate-800">
              <span className="text-slate-300 font-bold">First Qualifying Deposit (Min {campaign?.minDepositEtb ?? 50} ETB)</span>
              {elig?.firstDepositCompleted ? (
                <span className="text-emerald-400 font-black flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Confirmed
                </span>
              ) : (
                <Link to="/wallet" className="text-amber-300 hover:underline font-black flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Deposit Required →
                </Link>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0b101b] border border-slate-800">
              <span className="text-slate-300 font-bold">Withdrawal Eligibility</span>
              {elig?.eligibleToWithdraw ? (
                <span className="text-emerald-400 font-black flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Eligible
                </span>
              ) : (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Locked
                </span>
              )}
            </div>
            {elig?.ineligibleReason && !elig?.eligibleToWithdraw && (
              <p className="text-[11px] text-amber-300/90 px-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {elig.ineligibleReason}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
          >
            View full Bonus Terms &amp; Conditions →
          </button>
        </div>

        {/* Referral Dashboard Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-black uppercase tracking-wider">
                Invite &amp; Earn
              </span>
              <h2 className="text-lg font-black text-white mt-1.5">Friend Referral Program</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Active Reward</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                {campaign?.referralRewardEtb ?? 10} ETB / Friend
              </span>
            </div>
          </div>

          {/* Personal Referral Link */}
          {ref ? (
            <div className="space-y-2 bg-[#0b101b] border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-400 uppercase">Your Referral Link ({ref.code})</span>
                <span className="text-[10px] text-amber-300 font-bold">
                  {ref.rewardType === 'CASH' ? 'Cash Reward' : 'Promotional Credit'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Reward is credited once your friend registers, verifies, and completes a qualifying first deposit (min {campaign?.referralMinDepositEtb ?? 50} ETB).
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#0b101b] border border-slate-800 text-xs text-slate-400">
              Sign in or register to generate your personal referral link.
            </div>
          )}

          {/* Referral Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-400 block">Invited</span>
              <span className="text-lg font-black text-white font-mono">{ref?.totalInvited ?? 0}</span>
            </div>
            <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] text-emerald-400 block">Successful</span>
              <span className="text-lg font-black text-emerald-300 font-mono">{ref?.successfulReferrals ?? 0}</span>
            </div>
            <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] text-amber-400 block">Pending</span>
              <span className="text-lg font-black text-amber-300 font-mono">{ref?.pendingReferrals ?? 0}</span>
            </div>
            <div className="bg-[#0b101b] border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] text-cyan-400 block">Earned</span>
              <span className="text-lg font-black text-cyan-300 font-mono">{ref?.totalRewardsEarnedEtb ?? 0} ETB</span>
            </div>
          </div>

          {/* Referral History Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" /> Referral History
            </h3>
            <div className="bg-[#0b101b] border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              {!ref?.history?.length ? (
                <p className="p-4 text-xs text-slate-500 text-center">
                  No referrals yet. Share your link to earn {campaign?.referralRewardEtb ?? 10} ETB per qualified friend!
                </p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-[10px] uppercase text-slate-400">
                    <tr>
                      <th className="p-2.5">Friend</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Reward</th>
                      <th className="p-2.5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {ref.history.map((item: any) => (
                      <tr key={item.id}>
                        <td className="p-2.5 font-bold text-white">{item.referredUsername}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              item.status === 'APPROVED'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : item.status === 'REJECTED' || item.status === 'FLAGGED'
                                ? 'bg-rose-500/15 text-rose-300'
                                : 'bg-amber-500/15 text-amber-300'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-emerald-300">{item.rewardAmountEtb} ETB</td>
                        <td className="p-2.5 text-right text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                Welcome Bonus &amp; Referral Terms
              </h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2.5 leading-relaxed">
              <li>
                <strong className="text-white">1. Promotional Credit Only:</strong> The 1000% welcome bonus (base {campaign?.promoBaseEtb ?? 10} ETB → {campaign?.maxBonusEtb ?? 100} ETB) is promotional credit stored separately from deposited cash and is not directly withdrawable.
              </li>
              <li>
                <strong className="text-white">2. Locked Bonus Winnings:</strong> Winnings derived from promotional bonus play remain in Locked Winnings until you complete a confirmed qualifying first deposit (min {campaign?.minDepositEtb ?? 50} ETB), account verification, and {campaign?.wageringMultiplier ?? 5}× wagering requirements.
              </li>
              <li>
                <strong className="text-white">3. Cash Balance Protection:</strong> Your legitimate deposited cash funds are tracked separately and are never confiscated due to an unused or expired promotional bonus.
              </li>
              <li>
                <strong className="text-white">4. Referral Fraud Policy:</strong> Self-referrals, duplicate accounts, and shared-device/payment-phone abuse are blocked and flagged for admin review.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
