import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Share2, Users } from 'lucide-react';

interface ReferralCardProps {
  campaign?: any;
  referral?: any;
  loading?: boolean;
}

export const ReferralCard: React.FC<ReferralCardProps> = ({
  campaign,
  referral,
  loading = false,
}) => {
  const [copied, setCopied] = useState(false);

  if (loading) {
    return <div className="h-56 rounded-2xl bg-[#24213A] animate-pulse" />;
  }

  const rewardEtb = Number(campaign?.referralRewardEtb ?? 10);
  const referralCode = referral?.code || '';
  const referralUrl =
    referralCode && typeof window !== 'undefined'
      ? `${window.location.origin}/register?ref=${referralCode}`
      : '';

  const handleCopy = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleShare = async () => {
    if (!referralUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join NOVA GAMING',
          text: `Register on NOVA GAMING with my referral link!`,
          url: referralUrl,
        });
        return;
      } catch {}
    }
    handleCopy();
  };

  return (
    <div className="rounded-2xl bg-[#24213A] border border-[#22D3EE]/25 p-5 flex flex-col justify-between gap-4 shadow-lg">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#22D3EE]/15 text-[#22D3EE] text-[11px] font-bold">
              <Users className="w-3.5 h-3.5" /> {rewardEtb} ETB Per Referral
            </div>
            <h3 className="text-lg font-bold text-white">Invite Friends, Earn Rewards</h3>
            <p className="text-xs text-[#A8A3BC]">
              Share your referral link and earn <strong className="text-[#22D3EE]">{rewardEtb} ETB</strong> for every eligible referral.
            </p>
          </div>
          <Link to="/referrals" className="text-xs font-bold text-[#8B5CF6] hover:underline shrink-0">
            Stats
          </Link>
        </div>

        <div className="rounded-xl bg-[#11101D] border border-white/[0.06] p-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            type="text"
            readOnly
            value={referralUrl || 'Sign in to generate your referral link'}
            aria-label="Your referral link"
            className="flex-1 bg-transparent text-xs font-mono text-[#A8A3BC] truncate focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={!referralUrl}
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-[#24213A] hover:bg-[#2f2b4a] text-white text-xs font-bold inline-flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              disabled={!referralUrl}
              onClick={handleShare}
              className="px-3 py-1.5 rounded-lg bg-[#22D3EE] hover:bg-cyan-300 text-[#11101D] text-xs font-bold inline-flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="rounded-xl bg-[#11101D] p-2.5 border border-white/[0.06]">
          <div className="text-base font-mono font-bold text-white">{referral?.totalInvited ?? 0}</div>
          <div className="text-[10px] text-[#A8A3BC] font-medium">Invited</div>
        </div>
        <div className="rounded-xl bg-[#11101D] p-2.5 border border-white/[0.06]">
          <div className="text-base font-mono font-bold text-[#22C55E]">{referral?.successfulReferrals ?? 0}</div>
          <div className="text-[10px] text-[#A8A3BC] font-medium">Successful</div>
        </div>
        <div className="rounded-xl bg-[#11101D] p-2.5 border border-white/[0.06]">
          <div className="text-base font-mono font-bold text-orange-300">{referral?.pendingReferrals ?? 0}</div>
          <div className="text-[10px] text-[#A8A3BC] font-medium">Pending</div>
        </div>
        <div className="rounded-xl bg-[#11101D] p-2.5 border border-white/[0.06]">
          <div className="text-base font-mono font-bold text-[#22D3EE]">
            {(referral?.totalRewardsEtb ?? 0).toLocaleString()} ETB
          </div>
          <div className="text-[10px] text-[#A8A3BC] font-medium">Earned</div>
        </div>
      </div>
    </div>
  );
};
