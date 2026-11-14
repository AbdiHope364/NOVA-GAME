import React, { useEffect, useState } from 'react';

export interface LudoAdminManagerProps {
  getUrl: (path: string) => string;
  getToken: () => string;
}

export const LudoAdminManager: React.FC<LudoAdminManagerProps> = ({
  getUrl,
  getToken,
}) => {
  const [subTab, setSubTab] = useState<'OVERVIEW' | 'SETTINGS' | 'FLAGS'>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>({});

  const [form, setForm] = useState({
    enabled: true,
    realMoneyEnabled: false,
    quickMatchEnabled: true,
    privateRoomsEnabled: true,
    aiEnabled: true,
    minStakeEtb: 10,
    maxStakeEtb: 5000,
    platformFeePercent: 5,
    turnTimeoutSeconds: 30,
    moveWindowSeconds: 12,
    reconnectGraceSeconds: 45,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(getUrl('/admin/ludo'), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setOverview(json.data);
        const cfg = json.data.config;
        if (cfg) {
          setForm({
            enabled: Boolean(cfg.enabled),
            realMoneyEnabled: Boolean(cfg.realMoneyEnabled),
            quickMatchEnabled: Boolean(cfg.quickMatchEnabled),
            privateRoomsEnabled: Boolean(cfg.privateRoomsEnabled),
            aiEnabled: Boolean(cfg.aiEnabled),
            minStakeEtb: Number(cfg.minStakeEtb ?? 10),
            maxStakeEtb: Number(cfg.maxStakeEtb ?? 5000),
            platformFeePercent: Number(cfg.platformFeePercent ?? 5),
            turnTimeoutSeconds: Number(cfg.turnTimeoutSeconds ?? 30),
            moveWindowSeconds: Number(cfg.moveWindowSeconds ?? 12),
            reconnectGraceSeconds: Number(cfg.reconnectGraceSeconds ?? 45),
          });
        }
      }
    } catch {
      setStatusMsg('Failed to load NOVA Ludo admin overview.');
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
      const res = await fetch(getUrl('/admin/ludo/config'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg('NOVA Ludo configuration updated & audited.');
        await loadData();
      } else {
        setStatusMsg(json.error || 'Failed to update Ludo config.');
      }
    } catch {
      setStatusMsg('Network error updating Ludo config.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelRoom = async (roomId: string) => {
    try {
      const res = await fetch(getUrl(`/admin/ludo/rooms/${roomId}/cancel`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ reason: 'Admin room cancel & refund' }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg(`Room ${roomId} cancelled and all locked stakes refunded.`);
        await loadData();
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#172033] border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white">NOVA Ludo Control Center</h2>
          <p className="text-xs text-slate-400">
            Manage 2–4P lobbies, real-money launch toggle, rake &amp; clock timers, collusion flags &amp; refunds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['OVERVIEW', 'SETTINGS', 'FLAGS'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSubTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                subTab === tab
                  ? 'bg-emerald-600 text-white'
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#172033] border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] uppercase text-slate-400 font-bold">Total Rooms</div>
          <div className="text-2xl font-black text-white mt-1">{overview?.stats?.totalRooms ?? 0}</div>
        </div>
        <div className="bg-[#172033] border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] uppercase text-slate-400 font-bold">Active Matches</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {overview?.stats?.activeMatchesCount ?? 0}
          </div>
        </div>
        <div className="bg-[#172033] border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] uppercase text-slate-400 font-bold">Waiting Tables</div>
          <div className="text-2xl font-black text-cyan-400 mt-1">
            {overview?.stats?.waitingRoomsCount ?? 0}
          </div>
        </div>
        <div className="bg-[#172033] border border-slate-800 rounded-2xl p-4">
          <div className="text-[11px] uppercase text-slate-400 font-bold">Soft Collusion Signals</div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {overview?.stats?.flagsCount ?? 0}
          </div>
        </div>
      </div>

      {loading && <div className="p-6 text-center text-xs text-slate-400">Loading Ludo data...</div>}

      {subTab === 'OVERVIEW' && (
        <div className="bg-[#172033] border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-black text-white">Recent Ludo Rooms</h3>
          {(overview.rooms || []).length === 0 ? (
            <p className="text-xs text-slate-400">No Ludo rooms recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {(overview.rooms || []).map((r: any) => (
                <div
                  key={r.id}
                  className="rounded-xl bg-[#0b101b] border border-slate-800 p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-cyan-300 mr-2">{r.roomCode}</span>
                    <span className="text-white font-bold">
                      {r.playerCount}P · {(r.stakeSantim / 100).toLocaleString()} ETB
                    </span>
                    <span className="ml-2 text-slate-400">({r.status})</span>
                  </div>
                  {(r.status === 'WAITING' || r.status === 'PLAYING') && (
                    <button
                      type="button"
                      onClick={() => handleCancelRoom(r.id)}
                      className="px-3 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white font-bold cursor-pointer"
                    >
                      Cancel &amp; Refund
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'SETTINGS' && (
        <form
          onSubmit={handleSave}
          className="bg-[#172033] border border-slate-800 rounded-2xl p-5 space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { key: 'enabled', label: 'Ludo Enabled' },
              { key: 'realMoneyEnabled', label: 'Real-Money Stakes' },
              { key: 'quickMatchEnabled', label: 'Quick Match' },
              { key: 'privateRoomsEnabled', label: 'Private Rooms' },
              { key: 'aiEnabled', label: 'Free AI Practice' },
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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Min Stake (ETB)</label>
              <input
                type="number"
                value={form.minStakeEtb}
                onChange={(e) => setForm((p) => ({ ...p, minStakeEtb: Number(e.target.value) }))}
                className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Max Stake (ETB)</label>
              <input
                type="number"
                value={form.maxStakeEtb}
                onChange={(e) => setForm((p) => ({ ...p, maxStakeEtb: Number(e.target.value) }))}
                className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Platform Fee %</label>
              <input
                type="number"
                step="0.5"
                value={form.platformFeePercent}
                onChange={(e) =>
                  setForm((p) => ({ ...p, platformFeePercent: Number(e.target.value) }))
                }
                className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Roll Clock (s)</label>
              <input
                type="number"
                value={form.turnTimeoutSeconds}
                onChange={(e) =>
                  setForm((p) => ({ ...p, turnTimeoutSeconds: Number(e.target.value) }))
                }
                className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Move Window (s)</label>
              <input
                type="number"
                value={form.moveWindowSeconds}
                onChange={(e) =>
                  setForm((p) => ({ ...p, moveWindowSeconds: Number(e.target.value) }))
                }
                className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">Reconnect Grace (s)</label>
              <input
                type="number"
                value={form.reconnectGraceSeconds}
                onChange={(e) =>
                  setForm((p) => ({ ...p, reconnectGraceSeconds: Number(e.target.value) }))
                }
                className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Ludo Configuration'}
          </button>
        </form>
      )}

      {subTab === 'FLAGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-[#172033] border border-slate-800 rounded-2xl p-5 space-y-2 text-xs">
            <h3 className="text-sm font-black text-white">Risk &amp; Network Signals (Review Before Action)</h3>
            {(overview.flags || []).length === 0 ? (
              <p className="text-slate-400">No Ludo fraud signals flagged.</p>
            ) : (
              (overview.flags || []).map((f: any) => (
                <div key={f.id} className="rounded-xl bg-[#0b101b] border border-slate-800 p-3">
                  <div className="font-bold text-amber-300">{f.type}</div>
                  <div className="text-slate-400 break-all mt-1">{f.details}</div>
                </div>
              ))
            )}
          </div>
          <div className="bg-[#172033] border border-slate-800 rounded-2xl p-5 space-y-2 text-xs">
            <h3 className="text-sm font-black text-white">Ludo Audit Logs</h3>
            {(overview.auditLogs || []).length === 0 ? (
              <p className="text-slate-400">No Ludo admin audit entries yet.</p>
            ) : (
              (overview.auditLogs || []).map((l: any) => (
                <div key={l.id} className="rounded-xl bg-[#0b101b] border border-slate-800 p-3">
                  <div className="font-mono font-bold text-cyan-300">{l.action}</div>
                  <div className="text-slate-400 break-all mt-1">{l.details}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
