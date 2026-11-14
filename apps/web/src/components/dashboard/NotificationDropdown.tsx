import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  message: string;
  status: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  createdAt: string;
  unread: boolean;
  actionPath: string;
}

interface NotificationDropdownProps {
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  unreadCount,
  onUnreadCountChange,
}) => {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const loadNotifications = async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/dashboard/notifications');
      if (res.data?.data) {
        setItems(res.data.data.items || []);
        onUnreadCountChange(Number(res.data.data.unreadCount || 0));
      }
    } catch {
      // Ignore transient errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open, isAuthenticated]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const handleMarkRead = async () => {
    try {
      await api.post('/dashboard/notifications/read');
      setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
      onUnreadCountChange(0);
    } catch {}
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative w-9 h-9 rounded-xl bg-[#24213A] hover:bg-[#2d2947] border border-white/10 text-[#A8A3BC] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#8B5CF6] text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Recent Notifications"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#24213A] border border-white/10 shadow-2xl overflow-hidden z-50"
        >
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkRead}
                className="text-[11px] font-semibold text-[#22D3EE] hover:text-cyan-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.06]">
            {!isAuthenticated ? (
              <div className="p-5 text-center text-xs text-[#A8A3BC]">
                Sign in to view account notifications.
              </div>
            ) : loading ? (
              <div className="p-4 space-y-2.5">
                {[1, 2, 3].map((k) => (
                  <div key={k} className="h-12 rounded-xl bg-[#11101D] animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#A8A3BC]">
                You&apos;re all caught up. No notifications yet.
              </div>
            ) : (
              items.slice(0, 6).map((n) => (
                <Link
                  key={n.id}
                  to={n.actionPath}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 hover:bg-white/[0.04] transition-colors ${
                    n.unread ? 'bg-[#8B5CF6]/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-white">{n.title}</span>
                    {n.unread && <span className="w-2 h-2 rounded-full bg-[#8B5CF6] mt-1 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-[#A8A3BC] mt-0.5 line-clamp-2">{n.message}</p>
                </Link>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 bg-[#1B1930] border-t border-white/[0.08] text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-[#8B5CF6] hover:text-violet-300"
            >
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
