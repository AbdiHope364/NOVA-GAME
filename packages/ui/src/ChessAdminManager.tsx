import React, { useEffect, useState } from 'react';

export interface ChessAdminManagerProps {
  getUrl: (path: string) => string;
  getToken: () => string;
}

const ALL_TIME_CONTROLS = [
  { key: 'BULLET_1_0', label: '1+0 Bullet' },
  { key: 'BULLET_2_1', label: '2+1 Bullet' },
  { key: 'BLITZ_3_0', label: '3+0 Blitz' },
  { key: 'BLITZ_3_2', label: '3+2 Blitz' },
  { key: 'BLITZ_5_0', label: '5+0 Blitz' },
  { key: 'RAPID_10_0', label: '10+0 Rapid' },
  { key: 'RAPID_10_5', label: '10+5 Rapid' },
  { key: 'RAPID_15_10', label: '15+10 Rapid' },
  { key: 'CLASSICAL_30_0', label: '30+0 Classical' },
];

export const ChessAdminManager: React.FC<ChessAdminManagerProps> = ({
  getUrl,
  getToken,
}) => {
  const [subTab, setSubTab] = useState<'OVERVIEW' | 'SETTINGS' | 'RATINGS' | 'MODERATION'>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>({});

  const [form, setForm] = useState({
    enabled: true,
    rankedEnabled: true,
    casualEnabled: true,
    aiEnabled: true,
    maxAiDifficulty: 'EXPERT',
    enabledTimeControls: ALL_TIME_CONTROLS.map((t) => t.key),
    disconnectGraceSeconds: 45,
    abortWindowPlies: 2,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(getUrl('/admin/chess'), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setOverview(json.data);
        const cfg = json.data.config;
        if (cfg) {
          setForm({
            enabled: Boolean(cfg.enabled),
            rankedEnabled: Boolean(cfg.rankedEnabled),
            casualEnabled: Boolean(cfg.casualEnabled),
            aiEnabled: Boolean(cfg.aiEnabled),
            maxAiDifficulty: cfg.maxAiDifficulty || 'EXPERT',
            enabledTimeControls: Array.isArray(cfg.enabledTimeControls)
              ? cfg.enabledTimeControls
              : ALL_TIME_CONTROLS.map((t) => t.key),
            disconnectGraceSeconds: Number(cfg.disconnectGraceSeconds ?? 45),
            abortWindowPlies: Number(cfg.abortWindowPlies ?? 2),
          });
        }
      }
    } catch {
      setStatusMsg('Failed to load Chess admin overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch(getUrl('/admin/chess/config'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg('NOVA Chess configuration updated & logged.');
        await loadData();
      } else {
        setStatusMsg(json.error || 'Failed to update configuration.');
      }
    } catch {
      setStatusMsg('Network error updating Chess config.');
    } finally {
      setSaving(false);
    }
  };

  const handleAbortMatch = async (matchId: string) => {
    try {
      const res = await fetch(getUrl(`/admin/chess/matches/${matchId}/abort`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ reason: 'Force-aborted by admin dashboard moderation' }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg(`Aborted match ${matchId}.`);
        await loadData();
      }
    } catch {}
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
        setStatusMsg(`Marked report ${decision}.`);
        await loadData();
      }
    } catch {}
  };

  const toggleTimeControl = (key: string) => {
    setForm((prev) => {
      const exists = prev.enabledTimeControls.includes(key);
      const next = exists
        ? prev.enabledTimeControls.filter((k) => k !== key)
        : [...prev.enabledTimeControls, key];
      return {
        ...prev,
        enabledTimeControls: next.length > 0 ? next : [key],
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#172033] border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white">NOVA Chess Control Center</h2>
          <p className="text-xs text-slate-400">
            Configure Bullet/Blitz/Rapid/Classical clocks, AI difficulty, ratings, matchmaking queues &amp; fair-play reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['OVERVIEW', 'SETTINGS', 'RATINGS', 'MODERATION'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSubTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                subTab === tab
                  ? 'bg-violet-600 text-white'
                  : 'bg-[#0b101b] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-2.5 text-xs font-bold text-cyan-300">
          {statusMsg}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#172033] border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] uppercase text-slate-400 font-bold">Total Chess Matches</div>
          <div className="text-2xl font-black text-white mt-1">
            {overview?.stats?.totalMatches ?? 0}
          </div>
        </div>
        <div className="bg-[#172033] border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] uppercase text-slate-400 font-bold">Live PvP Boards</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {overview?.stats?.activeMatchesCount ?? 0}
          </div>
        </div>
        <div className="bg-[#172033] border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] uppercase text-slate-400 font-bold">Waiting Queue</div>
          <div className="text-2xl font-black text-cyan-400 mt-1">
            {overview?.stats?.waitingRoomsCount ?? 0}
          </div>
        </div>
        <div className="bg-[#172033] border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] uppercase text-slate-400 font-bold">Open Reports</div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {overview?.stats?.openReportsCount ?? 0}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading Chess telemetry...</div>
      ) : null}

      {subTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-[#172033] border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-black text-white">Active PvP Matches ({(overview.activeMatches || []).length})</h3>
            {(overview.activeMatches || []).length === 0 ? (
              <p className="text-xs text-slate-400">No live PvP matches right now.</p>
            ) : (
              <div className="space-y-2">
                {(overview.activeMatches || []).map((m: any) => (
                  <div
                    key={m.matchId}
                    className="rounded-xl bg-[#0b101b] border border-slate-800 p-3 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">
                        {m.whiteUsername} vs {m.blackUsername}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        {m.roomCode} · {m.timeControl} · {m.moveCount} plies
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAbortMatch(m.matchId)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white text-[11px] font-bold cursor-pointer"
                    >
                      Abort
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#172033] border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-black text-white">Waiting Matchmaking Rooms ({(overview.waitingRooms || []).length})</h3>
            {(overview.waitingRooms || []).length === 0 ? (
              <p className="text-xs text-slate-400">Matchmaking queue is empty.</p>
            ) : (
              <div className="space-y-2">
                {(overview.waitingRooms || []).map((r: any) => (
                  <div
                    key={r.roomId}
                    className="rounded-xl bg-[#0b101b] border border-slate-800 p-3 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono text-cyan-400 font-bold mr-2">{r.roomCode}</span>
                      <span className="font-bold text-white">{r.hostUsername}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {r.roomType} · {r.timeControl} · {r.isRanked ? 'Ranked' : 'Casual'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'SETTINGS' && (
        <form
          onSubmit={handleSaveConfig}
          className="bg-[#172033] border border-slate-800 rounded-2xl p-5 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {[
              { key: 'enabled', label: 'NOVA Chess Enabled' },
              { key: 'rankedEnabled', label: 'Ranked Matches Enabled' },
              { key: 'casualEnabled', label: 'Casual Matches Enabled' },
              { key: 'aiEnabled', label: 'Computer AI Practice Enabled' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl bg-[#0b101b] border border-slate-800 cursor-pointer"
              >
                <span className="font-bold text-white">{item.label}</span>
                <input
                  type="checkbox"
                  checked={(form as any)[item.key]}
                  onChange={(e) => setForm((p) => ({ ...p, [item.key]: e.target.checked }))}
                />
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-400 mb-1">Max AI Difficulty</label>
              <select
                value={form.maxAiDifficulty}
                onChange={(e) => setForm((p) => ({ ...p, maxAiDifficulty: e.target.value }))}
                className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white"
              >
                {['BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'EXPERT'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-400 mb-1">Disconnect Grace (sec)</label>
              <input
                type="number"
                min={10}
                max={180}
                value={form.disconnectGraceSeconds}
                onChange={(e) =>
                  setForm((p) => ({ ...p, disconnectGraceSeconds: Number(e.target.value) }))
                }
                className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-400 mb-1">Safe Abort Window (plies)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.abortWindowPlies}
                onChange={(e) =>
                  setForm((p) => ({ ...p, abortWindowPlies: Number(e.target.value) }))
                }
                className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400">Allowed Time Controls</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {ALL_TIME_CONTROLS.map((tc) => {
                const checked = form.enabledTimeControls.includes(tc.key);
                return (
                  <button
                    key={tc.key}
                    type="button"
                    onClick={() => toggleTimeControl(tc.key)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                      checked
                        ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                        : 'bg-[#0b101b] border-slate-800 text-slate-500'
                    }`}
                  >
                    {tc.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Chess Configuration'}
          </button>
        </form>
      )}

      {subTab === 'RATINGS' && (
        <div className="bg-[#172033] border border-slate-800 rounded-2xl p-5 overflow-x-auto">
          <h3 className="text-sm font-black text-white mb-3">Player Category Ratings</h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="py-2 pr-3">Player</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Rating</th>
                <th className="py-2 pr-3">Peak</th>
                <th className="py-2">W / D / L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(overview.ratings || []).map((r: any) => (
                <tr key={r.id}>
                  <td className="py-2 pr-3 font-bold text-white">{r.username}</td>
                  <td className="py-2 pr-3 text-cyan-300 font-mono">{r.category}</td>
                  <td className="py-2 pr-3 font-mono font-black text-violet-300">{r.rating}</td>
                  <td className="py-2 pr-3 font-mono text-slate-300">{r.peakRating}</td>
                  <td className="py-2 text-slate-400">
                    {r.wins} / {r.draws} / {r.losses}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'MODERATION' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-[#172033] border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-black text-white">Fair-Play &amp; Player Reports</h3>
            {(overview.reports || []).length === 0 ? (
              <p className="text-xs text-slate-400">No Chess reports submitted.</p>
            ) : (
              (overview.reports || []).map((rep: any) => (
                <div
                  key={rep.id}
                  className="rounded-xl bg-[#0b101b] border border-slate-800 p-3 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      {rep.reporterUsername} reported {rep.reportedUsername}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                      {rep.status}
                    </span>
                  </div>
                  <div className="text-slate-300">{rep.reason}</div>
                  {rep.status === 'OPEN' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleReviewReport(rep.id, 'REVIEWED')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                      >
                        Mark Reviewed
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewReport(rep.id, 'DISMISSED')}
                        className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-200 font-bold cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="bg-[#172033] border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-black text-white">Chess Admin Audit Logs</h3>
            {(overview.auditLogs || []).length === 0 ? (
              <p className="text-xs text-slate-400">No Chess admin audit actions logged yet.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(overview.auditLogs || []).map((log: any) => (
                  <div
                    key={log.id}
                    className="rounded-xl bg-[#0b101b] border border-slate-800 p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-cyan-300">{log.action}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-400 break-all">{log.details}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
