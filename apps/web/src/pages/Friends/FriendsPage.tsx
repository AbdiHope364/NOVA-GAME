import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Ban,
  Check,
  Crown,
  Flag,
  Swords,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { getGameSocket } from '../../services/socket';
import { useAuthStore } from '../../stores/authStore';

const FRAME_BORDER_MAP: Record<string, string> = {
  violet: 'ring-2 ring-violet-500',
  cyan: 'ring-2 ring-cyan-400',
  emerald: 'ring-2 ring-emerald-400',
  amber: 'ring-2 ring-amber-400',
  crimson: 'ring-2 ring-rose-500',
};

export const FriendsPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [data, setData] = useState<any>({
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
    recentOpponents: [],
    blockedUsers: [],
    pendingInvites: [],
  });
  const [loading, setLoading] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Invite Modal State
  const [inviteTarget, setInviteTarget] = useState<{ userId: string; username: string } | null>(null);
  const [inviteGame, setInviteGame] = useState<'LETTI_PVP' | 'DAMA_PVP' | 'CHESS_PVP' | 'LUDO_PVP'>('LETTI_PVP');
  const [inviteStake, setInviteStake] = useState<number>(50);

  // Report Modal State
  const [reportTarget, setReportTarget] = useState<{ userId: string; username: string } | null>(null);
  const [reportReason, setReportReason] = useState('Unsportsmanlike behavior');
  const [reportDetails, setReportDetails] = useState('');

  const loadFriends = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/social/friends');
      if (res.data?.data) setData(res.data.data);
    } catch {
      // ignore transient error
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // Real-time online presence & invite updates
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getGameSocket();
    const onPresence = ({ userId, online }: { userId: string; online: boolean }) => {
      setData((prev: any) => ({
        ...prev,
        friends: (prev.friends || []).map((f: any) =>
          f.userId === userId ? { ...f, online } : f
        ),
        recentOpponents: (prev.recentOpponents || []).map((o: any) =>
          o.userId === userId ? { ...o, online } : o
        ),
      }));
    };
    const onRefreshNeeded = () => loadFriends();

    socket.on('social:presence-changed', onPresence);
    socket.on('social:friend-request', onRefreshNeeded);
    socket.on('social:friend-accepted', onRefreshNeeded);
    socket.on('social:game-invite', onRefreshNeeded);

    return () => {
      socket.off('social:presence-changed', onPresence);
      socket.off('social:friend-request', onRefreshNeeded);
      socket.off('social:friend-accepted', onRefreshNeeded);
      socket.off('social:game-invite', onRefreshNeeded);
    };
  }, [isAuthenticated, loadFriends]);

  const handleAddFriend = async (targetName: string) => {
    const clean = targetName.trim();
    if (!clean) return;
    setStatusMsg(null);
    setBusyId(`add:${clean}`);
    try {
      const res = await api.post('/social/friends/request', { username: clean });
      setUsernameInput('');
      setStatusMsg({
        type: 'ok',
        text: res.data?.data?.autoAccepted
          ? `You are now friends with ${clean}!`
          : `Friend request sent to ${clean}.`,
      });
      await loadFriends();
    } catch (err: any) {
      setStatusMsg({
        type: 'err',
        text: err.response?.data?.message || 'Unable to send friend request.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleRespondFriend = async (friendshipId: string, action: 'ACCEPT' | 'DECLINE') => {
    setBusyId(friendshipId);
    try {
      await api.post(`/social/friends/${friendshipId}/respond`, { action });
      setStatusMsg({
        type: 'ok',
        text: action === 'ACCEPT' ? 'Friend request accepted!' : 'Friend request declined.',
      });
      await loadFriends();
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.message || 'Action failed.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveFriend = async (friendUserId: string, username: string) => {
    setBusyId(friendUserId);
    try {
      await api.delete(`/social/friends/${friendUserId}`);
      setStatusMsg({ type: 'ok', text: `Removed ${username} from friends.` });
      await loadFriends();
    } catch {
      setStatusMsg({ type: 'err', text: 'Unable to remove friend.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleBlock = async (targetUserId: string, username: string) => {
    setBusyId(targetUserId);
    try {
      await api.post(`/social/block/${targetUserId}`);
      setStatusMsg({ type: 'ok', text: `Blocked ${username}.` });
      await loadFriends();
    } catch {
      setStatusMsg({ type: 'err', text: 'Failed to block user.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleUnblock = async (targetUserId: string) => {
    setBusyId(targetUserId);
    try {
      await api.delete(`/social/block/${targetUserId}`);
      await loadFriends();
    } finally {
      setBusyId(null);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteTarget) return;
    setBusyId('send-invite');
    setStatusMsg(null);
    try {
      const res = await api.post('/social/invites', {
        recipientId: inviteTarget.userId,
        gameType: inviteGame,
        stakeEtb: inviteStake,
      });
      const redirectPath = res.data?.data?.redirectPath;
      setInviteTarget(null);
      setStatusMsg({
        type: 'ok',
        text: `Invite sent to ${inviteTarget.username}! Heading to the match table...`,
      });
      if (redirectPath) {
        navigate(redirectPath);
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'err',
        text: err.response?.data?.message || 'Unable to send game invite.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleRespondInvite = async (inviteId: string, action: 'ACCEPT' | 'DECLINE') => {
    setBusyId(inviteId);
    try {
      const res = await api.post(`/social/invites/${inviteId}/respond`, { action });
      if (action === 'ACCEPT' && res.data?.data?.redirectPath) {
        navigate(res.data.data.redirectPath);
      } else {
        await loadFriends();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.message || 'Invite action failed.' });
      await loadFriends();
    } finally {
      setBusyId(null);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;
    setBusyId('report');
    try {
      await api.post(`/social/report/${reportTarget.userId}`, {
        reason: reportReason,
        details: reportDetails,
      });
      setReportTarget(null);
      setReportDetails('');
      setStatusMsg({ type: 'ok', text: 'Report submitted for admin safety review.' });
    } catch (err: any) {
      setStatusMsg({ type: 'err', text: err.response?.data?.message || 'Failed to submit report.' });
    } finally {
      setBusyId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto rounded-2xl bg-[#111827] border border-slate-800 p-8 text-center space-y-3">
        <Users className="w-8 h-8 text-cyan-400 mx-auto" />
        <h1 className="text-lg font-bold text-white">Sign In for Friends &amp; Game Invites</h1>
        <p className="text-xs text-slate-400">
          Add friends, see who is online, and challenge friends directly in Letti 1v1 or Ethiopian Dama.
        </p>
        <Link
          to="/login"
          className="inline-flex px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header & Add Friend */}
      <div className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> Friends &amp; Multiplayer Invites
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Challenge online friends directly to Letti Face-to-Face or Ethiopian Dama tables.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddFriend(usernameInput);
          }}
          className="flex gap-2 w-full md:w-auto"
        >
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="Add friend by username..."
            aria-label="Friend username"
            className="flex-1 md:w-56 bg-[#0b101b] border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!usernameInput.trim() || Boolean(busyId)}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add
          </button>
        </form>
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

      {/* Pending Game Invites Banner */}
      {data.pendingInvites?.length > 0 && (
        <div className="rounded-2xl bg-violet-500/10 border border-violet-500/35 p-4 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Swords className="w-4 h-4 text-violet-400" /> Incoming Multiplayer Invitations (
            {data.pendingInvites.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {data.pendingInvites.map((inv: any) => (
              <div
                key={inv.id}
                className="rounded-xl bg-[#111827] border border-slate-800 p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-white">
                    {inv.senderUsername} invited you to{' '}
                    <span className="text-cyan-300">
                      {inv.gameType === 'LETTI_PVP'
                        ? 'Letti 1v1'
                        : inv.gameType === 'CHESS_PVP'
                        ? 'NOVA Chess'
                        : inv.gameType === 'LUDO_PVP'
                        ? 'NOVA Ludo'
                        : 'Ethiopian Dama'}
                    </span>
                  </div>
                  <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                    Room {inv.roomCode}{' '}
                    {inv.gameType === 'CHESS_PVP' || inv.gameType === 'LUDO_PVP'
                      ? '· Free Friendly / Ranked'
                      : `· Stake ${inv.stakeEtb.toLocaleString()} ETB`}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={busyId === inv.id}
                    onClick={() => handleRespondInvite(inv.id, 'ACCEPT')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={busyId === inv.id}
                    onClick={() => handleRespondInvite(inv.id, 'DECLINE')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incoming Friend Requests */}
      {data.incomingRequests?.length > 0 && (
        <div className="rounded-2xl bg-[#111827] border border-cyan-500/30 p-4 space-y-2.5">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-400" /> Incoming Friend Requests
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {data.incomingRequests.map((req: any) => (
              <div
                key={req.friendshipId}
                className="rounded-xl bg-[#0b101b] border border-slate-800 p-3 flex items-center justify-between text-xs"
              >
                <span className="font-bold text-white">{req.username}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === req.friendshipId}
                    onClick={() => handleRespondFriend(req.friendshipId, 'ACCEPT')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button
                    type="button"
                    disabled={busyId === req.friendshipId}
                    onClick={() => handleRespondFriend(req.friendshipId, 'DECLINE')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Friends & Recent Opponents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Friends List (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-[#111827] border border-slate-800/80 p-5 space-y-3">
          <h2 className="text-sm font-bold text-white">
            Your Friends ({data.friends?.length || 0})
          </h2>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-800/50 animate-pulse" />
              ))}
            </div>
          ) : !data.friends?.length ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              No friends added yet. Search a player username above or add recent opponents!
            </p>
          ) : (
            <div className="space-y-2.5">
              {data.friends.map((f: any) => (
                <div
                  key={f.userId}
                  className="rounded-xl bg-[#0b101b] border border-slate-800/80 p-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white text-xs font-black shrink-0 ${
                        FRAME_BORDER_MAP[f.avatarFrame || 'violet'] || ''
                      }`}
                    >
                      {f.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {f.username}
                        </span>
                        {f.equippedBadge && (
                          <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold">
                            {f.equippedBadge.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            f.online ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                        />
                        <span className={f.online ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                          {f.online ? 'Online Now' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setInviteTarget({ userId: f.userId, username: f.username });
                        setInviteGame('LETTI_PVP');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Swords className="w-3.5 h-3.5" /> Invite
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFriend(f.userId, f.username)}
                      title="Remove friend"
                      aria-label={`Remove ${f.username}`}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportTarget({ userId: f.userId, username: f.username })}
                      title="Report user"
                      aria-label={`Report ${f.username}`}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-orange-500/20 text-orange-300 cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBlock(f.userId, f.username)}
                      title="Block user"
                      aria-label={`Block ${f.username}`}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Opponents + Outgoing + Blocked (1 col) */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-cyan-400" /> Recent Opponents
            </h2>
            {!data.recentOpponents?.length ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Play a Letti 1v1 or Ethiopian Dama match to see opponents here.
              </p>
            ) : (
              <div className="space-y-2">
                {data.recentOpponents.map((opp: any) => (
                  <div
                    key={opp.userId}
                    className="rounded-xl bg-[#0b101b] border border-slate-800/80 p-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{opp.username}</div>
                      <div className="text-[11px] text-slate-400">{opp.lastGame}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!opp.isFriend && (
                        <button
                          type="button"
                          onClick={() => handleAddFriend(opp.username)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-violet-600 text-white font-semibold cursor-pointer"
                        >
                          Add
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setInviteTarget({ userId: opp.userId, username: opp.username });
                          setInviteGame('LETTI_PVP');
                        }}
                        className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-bold cursor-pointer"
                      >
                        Rematch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {data.blockedUsers?.length > 0 && (
            <div className="rounded-2xl bg-[#111827] border border-slate-800/80 p-4 space-y-2 text-xs">
              <h3 className="font-bold text-slate-300">Blocked Players ({data.blockedUsers.length})</h3>
              {data.blockedUsers.map((b: any) => (
                <div key={b.userId} className="flex items-center justify-between py-1">
                  <span className="text-slate-400">{b.username}</span>
                  <button
                    type="button"
                    onClick={() => handleUnblock(b.userId)}
                    className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Send Multiplayer Invite Modal */}
      {inviteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInviteTarget(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Send Multiplayer Invite"
        >
          <form
            onSubmit={handleSendInvite}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Challenge {inviteTarget.username}
              </h3>
              <button
                type="button"
                onClick={() => setInviteTarget(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Game</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setInviteGame('LETTI_PVP')}
                    className={`py-2.5 rounded-xl font-bold border cursor-pointer ${
                      inviteGame === 'LETTI_PVP'
                        ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                        : 'bg-[#0b101b] border-slate-800 text-slate-400'
                    }`}
                  >
                    Letti Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteGame('DAMA_PVP')}
                    className={`py-2.5 rounded-xl font-bold border cursor-pointer ${
                      inviteGame === 'DAMA_PVP'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-[#0b101b] border-slate-800 text-slate-400'
                    }`}
                  >
                    Dama 1v1
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteGame('CHESS_PVP')}
                    className={`py-2.5 rounded-xl font-bold border cursor-pointer ${
                      inviteGame === 'CHESS_PVP'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-[#0b101b] border-slate-800 text-slate-400'
                    }`}
                  >
                    NOVA Chess
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteGame('LUDO_PVP')}
                    className={`py-2.5 rounded-xl font-bold border cursor-pointer ${
                      inviteGame === 'LUDO_PVP'
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                        : 'bg-[#0b101b] border-slate-800 text-slate-400'
                    }`}
                  >
                    NOVA Ludo
                  </button>
                </div>
              </div>

              {inviteGame !== 'CHESS_PVP' && inviteGame !== 'LUDO_PVP' && (
                <div>
                  <label htmlFor="invite-stake" className="font-semibold text-slate-400 block mb-1">
                    Match Stake (ETB)
                  </label>
                  <input
                    id="invite-stake"
                    type="number"
                    min={10}
                    max={5000}
                    value={inviteStake}
                    onChange={(e) => setInviteStake(Math.max(10, Number(e.target.value)))}
                    className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={busyId === 'send-invite'}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold cursor-pointer"
            >
              {busyId === 'send-invite' ? 'Creating Room...' : 'Create Room & Send Invite'}
            </button>
          </form>
        </div>
      )}

      {/* Report User Modal */}
      {reportTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setReportTarget(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Report Player"
        >
          <form
            onSubmit={handleSubmitReport}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#111827] border border-slate-800 p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Report {reportTarget.username}</h3>
              <button
                type="button"
                onClick={() => setReportTarget(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white"
              >
                <option>Unsportsmanlike behavior</option>
                <option>Suspicious activity / collusion</option>
                <option>Abusive invites or spam</option>
              </select>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Additional details (optional)..."
                className="w-full bg-[#0b101b] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={busyId === 'report'}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              Submit Safety Report
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
