import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Badge } from '@nova/ui';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { LanguageSelector } from '../../components/layout/LanguageSelector';
import {
  Bell,
  CheckCircle2,
  Globe,
  Lock,
  LogOut,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  Volume2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, isAuthenticated, setUser, logout } = useAuthStore();
  const navigate = useNavigate();

  // Profile State
  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Notification & Audio Preferences
  const [soundEffects, setSoundEffects] = useState<boolean>(user?.soundEnabled ?? true);
  const [notifPrefs, setNotifPrefs] = useState<{
    deposits: boolean;
    bonuses: boolean;
    multiplayer: boolean;
  }>(() => {
    try {
      const parsed = user?.notificationPrefs ? JSON.parse(user.notificationPrefs) : null;
      return {
        deposits: parsed?.deposits ?? true,
        bonuses: parsed?.bonuses ?? true,
        multiplayer: parsed?.multiplayer ?? true,
      };
    } catch {
      return { deposits: true, bonuses: true, multiplayer: true };
    }
  });
  const [themeDensity, setThemeDensity] = useState<string>(
    () => localStorage.getItem('nova_theme_pref') || 'dark-gaming'
  );

  // Provably Fair Seed State
  const [serverSeedHash, setServerSeedHash] = useState<string>('');
  const [clientSeed, setClientSeed] = useState<string>('');
  const [nonce, setNonce] = useState<number>(0);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  // Password State
  const [currentPass, setCurrentPass] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [passMsg, setPassMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setPhoneNumber(user.phoneNumber || '');
      setAvatarUrl(user.avatarUrl || '');
      if (user.soundEnabled !== undefined) setSoundEffects(Boolean(user.soundEnabled));
    }
  }, [user]);

  useEffect(() => {
    api
      .get('/games/seed/active')
      .then((res) => {
        if (res.data?.data) {
          setServerSeedHash(res.data.data.serverSeedHash);
          setClientSeed(res.data.data.clientSeed);
          setNonce(res.data.data.nonce);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveProfileAndPrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setProfileMsg({ type: 'err', text: 'Please sign in to save profile preferences.' });
      return;
    }
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await api.patch('/auth/profile', {
        phoneNumber,
        avatarUrl,
        soundEnabled: soundEffects,
        notificationPrefs: notifPrefs,
      });
      if (res.data?.data) {
        setUser(res.data.data);
      }
      setProfileMsg({ type: 'ok', text: 'Profile and notification preferences saved.' });
    } catch (err: any) {
      setProfileMsg({
        type: 'err',
        text: err.response?.data?.message || 'Unable to update profile settings.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRotateSeed = async () => {
    try {
      const res = await api.post('/games/seed/rotate', { newClientSeed: clientSeed });
      if (res.data?.data) {
        setServerSeedHash(res.data.data.serverSeedHash);
        setClientSeed(res.data.data.clientSeed);
        setNonce(0);
        setSeedMsg('Provably Fair seed pair successfully rotated!');
      }
    } catch {
      setSeedMsg('Unable to rotate seeds right now.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass || newPass.length < 6) {
      setPassMsg({
        type: 'err',
        text: 'Enter your current password and a new password (min 6 chars).',
      });
      return;
    }
    setSavingPassword(true);
    setPassMsg(null);
    try {
      await api.post('/auth/password', {
        currentPassword: currentPass,
        newPassword: newPass,
      });
      setPassMsg({ type: 'ok', text: 'Password updated successfully.' });
      setCurrentPass('');
      setNewPass('');
    } catch (err: any) {
      setPassMsg({
        type: 'err',
        text: err.response?.data?.message || 'Password update failed.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5 py-1">
      {/* Profile Hero Header */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-slate-800/80 bg-[#111827] shadow-xl p-5 rounded-2xl">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
            {user?.username?.substring(0, 2).toUpperCase() || 'NV'}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                {user?.username || 'Guest Player'}
              </h1>
              <Badge variant="info">{user?.role || 'PLAYER'}</Badge>
            </div>
            <div className="text-xs text-slate-400 truncate">
              {user?.email || 'Not signed in'}
              {user?.createdAt &&
                ` · Member since ${new Date(user.createdAt).toLocaleDateString()}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={user?.isVerified ? 'success' : 'warning'} className="gap-1 items-center">
            <ShieldCheck className="w-3.5 h-3.5" />
            {user?.isVerified ? 'Verified Account' : 'Verification Pending'}
          </Badge>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          )}
        </div>
      </Card>

      {/* Profile Details + Notification Preferences */}
      <form
        onSubmit={handleSaveProfileAndPrefs}
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        <Card className="flex flex-col gap-4 border-slate-800/80 bg-[#111827] p-5 rounded-2xl">
          <h2 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-4 h-4 text-violet-400" /> Profile Information
          </h2>

          {profileMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                profileMsg.type === 'ok'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-400 block mb-1">Username</label>
              <Input type="text" value={user?.username || ''} disabled />
            </div>
            <div>
              <label className="font-semibold text-slate-400 block mb-1">Email</label>
              <Input type="email" value={user?.email || ''} disabled />
            </div>
            <div>
              <label htmlFor="prof-phone" className="font-semibold text-slate-400 flex items-center gap-1 mb-1">
                <Phone className="w-3 h-3" /> Phone Number (Ethiopia / Mobile Money)
              </label>
              <Input
                id="prof-phone"
                type="tel"
                placeholder="+251 9XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={savingProfile || !isAuthenticated}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl"
          >
            {savingProfile ? 'Saving...' : 'Save Profile & Preferences'}
          </Button>
        </Card>

        {/* Language, Sound, Theme & Notification Preferences */}
        <Card className="flex flex-col gap-4 border-slate-800/80 bg-[#111827] p-5 rounded-2xl">
          <h2 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Globe className="w-4 h-4 text-cyan-400" /> Language, Sound &amp; Alerts
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">
              Interface Language (EN / አማርኛ / Oromoo)
            </label>
            <LanguageSelector />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pref-theme" className="text-xs font-semibold text-slate-400 block">
              Theme Preference
            </label>
            <select
              id="pref-theme"
              value={themeDensity}
              onChange={(e) => {
                setThemeDensity(e.target.value);
                localStorage.setItem('nova_theme_pref', e.target.value);
              }}
              className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            >
              <option value="dark-gaming">Nova Dark Gaming (Default)</option>
              <option value="high-contrast">High Contrast Dark</option>
            </select>
          </div>

          <label className="flex items-center justify-between py-2 border-t border-slate-800/80 cursor-pointer">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-violet-400" /> Game Sound Effects
            </span>
            <input
              type="checkbox"
              checked={soundEffects}
              onChange={(e) => setSoundEffects(e.target.checked)}
              className="w-4 h-4 accent-violet-500 cursor-pointer"
            />
          </label>

          <div className="space-y-2 border-t border-slate-800/80 pt-3">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-cyan-400" /> Notification Preferences
            </div>
            {(
              [
                { key: 'deposits', label: 'Deposit & Withdrawal status alerts' },
                { key: 'bonuses', label: 'Bonus & Referral reward credits' },
                { key: 'multiplayer', label: '1v1 Multiplayer room invites & turns' },
              ] as const
            ).map((pref) => (
              <label key={pref.key} className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span>{pref.label}</span>
                <input
                  type="checkbox"
                  checked={notifPrefs[pref.key]}
                  onChange={(e) =>
                    setNotifPrefs((prev) => ({ ...prev, [pref.key]: e.target.checked }))
                  }
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </Card>
      </form>

      {/* Account Security (Password) + Provably Fair Seed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="flex flex-col gap-4 border-slate-800/80 bg-[#111827] p-5 rounded-2xl">
          <h2 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-orange-400" /> Account Security (Password)
          </h2>

          {passMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                passMsg.type === 'ok'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              {passMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
            <Input
              type="password"
              placeholder="Current password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
            />
            <Input
              type="password"
              placeholder="New password (minimum 6 characters)"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <Button
              type="submit"
              disabled={savingPassword || !isAuthenticated}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
            >
              {savingPassword ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        </Card>

        <Card className="flex flex-col gap-4 border-slate-800/80 bg-[#111827] p-5 rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-bold text-base text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Provably Fair Seed Settings
            </h2>
            <span className="text-[11px] font-mono text-cyan-400 font-bold">SHA-256</span>
          </div>

          {seedMsg && (
            <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {seedMsg}
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block mb-1">
                Active Server Seed Hash
              </span>
              <div className="p-2.5 bg-[#0b101b] rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 break-all">
                {serverSeedHash || 'Sign in or play to initialize server seed commitment'}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 font-semibold">Client Seed</span>
                <span className="font-mono text-slate-400">Nonce: {nonce}</span>
              </div>
              <Input
                type="text"
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                placeholder="Custom client seed..."
              />
            </div>

            <Button
              type="button"
              onClick={handleRotateSeed}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl inline-flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Rotate Seed Pair &amp; Reset Nonce
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
