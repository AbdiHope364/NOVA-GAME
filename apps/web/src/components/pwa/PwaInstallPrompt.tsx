import React, { useEffect, useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('nova_pwa_install_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Capture Chrome / Android / Edge install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 3. Detect iOS Safari (where beforeinstallprompt is not supported)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isSafari =
      ua.includes('safari') &&
      !ua.includes('crios') &&
      !ua.includes('fxios') &&
      !ua.includes('chrome');

    if (isIos && isSafari && !isStandalone) {
      setIsIosSafari(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('nova_pwa_install_dismissed', 'true');
    } catch {}
  };

  if (isInstalled || dismissed) return null;
  if (!deferredPrompt && !isIosSafari) return null;

  return (
    <aside
      aria-label="Install NOVA App"
      className="fixed bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm z-40 p-3 rounded-2xl bg-[#1B2A41]/95 border border-purple-400/30 shadow-[0_8px_24px_rgba(0,0,0,0.8)] backdrop-blur-md text-white animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <img
            src="/icons/icon-192.png"
            alt="NOVA"
            className="w-10 h-10 rounded-xl shadow-md border border-white/10 shrink-0"
          />
          <div>
            <h4 className="text-xs font-black tracking-wide text-white">NOVA Gaming</h4>
            <p className="text-[11px] text-slate-300">
              {isIosSafari ? 'Install on your iPhone home screen' : 'Instant play — no App Store required'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Close install prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isIosSafari ? (
        <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px] text-slate-300 flex items-center gap-1.5 leading-snug">
          <span>Tap</span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">
            <Share2 className="w-3 h-3 text-cyan-400" /> Share
          </span>
          <span>then</span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 text-white font-bold">
            <PlusSquare className="w-3 h-3 text-emerald-400" /> Add to Home Screen
          </span>
        </div>
      ) : (
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white transition-all shadow-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Install NOVA
          </button>
        </div>
      )}
    </aside>
  );
};
