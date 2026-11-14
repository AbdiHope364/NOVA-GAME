import React, { useEffect, useState } from 'react';

export interface EngagementAdminManagerProps {
  getUrl: (path: string) => string;
  getToken: () => string;
}

export const EngagementAdminManager: React.FC<EngagementAdminManagerProps> = ({
  getUrl,
  getToken,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>({});
  const [form, setForm] = useState({
    enabled: true,
    dailyStreakEnabled: true,
    missionsEnabled: true,
    dayRewards: [5, 10, 15, 20, 25, 35, 50],
    wageringMultiplier: 5.0,
    requireVerifiedAccount: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(getUrl('/admin/engagement'), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setOverview(json.data);
        const c = json.data.config;
        if (c) {
          setForm({
            enabled: Boolean(c.enabled),
            dailyStreakEnabled: Boolean(c.dailyStreakEnabled),
            missionsEnabled: Boolean(c.missionsEnabled),
            dayRewards: Array.isArray(c.dayRewards) && c.dayRewards.length === 7 ? c.dayRewards : [5, 10, 15, 20, 25, 35, 50],
            wageringMultiplier: Number(c.wageringMultiplier ?? 5),
            requireVerifiedAccount: Boolean(c.requireVerifiedAccount ?? true),
          });
        }
      }
    } catch {
      setStatusMsg('Failed to load Daily Rewards & Reports overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch(getUrl('/admin/engagement/config'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg('Daily Rewards & Missions campaign configuration saved.');
        await loadData();
      } else {
        setStatusMsg(json.message || 'Unable to save configuration.');
      }
    } catch {
      setStatusMsg('Network error saving configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleReviewReport = async (reportId: string, decision: 'REVIEWED' | 'DISMISSED') => {
    try {
      const res = await fetch(getUrl(`/admin/engagement/reports/${reportId}/review`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ decision }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg(`Report marked ${decision}.`);
        await loadData();
      }
    } catch {}
  };

  const reports = overview.reports || [];
  const stats = overview.stats || { totalCheckIns: 0, totalMissionClaims: 0 };

  return (
    <div className="space-y-5 text-slate-200">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white">
            Daily Rewards, Missions &amp; Player Safety Reports
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Control daily check-in streaks, mission reward wagering rules, and moderate reported players.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2">
            <span className="text-slate-400">Check-Ins: </span>
            <strong className="text-emerald-400">{stats.totalCheckIns}</strong>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2">
            <span className="text-slate-400">Missions Claimed: </span>
            <strong className="text-cyan-400">{stats.totalMissionClaims}</strong>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center justify-between">
          <span>{statusMsg}</span>
          <button type="button" onClick={() => setStatusMsg(null)} className="underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer">
            <span className="text-xs font-bold text-white">Engagement System Active</span>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="accent-emerald-500 w-4 h-4"
            />
          </label>
          <label className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer">
            <span className="text-xs font-bold text-white">Daily Streaks Enabled</span>
            <input
              type="checkbox"
              checked={form.dailyStreakEnabled}
              onChange={(e) => setForm({ ...form, dailyStreakEnabled: e.target.checked })}
              className="accent-emerald-500 w-4 h-4"
            />
          </label>
          <label className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer">
            <span className="text-xs font-bold text-white">Missions Enabled</span>
            <input
              type="checkbox"
              checked={form.missionsEnabled}
              onChange={(e) => setForm({ ...form, missionsEnabled: e.target.checked })}
              className="accent-emerald-500 w-4 h-4"
            />
          </label>
          <label className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer">
            <span className="text-xs font-bold text-amber-300">Require Verified Account</span>
            <input
              type="checkbox"
              checked={form.requireVerifiedAccount}
              onChange={(e) => setForm({ ...form, requireVerifiedAccount: e.target.checked })}
              className="accent-amber-500 w-4 h-4"
            />
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 block">
            7-Day Streak Promotional Bonus Credits (ETB per day — subject to wagering lock)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
            {form.dayRewards.map((val, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs">
                <span className="text-[10px] text-slate-400 block mb-1">Day {idx + 1}</span>
                <input
                  type="number"
                  min={0}
                  value={val}
                  onChange={(e) => {
                    const next = [...form.dayRewards];
                    next[idx] = Math.max(0, Number(e.target.value));
                    setForm({ ...form, dayRewards: next });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-56 space-y-1 text-xs">
            <label className="font-bold text-slate-400 block">Promo Wagering Multiplier (x)</label>
            <input
              type="number"
              step="0.5"
              min={1}
              max={50}
              value={form.wageringMultiplier}
              onChange={(e) => setForm({ ...form, wageringMultiplier: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Daily & Mission Settings'}
          </button>
        </div>
      </form>

      {/* Player Abuse / Behavior Reports */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto">
        <div className="p-4 border-b border-slate-800 font-bold text-sm text-white">
          Player Reports ({reports.length})
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
            <tr>
              <th className="p-3">Reporter</th>
              <th className="p-3">Reported User</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  No player reports submitted.
                </td>
              </tr>
            ) : (
              reports.map((rep: any) => (
                <tr key={rep.id}>
                  <td className="p-3 font-semibold text-white">{rep.reporterUsername}</td>
                  <td className="p-3 font-semibold text-amber-300">{rep.reportedUsername}</td>
                  <td className="p-3 text-slate-300">
                    <div>{rep.reason}</div>
                    {rep.details && <div className="text-[11px] text-slate-500">{rep.details}</div>}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold">
                      {rep.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {rep.status === 'OPEN' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReviewReport(rep.id, 'REVIEWED')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold"
                        >
                          Mark Reviewed
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewReport(rep.id, 'DISMISSED')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
