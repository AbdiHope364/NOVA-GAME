import { create } from 'zustand';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  isIosSafari: boolean;
  showInstallModal: boolean;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setIsInstalled: (installed: boolean) => void;
  setIsIosSafari: (isIos: boolean) => void;
  setShowInstallModal: (show: boolean) => void;
  promptInstall: () => Promise<void>;
  initPwaListeners: () => () => void;
}

export const usePwaStore = create<PwaState>((set, get) => ({
  deferredPrompt: null,
  isInstalled: false,
  isIosSafari: false,
  showInstallModal: false,

  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
  setIsInstalled: (installed) => set({ isInstalled: installed }),
  setIsIosSafari: (isIos) => set({ isIosSafari: isIos }),
  setShowInstallModal: (show) => set({ showInstallModal: show }),

  promptInstall: async () => {
    const { deferredPrompt } = get();
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          set({ isInstalled: true, showInstallModal: false });
        }
        set({ deferredPrompt: null });
        return;
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }
    // If no direct beforeinstallprompt event is pending (e.g. iOS Safari, or browser requires manual step)
    set({ showInstallModal: true });
  },

  initPwaListeners: () => {
    // 1. Check if already running in standalone PWA mode
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true);

    if (isStandalone) {
      set({ isInstalled: true });
    }

    // 2. Capture Chrome / Android / Edge install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      set({ deferredPrompt: e as BeforeInstallPromptEvent });
    };

    const handleAppInstalled = () => {
      set({ isInstalled: true, deferredPrompt: null, showInstallModal: false });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 3. Detect iOS Safari
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      const isIos = /iphone|ipad|ipod/.test(ua);
      const isSafari =
        ua.includes('safari') &&
        !ua.includes('crios') &&
        !ua.includes('fxios') &&
        !ua.includes('chrome');

      if (isIos && isSafari && !isStandalone) {
        set({ isIosSafari: true });
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  },
}));
