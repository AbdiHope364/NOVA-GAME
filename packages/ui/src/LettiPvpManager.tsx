import React, { useEffect, useState } from 'react';

export interface LettiPvpManagerProps {
  getUrl: (path: string) => string;
  getToken: () => string;
}

export const LettiPvpManager: React.FC<LettiPvpManagerProps> = ({
  getUrl,
  getToken,
}) => {
  const [subTab, setSubTab] = useState<'SETTINGS' | 'ROOMS' | 'MATCHES'>('SETTINGS');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [overview, setOverview] = useState<{
    config?: any;
    rooms?: any[];
    matches?: any[];
  }>({});

  const [form, setForm] = useState({
    enabled: true,
    quickMatchEnabled: true,
    privateRoomsEnabled: true,
    minStakeEtb: 10,
    maxStakeEtb: 5000,
    platformFeePercent: 5,
    reconnectGraceSeconds: 45,
    maxDisconnects: 3,
    roomExpiryMinutes: 15,
    turnTimeoutSeconds: 30,
    allowBonusBalance: false,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(getUrl('/admin/letti-pvp'), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setOverview(json.data);
        const c = json.data.config;
        if (c) {
          setForm({
            enabled: Boolean(c.enabled),
            quickMatchEnabled: Boolean(c.quickMatchEnabled),
            privateRoomsEnabled: Boolean(c.privateRoomsEnabled),
            minStakeEtb: Number(c.minStakeEtb ?? 10),
            maxStakeEtb: Number(c.maxStakeEtb ?? 5000),
            platformFeePercent: Number(
              c.platformFeePercent ?? (c.platformFeeBps !== undefined ? c.platformFeeBps / 100 : 5)
            ),
            reconnectGraceSeconds: Number(c.reconnectGraceSeconds ?? 45),
            maxDisconnects: Number(c.maxDisconnects ?? 3),
            roomExpiryMinutes: Number(c.roomExpiryMinutes ?? 15),
            turnTimeoutSeconds: Number(c.turnTimeoutSeconds ?? 30),
            allowBonusBalance: Boolean(c.allowBonusBalance),
          });
        }
      }
    } catch {
      setStatusMsg('Failed to load Letti 1v1 PvP overview.');
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
      const res = await fetch(getUrl('/admin/letti-pvp/config'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg('Letti 1v1 PvP configuration updated cleanly.');
        await loadData();
      } else {
        setStatusMsg(json.message || 'Failed to update configuration.');
      }
    } catch {
      setStatusMsg('Network error updating configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelRoom = async (roomId: string, roomCode: string) => {
    setCancellingId(roomId);
    setStatusMsg(null);
    try {
      const res = await fetch(getUrl(`/admin/letti-pvp/rooms/${roomId}/cancel`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg(`Room ${roomCode} cancelled & eligible stakes refunded.`);
        await loadData();
      } else {
        setStatusMsg(json.message || 'Unable to cancel room.');
      }
    } catch {
      setStatusMsg('Failed to cancel room.');
    } finally {
      setCancellingId(null);
    }
  };

  const rooms = overview.rooms || [];
  const matches = overview.matches || [];
  const activeRoomsCount = rooms.filter((r) =>
    ['WAITING', 'READY', 'PLAYING'].includes(r.status)
  ).length;
  const completedMatchesCount = matches.filter((m) => m.status === 'COMPLETED').length;

  return (
    <div className="space-y-5 text-slate-200">
      {/* Header & Summary Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white">
            Letti Card 1v1 Face-to-Face Multiplayer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure stakes, platform commission, disconnect grace period, bonus restriction, and monitor live rooms.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2">
            <span className="text-slate-400">Live Rooms: </span>
            <strong className="text-emerald-400">{activeRoomsCount}</strong>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2">
            <span className="text-slate-400">Completed Matches: </span>
            <strong className="text-amber-300">{completedMatchesCount}</strong>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center justify-between">
          <span>{statusMsg}</span>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2">
        {(['SETTINGS', 'ROOMS', 'MATCHES'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSubTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide transition-colors border ${
              subTab === tab
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            {tab === 'SETTINGS'
              ? 'PvP Rules & Fees'
              : tab === 'ROOMS'
              ? `Rooms (${rooms.length})`
              : `Match History (${matches.length})`}
          </button>
        ))}
      </div>

      {/* TAB 1: SETTINGS */}
      {subTab === 'SETTINGS' && (
        <form
          onSubmit={handleSaveConfig}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer">
              <span className="text-xs font-bold text-white">PvP Enabled</span>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                className="accent-emerald-500 w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer">
              <span className="text-xs font-bold text-white">Quick Match Enabled</span>
              <input
                type="checkbox"
                checked={form.quickMatchEnabled}
                onChange={(e) => setForm({ ...form, quickMatchEnabled: e.target.checked })}
                className="accent-emerald-500 w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer">
              <span className="text-xs font-bold text-white">Private Rooms Enabled</span>
              <input
                type="checkbox"
                checked={form.privateRoomsEnabled}
                onChange={(e) => setForm({ ...form, privateRoomsEnabled: e.target.checked })}
                className="accent-emerald-500 w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer">
              <span className="text-xs font-bold text-amber-300">Allow Promo Bonus Stake</span>
              <input
                type="checkbox"
                checked={form.allowBonusBalance}
                onChange={(e) => setForm({ ...form, allowBonusBalance: e.target.checked })}
                className="accent-amber-500 w-4 h-4"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-400 block">Min Stake (ETB)</label>
              <input
                type="number"
                min={1}
                value={form.minStakeEtb}
                onChange={(e) => setForm({ ...form, minStakeEtb: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 block">Max Stake (ETB)</label>
              <input
                type="number"
                min={1}
                value={form.maxStakeEtb}
                onChange={(e) => setForm({ ...form, maxStakeEtb: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 block">Platform Fee (%)</label>
              <input
                type="number"
                step="0.5"
                min={0}
                max={25}
                value={form.platformFeePercent}
                onChange={(e) =>
                  setForm({ ...form, platformFeePercent: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 block">Reconnect Grace (sec)</label>
              <input
                type="number"
                min={10}
                max={300}
                value={form.reconnectGraceSeconds}
                onChange={(e) =>
                  setForm({ ...form, reconnectGraceSeconds: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 block">Max Disconnects</label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.maxDisconnects}
                onChange={(e) =>
                  setForm({ ...form, maxDisconnects: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 block">Room Expiry (min)</label>
              <input
                type="number"
                min={2}
                max={120}
                value={form.roomExpiryMinutes}
                onChange={(e) =>
                  setForm({ ...form, roomExpiryMinutes: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-400 block">Turn Timeout (sec)</label>
              <input
                type="number"
                min={10}
                max={180}
                value={form.turnTimeoutSeconds}
                onChange={(e) =>
                  setForm({ ...form, turnTimeoutSeconds: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm disabled:opacity-50"
            >
              {saving ? 'Saving Settings...' : 'Save Letti PvP Configuration'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: ROOMS */}
      {subTab === 'ROOMS' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Room Code</th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Stake</th>
                <th className="p-3">Players &amp; Disconnects</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No Letti 1v1 rooms recorded yet.
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono font-bold text-white">{room.roomCode}</td>
                    <td className="p-3 text-slate-300">{room.roomType}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          room.status === 'PLAYING'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : room.status === 'WAITING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {room.status}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-amber-300">
                      {Number(room.stakeEtb).toLocaleString()} ETB
                    </td>
                    <td className="p-3 space-y-1">
                      {(room.players || []).map((p: any) => (
                        <div key={p.userId} className="flex items-center gap-2">
                          <span className="text-white font-semibold">
                            Seat {p.seat}: {p.username}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              p.connectionStatus === 'CONNECTED'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-rose-500/15 text-rose-300'
                            }`}
                          >
                            {p.connectionStatus} ({p.disconnectCount}x)
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="p-3 text-right">
                      {['WAITING', 'READY'].includes(room.status) && (
                        <button
                          type="button"
                          disabled={cancellingId === room.id}
                          onClick={() => handleCancelRoom(room.id, room.roomCode)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold"
                        >
                          {cancellingId === room.id ? 'Cancelling...' : 'Cancel Room'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: MATCHES */}
      {subTab === 'MATCHES' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Room</th>
                <th className="p-3">Players</th>
                <th className="p-3">Outcome</th>
                <th className="p-3">Pot / Fee / Payout</th>
                <th className="p-3">Settled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {matches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No Letti 1v1 matches played yet.
                  </td>
                </tr>
              ) : (
                matches.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono font-bold text-white">{m.roomCode}</td>
                    <td className="p-3 text-slate-300">
                      <strong className="text-white">{m.playerOneUsername}</strong> vs{' '}
                      <strong className="text-white">{m.playerTwoUsername}</strong>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-emerald-300">
                        {m.winnerUsername
                          ? `${m.winnerUsername} (${m.resultType || m.status})`
                          : m.resultType || m.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">
                      {m.totalPotEtb} / {m.platformFeeEtb} /{' '}
                      <strong className="text-amber-300">{m.payoutEtb} ETB</strong>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.settled
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.settled ? 'Settled' : 'Open'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
