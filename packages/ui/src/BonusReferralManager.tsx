import React, { useEffect, useState } from 'react';

export interface BonusReferralManagerProps {
  getUrl: (path: string) => string;
  getToken: () => string;
}

export const BonusReferralManager: React.FC<BonusReferralManagerProps> = ({
  getUrl,
  getToken,
}) => {
  const [subTab, setSubTab] = useState<'SETTINGS' | 'BONUSES' | 'REFERRALS'>('SETTINGS');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);

  const [form, setForm] = useState({
    isActive: true,
    bonusPercent: 1000,
    promoBaseEtb: 10,
    maxBonusEtb: 100,
    minDepositEtb: 50,
    wageringMultiplier: 5,
    eligibleGames: 'ALL',
    expirationDays: 14,
    referralsEnabled: true,
    referralRewardEtb: 10,
    referralMinDepositEtb: 50,
    referralApprovalMode: 'AUTO' as 'AUTO' | 'MANUAL',
    referralRewardType: 'PROMOTIONAL' as 'PROMOTIONAL' | 'CASH',
    maxReferralsPerUser: 50,
    startsAt: '',
    endsAt: '',
  });

  const [reviewReasons, setReviewReasons] = useState<Record<string, string>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(getUrl('/admin/promotions'), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setOverview(json.data);
        const c = json.data.campaign;
        setForm({
          isActive: Boolean(c.isActive),
          bonusPercent: Number(c.bonusPercent ?? 1000),
          promoBaseEtb: Number(c.promoBaseEtb ?? 10),
          maxBonusEtb: Number(c.maxBonusEtb ?? 100),
          minDepositEtb: Number(c.minDepositEtb ?? 50),
          wageringMultiplier: Number(c.wageringMultiplier ?? 5),
          eligibleGames: c.eligibleGames || 'ALL',
          expirationDays: Number(c.expirationDays ?? 14),
          referralsEnabled: Boolean(c.referralsEnabled),
          referralRewardEtb: Number(c.referralRewardEtb) === 20 ? 20 : 10,
          referralMinDepositEtb: Number(c.referralMinDepositEtb ?? 50),
          referralApprovalMode: c.referralApprovalMode === 'MANUAL' ? 'MANUAL' : 'AUTO',
          referralRewardType: c.referralRewardType === 'CASH' ? 'CASH' : 'PROMOTIONAL',
          maxReferralsPerUser: Number(c.maxReferralsPerUser ?? 50),
          startsAt: c.startsAt ? String(c.startsAt).slice(0, 16) : '',
          endsAt: c.endsAt ? String(c.endsAt).slice(0, 16) : '',
        });
      }
    } catch {
      setStatusMsg('Failed to load Bonus & Referral campaign overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch(getUrl('/admin/promotions/campaign'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          ...form,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg('Campaign settings saved and audit-logged.');
        await loadData();
      } else {
        setStatusMsg(json.message || 'Failed to update campaign settings.');
      }
    } catch {
      setStatusMsg('Network error saving campaign settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleReviewReferral = async (referralId: string, decision: 'APPROVE' | 'REJECT') => {
    setStatusMsg(null);
    try {
      const res = await fetch(getUrl(`/admin/promotions/referrals/${referralId}/review`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          decision,
          reason: reviewReasons[referralId] || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg(`Referral ${decision === 'APPROVE' ? 'approved & credited' : 'rejected'}.`);
        await loadData();
      } else {
        setStatusMsg(json.message || 'Referral review failed.');
      }
    } catch {
      setStatusMsg('Failed to process referral review.');
    }
  };

  if (loading && !overview) {
    return (
      <div className="bg-[#172033] border border-slate-800 rounded-2xl p-6 text-xs text-slate-400">
        Loading Bonus &amp; Referral management console...
      </div>
    );
  }

  return (
    <div className="space-y-5 text-xs">
      {/* Header & Sub-Tabs */}
      <div className="bg-[#172033] border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Bonus &amp; Referral Management
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure the 1000% welcome promotional bonus, referral rewards (10 or 20 ETB), and review suspicious referrals.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#111827] border border-slate-800 p-1 rounded-xl">
          {(['SETTINGS', 'BONUSES', 'REFERRALS'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSubTab(tab)}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer transition-all ${
                subTab === tab
                  ? 'bg-[#F5B942] text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'SETTINGS'
                ? 'Campaign Rules'
                : tab === 'BONUSES'
                ? `Welcome Bonuses (${overview?.bonuses?.length || 0})`
                : `Referrals & Rewards (${overview?.referrals?.length || 0})`}
            </button>
          ))}
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
          {statusMsg}
        </div>
      )}

      {subTab === 'SETTINGS' && (
        <form onSubmit={handleSaveCampaign} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Welcome Bonus Settings */}
          <div className="bg-[#172033] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-black text-white uppercase tracking-wider">
                Registration Welcome Bonus
              </h4>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="accent-amber-400"
                />
                Enabled
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Bonus Percentage (%)
                </label>
                <input
                  type="number"
                  value={form.bonusPercent}
                  onChange={(e) => setForm({ ...form, bonusPercent: Number(e.target.value) })}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Promo Base (ETB)
                </label>
                <input
                  type="number"
                  value={form.promoBaseEtb}
                  onChange={(e) => setForm({ ...form, promoBaseEtb: Number(e.target.value) })}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Max Bonus Cap (ETB)
                </label>
                <input
                  type="number"
                  value={form.maxBonusEtb}
                  onChange={(e) => setForm({ ...form, maxBonusEtb: Number(e.target.value) })}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  First Deposit Min (ETB)
                </label>
                <input
                  type="number"
                  value={form.minDepositEtb}
                  onChange={(e) => setForm({ ...form, minDepositEtb: Number(e.target.value) })}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Wagering Multiplier (×)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.wageringMultiplier}
                  onChange={(e) => setForm({ ...form, wageringMultiplier: Number(e.target.value) })}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Expiration (Days)
                </label>
                <input
                  type="number"
                  value={form.expirationDays}
                  onChange={(e) => setForm({ ...form, expirationDays: Number(e.target.value) })}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Eligible Games (&quot;ALL&quot; or JSON array like [&quot;letti&quot;,&quot;dice&quot;])
              </label>
              <input
                type="text"
                value={form.eligibleGames}
                onChange={(e) => setForm({ ...form, eligibleGames: e.target.value })}
                className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Campaign Start (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Campaign End (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Referral Settings */}
          <div className="bg-[#172033] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-black text-white uppercase tracking-wider">
                  Referral Program Settings
                </h4>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                  <input
                    type="checkbox"
                    checked={form.referralsEnabled}
                    onChange={(e) => setForm({ ...form, referralsEnabled: e.target.checked })}
                    className="accent-cyan-400"
                  />
                  Enabled
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                  Active Reward Per Successful Referral
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[10, 20].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setForm({ ...form, referralRewardEtb: amt })}
                      className={`py-3 rounded-xl border font-black text-sm cursor-pointer ${
                        form.referralRewardEtb === amt
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-[#111827] border-slate-700 text-slate-400'
                      }`}
                    >
                      Option {amt === 10 ? 'A' : 'B'}: {amt} ETB
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Qualifying Deposit Min (ETB)
                  </label>
                  <input
                    type="number"
                    value={form.referralMinDepositEtb}
                    onChange={(e) => setForm({ ...form, referralMinDepositEtb: Number(e.target.value) })}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Max Referrals / User
                  </label>
                  <input
                    type="number"
                    value={form.maxReferralsPerUser}
                    onChange={(e) => setForm({ ...form, maxReferralsPerUser: Number(e.target.value) })}
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Reward Approval Mode
                  </label>
                  <select
                    value={form.referralApprovalMode}
                    onChange={(e) =>
                      setForm({ ...form, referralApprovalMode: e.target.value as 'AUTO' | 'MANUAL' })
                    }
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="AUTO">AUTO (Hold if Flagged)</option>
                    <option value="MANUAL">MANUAL Admin Review</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Reward Credit Type
                  </label>
                  <select
                    value={form.referralRewardType}
                    onChange={(e) =>
                      setForm({ ...form, referralRewardType: e.target.value as 'PROMOTIONAL' | 'CASH' })
                    }
                    className="w-full bg-[#111827] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="PROMOTIONAL">PROMOTIONAL (Bonus Balance)</option>
                    <option value="CASH">CASH (Withdrawable Balance)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-[#F5B942] hover:bg-amber-400 text-slate-950 font-black uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving Campaign...' : 'Save Bonus & Referral Configuration'}
            </button>
          </div>
        </form>
      )}

      {subTab === 'BONUSES' && (
        <div className="bg-[#172033] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#111827] text-[10px] uppercase text-slate-400">
                <tr>
                  <th className="p-3">Player</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Granted</th>
                  <th className="p-3">Remaining</th>
                  <th className="p-3">Wagering Progress</th>
                  <th className="p-3">Claimed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {!overview?.bonuses?.length ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">
                      No registration bonuses issued yet.
                    </td>
                  </tr>
                ) : (
                  overview.bonuses.map((b: any) => (
                    <tr key={b.id}>
                      <td className="p-3">
                        <div className="font-bold text-white">{b.username}</div>
                        <div className="text-[10px] text-slate-400">{b.email}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-black text-[10px]">
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-white">
                        {b.bonusAmountEtb} ETB ({b.bonusPercent}%)
                      </td>
                      <td className="p-3 font-mono text-amber-300">{b.remainingBonusEtb} ETB</td>
                      <td className="p-3 font-mono text-cyan-300">
                        {b.wageredEtb} / {b.wagerTargetEtb} ETB
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(b.claimedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'REFERRALS' && (
        <div className="bg-[#172033] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#111827] text-[10px] uppercase text-slate-400">
                <tr>
                  <th className="p-3">Referrer → Friend</th>
                  <th className="p-3">Status &amp; Risk</th>
                  <th className="p-3">Deposit</th>
                  <th className="p-3">Reward</th>
                  <th className="p-3">Review Reason / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {!overview?.referrals?.length ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      No referral records yet.
                    </td>
                  </tr>
                ) : (
                  overview.referrals.map((r: any) => (
                    <tr key={r.id}>
                      <td className="p-3">
                        <span className="font-bold text-white">{r.referrerUsername}</span>
                        <span className="text-slate-500 mx-1">→</span>
                        <span className="font-bold text-cyan-300">{r.referredUsername}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : r.status === 'FLAGGED' || r.status === 'REJECTED'
                              ? 'bg-rose-500/15 text-rose-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {r.status} {r.fraudScore > 0 ? `(Risk ${r.fraudScore})` : ''}
                        </span>
                        {r.fraudReason && (
                          <div className="text-[10px] text-rose-300 mt-1">{r.fraudReason}</div>
                        )}
                      </td>
                      <td className="p-3 font-mono text-white">{r.qualifyingDepositEtb} ETB</td>
                      <td className="p-3 font-mono text-emerald-300">
                        {r.rewardAmountEtb} ETB ({r.rewardStatus || 'PENDING'})
                      </td>
                      <td className="p-3">
                        {r.status !== 'APPROVED' && r.status !== 'REJECTED' ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <input
                              type="text"
                              placeholder="Reason (optional)"
                              value={reviewReasons[r.id] || ''}
                              onChange={(e) =>
                                setReviewReasons({ ...reviewReasons, [r.id]: e.target.value })
                              }
                              className="bg-[#111827] border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white w-36"
                            />
                            <button
                              type="button"
                              onClick={() => handleReviewReferral(r.id, 'APPROVE')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-[11px] cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewReferral(r.id, 'REJECT')}
                              className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-black text-[11px] cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
