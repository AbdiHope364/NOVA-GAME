import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export const PwaUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Check for updates periodically every hour
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('SW registration failed:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 p-4 rounded-2xl bg-[#1B2A41] border border-amber-400/40 shadow-[0_12px_32px_rgba(0,0,0,0.85)] text-white backdrop-blur-md animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">Update Available</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              A newer version of NOVA Gaming is ready. Reload to update.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Dismiss update banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          Later
        </button>
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="px-4 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
        >
          Reload Now
        </button>
      </div>
    </div>
  );
};
