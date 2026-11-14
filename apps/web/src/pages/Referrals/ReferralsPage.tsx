import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Share2, ShieldCheck, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export const ReferralsPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get('/promotions/summary')
      .then((res) => setData(res.data?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const campaign = data?.campaign;
  const referral = data?.referral;
  const rewardEtb = Number(campaign?.referralRewardEtb ?? 10);
  const minDepositEtb = Number(campaign?.referralMinDepositEtb ?? 50);
  const code = referral?.code || '';
  const url =
    code && typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${code}` : '';

  const copyText = async (val: string, kind: 'CODE' | 'URL') => {
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
      if (kind === 'CODE') {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 1800);
      } else {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 1800);
      }
    } catch {}
  };

  const handleShare = async () => {
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join NOVA GAMING',
          text: `Register on NOVA GAMING with my invite link!`,
          url,
        });
        return;
      } catch {}
    }
    copyText(url, 'URL');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="rounded-2xl bg-[#111827] border border-cyan-500/30 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400">
              <Users className="w-4 h-4" /> Referral Rewards Program
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Invite Friends, Earn {rewardEtb} ETB Per Referral
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Earn {rewardEtb} ETB ({campaign?.referralRewardType === 'CASH' ? 'Real Cash' : 'Promotional Credit'}) when each invited friend verifies and completes a qualifying deposit of at least {minDepositEtb} ETB.
            </p>
          </div>
          {!isAuthenticated && (
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold"
            >
              Sign In for Your Code
            </Link>
          )}
        </div>

        {loading ? (
          <div className="h-24 rounded-xl bg-slate-800/50 animate-pulse" />
        ) : (
          isAuthenticated && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#0b101b] border border-slate-800 p-3 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Unique Referral Code
                  </span>
                  <span className="text-base font-mono font-black text-white">{code || '—'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(code, 'CODE')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied' : 'Copy Code'}
                </button>
              </div>

              <div className="rounded-xl bg-[#0b101b] border border-slate-800 p-3 flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Shareable Referral URL
                  </span>
                  <span className="text-xs font-mono text-cyan-300 truncate block">{url || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyText(url, 'URL')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Invitations', val: referral?.totalInvited ?? 0, color: 'text-white' },
          { label: 'Successful Referrals', val: referral?.successfulReferrals ?? 0, color: 'text-emerald-400' },
          { label: 'Pending Referrals', val: referral?.pendingReferrals ?? 0, color: 'text-orange-300' },
          {
            label: 'Total Rewards Earned',
            val: `${(referral?.totalRewardsEtb ?? 0).toLocaleString()} ETB`,
            color: 'text-cyan-300',
          },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-[#111827] border border-slate-800/80 p-4">
            <span className="text-xs text-slate-400 block">{s.label}</span>
            <strong className={`text-xl font-mono font-black mt-1 block ${s.color}`}>
              {s.val}
            </strong>
          </div>
        ))}
      </div>

      {/* Invited Friends & Rewards History */}
      <div className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 space-y-3">
        <h2 className="text-sm font-bold text-white">Referral Activity &amp; Reward History</h2>
        {!referral?.referrals?.length ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No invited players yet. Share your link above to start earning!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[480px]">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                  <th className="py-2.5 pr-3">Invited Player</th>
                  <th className="py-2.5 px-3">Date Joined</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 pl-3 text-right">Reward Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {referral.referrals.map((r: any) => (
                  <tr key={r.id}>
                    <td className="py-2.5 pr-3 font-semibold text-white">{r.referredUsername}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 font-bold text-[10px]">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono text-emerald-400">
                      {r.status === 'APPROVED' ? `+${rewardEtb} ETB` : 'Pending First Deposit'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transparent Referral Rules */}
      <div className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 space-y-2 text-xs text-slate-300">
        <div className="flex items-center gap-2 font-bold text-white">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Referral Program Rules
        </div>
        <ul className="list-disc pl-5 space-y-1 text-slate-400">
          <li>Each invited user must register a unique, genuine account using your referral code or link.</li>
          <li>Self-referrals and duplicate device or IP abuse attempts are automatically blocked.</li>
          <li>Rewards ({rewardEtb} ETB) qualify after the invited user&apos;s confirmed first deposit of {minDepositEtb} ETB or more.</li>
        </ul>
      </div>
    </div>
  );
};
