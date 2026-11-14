import React, { useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { usePwaStore } from '../../stores/pwaStore';

export const PwaInstallPrompt: React.FC = () => {
  const {
    isInstalled,
    isIosSafari,
    showInstallModal,
    setShowInstallModal,
    promptInstall,
    initPwaListeners,
  } = usePwaStore();

  useEffect(() => {
    const cleanup = initPwaListeners();
    return cleanup;
  }, [initPwaListeners]);

  if (!showInstallModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={() => setShowInstallModal(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Install NOVA Gaming App"
    >
      <div
        className="w-full max-w-md bg-[#1B1930] border border-violet-500/30 rounded-3xl p-5 shadow-[0_16px_48px_rgba(0,0,0,0.85)] text-white space-y-4 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with App Icon and Close button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/icons/icon-192.png"
                alt="NOVA"
                className="w-12 h-12 rounded-2xl shadow-lg border border-violet-500/40 object-cover"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#1B1930] flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-slate-950 font-bold" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-white">NOVA Gaming App</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold uppercase">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-400">100% Free • Fast • Offline Support</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowInstallModal(false)}
            className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close install modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Perks Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-200 font-medium">Instant 1-Tap Play</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-slate-200 font-medium">Zero Storage Lag</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-violet-400 shrink-0" />
            <span className="text-slate-200 font-medium">No App Store Needed</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-200 font-medium">1,000 ETB Bonus</span>
          </div>
        </div>

        {/* Platform-Specific Step Guides */}
        {isIosSafari ? (
          <div className="p-3.5 rounded-2xl bg-violet-950/40 border border-violet-500/30 space-y-2.5">
            <div className="text-xs font-bold text-violet-200 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-violet-400" />
              <span>How to Install on iPhone / iPad (Safari)</span>
            </div>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside pl-1">
              <li>
                Tap the <strong className="text-white inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700"><Share2 className="w-3 h-3 text-cyan-400" /> Share</strong> button in Safari's bottom toolbar.
              </li>
              <li>
                Scroll down and select <strong className="text-white inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700"><PlusSquare className="w-3 h-3 text-emerald-400" /> Add to Home Screen</strong>.
              </li>
              <li>
                Tap <strong className="text-white">Add</strong> in the top-right corner to finish.
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={promptInstall}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:brightness-110 active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(139,92,246,0.5)] transition-all"
            >
              <Download className="w-4 h-4 animate-bounce" />
              <span>Install NOVA App Now</span>
            </button>

            <div className="text-center">
              <span className="text-[11px] text-slate-400">
                Or tap <span className="text-white font-bold">⋮ More Options</span> in your browser and select <span className="text-white font-bold">"Install App"</span> or <span className="text-white font-bold">"Add to Home screen"</span>.
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Version 2.0 WebApp</span>
          <button
            type="button"
            onClick={() => setShowInstallModal(false)}
            className="hover:text-white transition-colors underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
