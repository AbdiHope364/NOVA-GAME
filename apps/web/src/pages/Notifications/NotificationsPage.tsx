import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export const NotificationsPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [category, setCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!isAuthenticated) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/dashboard/notifications');
      setItems(res.data?.data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [isAuthenticated]);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/dashboard/notifications/read');
      setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
    } catch {}
  };

  const filtered = useMemo(() => {
    if (category === 'ALL') return items;
    return items.filter((i) => i.category === category);
  }, [items, category]);

  const cats = [
    { id: 'ALL', label: 'All' },
    { id: 'DEPOSIT', label: 'Deposits' },
    { id: 'WITHDRAWAL', label: 'Withdrawals' },
    { id: 'BONUS', label: 'Bonuses' },
    { id: 'REFERRAL', label: 'Referrals' },
    { id: 'MULTIPLAYER', label: 'Multiplayer' },
    { id: 'SYSTEM', label: 'System' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="rounded-2xl bg-[#111827] border border-slate-800/80 p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-400" /> Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Deposit confirmations, withdrawal updates, bonus credits, referrals, and table alerts.
          </p>
        </div>

        {isAuthenticated && items.some((n) => n.unread) && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {cats.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              category === c.id
                ? 'bg-cyan-500 text-slate-950'
                : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {!isAuthenticated ? (
        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-white">Sign in to view your notifications.</p>
          <Link
            to="/login"
            className="inline-flex px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold"
          >
            Sign In
          </Link>
        </div>
      ) : loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-[#111827] border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-8 text-center text-xs sm:text-sm text-slate-400">
          No notifications found in this category.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((n) => (
            <Link
              key={n.id}
              to={n.actionPath || '/'}
              className={`block rounded-2xl border p-4 transition-colors ${
                n.unread
                  ? 'bg-violet-500/10 border-violet-500/40'
                  : 'bg-[#111827] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold text-slate-300">
                    {n.category}
                  </span>
                  <h2 className="text-sm font-bold text-white">{n.title}</h2>
                </div>
                <span className="text-[11px] text-slate-500">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1.5">{n.message}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
