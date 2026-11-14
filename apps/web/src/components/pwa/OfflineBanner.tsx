import React, { useEffect, useState } from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 inset-x-0 z-50 px-3 py-1.5 flex items-center justify-center gap-2 text-xs font-black shadow-lg transition-all duration-300 pt-safe ${
        isOnline
          ? 'bg-emerald-600 text-white'
          : 'bg-amber-500 text-slate-950 animate-pulse'
      }`}
    >
      {isOnline ? (
        <>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Back online. Reconnected to NOVA servers.</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            You are offline. Multiplayer is reconnecting — offline games (Ludo vs Computer, Pass & Play) remain playable.
          </span>
        </>
      )}
    </div>
  );
};
