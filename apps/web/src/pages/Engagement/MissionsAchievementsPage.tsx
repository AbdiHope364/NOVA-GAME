import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CalendarCheck, CheckCircle2, Flame, Lock, Sparkles, Target } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';

const AVATAR_FRAMES = [
  { id: 'violet', label: 'Electric Violet', cls: 'bg-violet-500' },
  { id: 'cyan', label: 'Cyber Cyan', cls: 'bg-cyan-400' },
  { id: 'emerald', label: 'Emerald', cls: 'bg-emerald-400' },
  { id: 'amber', label: 'Gold', cls: 'bg-amber-400' },
  { id: 'crimson', label: 'Crimson', cls: 'bg-rose-500' },
];

export const MissionsAchievementsPage: React.FC = () => {
  const { user, isAuthenticated, setUser } = useAuthStore();
  const { fetchWallet } = useWalletStore();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [achFilter, setAchFilter] = useState<string>('ALL');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/engagement/summary');
      setData(res.data?.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary, isAuthenticated]);

  const handleCheckIn = async () => {
    setBusyKey('checkin');
    setStatusMsg(null);
    try {
      const res = await api.post('/engagement/check-in');
      const d = res.data?.data;
      setStatusMsg({
        type: 'ok',
        text: `Day ${d.streakDay} claimed! +${d.xpAwarded} XP and +${d.rewardEtb} ETB promotional credit.`,
      });
      await Promise.all([loadSummary(), fetchWallet()]);
    } catch (err: any) {
      setStatusMsg({
        type: 'err',
        text: err.response?.data?.message || 'Unable to claim daily check-in.',
      });
    } finally {
      setBusyKey(null);
    }
  };

  const handleClaimMission = async (missionCode: string) => {
    setBusyKey(missionCode);
    setStatusMsg(null);
    try {
      const res = await api.post(`/engagement/missions/${missionCode}/claim`);
      const d = res.data?.data;
      setStatusMsg({
        type: 'ok',
        text: `Mission claimed! +${d.xpAwarded} XP and +${d.bonusEtb} ETB promotional credit.`,
      });
      await Promise.all([loadSummary(), fetchWallet()]);
    } catch (err: any) {
      setStatusMsg({
        type: 'err',
        text: err.response?.data?.message || 'Unable to claim mission reward.',
      });
    } finally {
      setBusyKey(null);
    }
  };

  const handleSaveCustomization = async (frame: string, badge: string | null) => {
    setBusyKey('custom');
    try {
      const res = await api.patch('/engagement/customization', {
        avatarFrame: frame,
        equippedBadge: badge,
      });
      if (user && res.data?.data) {
        setUser({
          ...user,
          avatarFrame: res.data.data.avatarFrame,
          equippedBadge: res.data.data.equippedBadge,
        });
      }
      setStatusMsg({ type: 'ok', text: 'Profile customization updated!' });
      await loadSummary();
    } catch (err: any) {
      setStatusMsg({
        type: 'err',
        text: err.response?.data?.message || 'Failed to update customization.',
      });
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 rounded-2xl bg-[#111827] border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const profile = data?.profile || { level: 1, xp: 0, xpPercent: 0, avatarFrame: 'violet', equippedBadge: null };
  const daily = data?.dailyCheckIn || { claimedToday: false, nextStreakDay: 1, dayRewards: [5, 10, 15, 20, 25, 35, 50] };
  const missions = data?.missions || [];
  const achievements = data?.achievements || [];
  const wagMult = data?.config?.wageringMultiplier ?? 5;

  const unlockedBadges = achievements.filter((a: any) => a.unlocked);
  const filteredAch =
    achFilter === 'ALL'
      ? achievements
      : achievements.filter((a: any) => a.category === achFilter);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Level & XP Banner */}
      <div className="rounded-2xl bg-[#111827] border border-violet-500/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-300">
            <Sparkles className="w-4 h-4" /> Player Progression
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Level {profile.level} · {profile.xp.toLocaleString()} XP
          </h1>
          <div className="flex items-center gap-3 pt-1">
            <div className="w-48 sm:w-64 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                style={{ width: `${Math.min(Math.max(profile.xpPercent, 4), 100)}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{profile.xpPercent}% to Level {profile.level + 1}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="rounded-xl bg-[#0b101b] border border-slate-800 px-3.5 py-2 text-center">
            <strong className="text-base font-mono text-white block">
              {unlockedBadges.length}/{achievements.length}
            </strong>
            <span className="text-slate-400">Badges</span>
          </div>
          {!isAuthenticated && (
            <Link to="/login" className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold">
              Sign In to Claim
            </Link>
          )}
        </div>
      </div>

      {statusMsg && (
        <div
          className={`rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center justify-between border ${
            statusMsg.type === 'ok'
              ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/35 text-rose-300'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button type="button" onClick={() => setStatusMsg(null)} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* 7-Day Daily Login Streak */}
      <section className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> 7-Day Login Streak Rewards
            </h2>
            <p className="text-xs text-slate-400">
              Consecutive daily check-ins award XP and promotional credit ({wagMult}x wagering, non-withdrawable directly).
            </p>
          </div>
          {isAuthenticated && (
            <button
              type="button"
              disabled={daily.claimedToday || busyKey === 'checkin'}
              onClick={handleCheckIn}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-400 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              {daily.claimedToday
                ? `Day ${daily.nextStreakDay} Claimed Today`
                : busyKey === 'checkin'
                ? 'Claiming...'
                : `Claim Day ${daily.nextStreakDay}`}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {(daily.dayRewards || []).map((etb: number, idx: number) => {
            const day = idx + 1;
            const isPast =
              daily.claimedToday ? day <= daily.nextStreakDay : day < daily.nextStreakDay;
            const isTodayTarget = !daily.claimedToday && day === daily.nextStreakDay;
            return (
              <div
                key={day}
                className={`rounded-xl p-3 border text-center space-y-1 ${
                  isTodayTarget
                    ? 'bg-violet-500/15 border-violet-500'
                    : isPast
                    ? 'bg-emerald-500/10 border-emerald-500/35'
                    : 'bg-[#0b101b] border-slate-800/80'
                }`}
              >
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Day {day}
                </span>
                <strong className="text-sm font-mono text-white block">+{etb} ETB</strong>
                <span className="text-[10px] text-cyan-400 block">+{25 + day * 10} XP</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Daily Missions & Weekly Challenges */}
      <section className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" /> Daily Missions &amp; Weekly Challenges
          </h2>
          <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
            <Lock className="w-3 h-3 text-orange-400" /> Rewards credit to promotional Bonus Balance
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {missions.map((m: any) => {
            const pct = Math.round((m.progress / m.target) * 100);
            return (
              <div
                key={m.code}
                className="rounded-xl bg-[#0b101b] border border-slate-800/80 p-4 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.period === 'DAILY'
                          ? 'bg-cyan-500/15 text-cyan-300'
                          : 'bg-violet-500/15 text-violet-300'
                      }`}
                    >
                      {m.period}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">{m.title}</h3>
                    <p className="text-xs text-slate-400">{m.description}</p>
                  </div>
                  <div className="text-right text-xs font-mono shrink-0">
                    <div className="text-emerald-400 font-bold">+{m.bonusEtb} ETB</div>
                    <div className="text-violet-300">+{m.xpReward} XP</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Progress</span>
                    <span className="font-mono text-white">
                      {m.progress} / {m.target}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-cyan-400"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                {m.claimed ? (
                  <div className="text-xs font-bold text-emerald-400 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Claimed
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!isAuthenticated || !m.canClaim || busyKey === m.code}
                    onClick={() => handleClaimMission(m.code)}
                    className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    {busyKey === m.code
                      ? 'Claiming...'
                      : m.canClaim
                      ? 'Claim Reward'
                      : 'In Progress'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Profile Customization */}
      {isAuthenticated && (
        <section className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 space-y-4">
          <h2 className="text-base font-bold text-white">Profile Customization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <span className="text-slate-400 font-semibold block">Avatar Frame Color</span>
              <div className="flex flex-wrap gap-2">
                {AVATAR_FRAMES.map((frame) => (
                  <button
                    key={frame.id}
                    type="button"
                    disabled={busyKey === 'custom'}
                    onClick={() => handleSaveCustomization(frame.id, profile.equippedBadge)}
                    className={`px-3 py-1.5 rounded-xl border inline-flex items-center gap-2 font-semibold cursor-pointer ${
                      profile.avatarFrame === frame.id
                        ? 'bg-slate-800 border-white text-white'
                        : 'bg-[#0b101b] border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${frame.cls}`} />
                    {frame.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="equip-badge" className="text-slate-400 font-semibold block">
                Equipped Achievement Badge
              </label>
              <select
                id="equip-badge"
                value={profile.equippedBadge || ''}
                onChange={(e) =>
                  handleSaveCustomization(profile.avatarFrame, e.target.value || null)
                }
                className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white"
              >
                <option value="">None (No Badge Displayed)</option>
                {unlockedBadges.map((b: any) => (
                  <option key={b.code} value={b.code}>
                    {b.badgeLabel} — {b.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>
      )}

      {/* Achievements Grid */}
      <section className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-violet-400" /> Achievements ({unlockedBadges.length}/
            {achievements.length})
          </h2>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {(['ALL', 'DAILY', 'GAME', 'STREAK', 'SOCIAL'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setAchFilter(cat)}
                className={`px-3 py-1 rounded-xl font-semibold cursor-pointer ${
                  achFilter === cat
                    ? 'bg-violet-600 text-white'
                    : 'bg-[#0b101b] text-slate-400 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAch.map((ach: any) => (
            <div
              key={ach.code}
              className={`rounded-xl border p-4 space-y-2 ${
                ach.unlocked
                  ? 'bg-violet-500/10 border-violet-500/40'
                  : 'bg-[#0b101b] border-slate-800/80 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                  {ach.category}
                </span>
                <span className="text-[11px] font-mono text-cyan-400 font-bold">
                  +{ach.xpReward} XP
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{ach.title}</h3>
              <p className="text-xs text-slate-400">{ach.description}</p>
              <div className="text-[11px] font-bold pt-1">
                {ach.unlocked ? (
                  <span className="text-emerald-400">
                    Unlocked {ach.unlockedAt ? `· ${new Date(ach.unlockedAt).toLocaleDateString()}` : ''}
                  </span>
                ) : (
                  <span className="text-slate-500">Locked · Badge: {ach.badgeLabel}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
