import React from 'react';
import {
  Globe,
  Moon,
  Music,
  Settings,
  Smartphone,
  Sun,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { LudoLanguage, LudoTheme, LudoUiSettings } from '../../types';

export interface SettingsModalProps {
  isOpen: boolean;
  settings: LudoUiSettings;
  onUpdateSettings: (settings: Partial<LudoUiSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-[#1B2A41] border border-white/10 p-6 space-y-4 shadow-2xl text-left max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <h2 id="settings-dialog-title" className="text-base font-black text-white">
              Game Preferences &amp; Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Close settings dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#141F38] border border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-900 text-amber-300">
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">Sound Effects</div>
                <div className="text-[10px] text-slate-400">Dice roll, hop ticks, capture impact</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                settings.soundEnabled ? 'bg-[#43A047] text-white shadow' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Music Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#141F38] border border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-900 text-purple-300">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Ambient Music</div>
                <div className="text-[10px] text-slate-400">Light background atmosphere</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                settings.musicEnabled ? 'bg-[#43A047] text-white shadow' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Vibration / Haptic Feedback */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#141F38] border border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-900 text-cyan-300">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Vibration / Haptics</div>
                <div className="text-[10px] text-slate-400">Mobile tactile feedback on roll and captures</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ vibrationEnabled: !settings.vibrationEnabled })}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                settings.vibrationEnabled ? 'bg-[#43A047] text-white shadow' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.vibrationEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Theme Selector (Dark / Light) */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#141F38] border border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-900 text-amber-300">
                {settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">Appearance Theme</div>
                <div className="text-[10px] text-slate-400">Deep Navy or Bright Light board mode</div>
              </div>
            </div>
            <div className="flex rounded-xl bg-slate-900 p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  settings.theme === 'dark' ? 'bg-[#1E88E5] text-white shadow' : 'text-slate-400'
                }`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  settings.theme === 'light' ? 'bg-[#1E88E5] text-white shadow' : 'text-slate-400'
                }`}
              >
                Light
              </button>
            </div>
          </div>

          {/* Animation Speed */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#141F38] border border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-900 text-rose-300">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Animation Speed</div>
                <div className="text-[10px] text-slate-400">Pawn hop speed along the track</div>
              </div>
            </div>
            <div className="flex rounded-xl bg-slate-900 p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => onUpdateSettings({ animationSpeed: 'NORMAL' })}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  settings.animationSpeed === 'NORMAL' ? 'bg-[#1E88E5] text-white shadow' : 'text-slate-400'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ animationSpeed: 'FAST' })}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  settings.animationSpeed === 'FAST' ? 'bg-[#1E88E5] text-white shadow' : 'text-slate-400'
                }`}
              >
                Fast
              </button>
            </div>
          </div>

          {/* Auto-Move Single Legal Move */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#141F38] border border-white/[0.06]">
            <div className="pr-2">
              <div className="text-xs font-bold text-white">Auto-Move Single Option</div>
              <div className="text-[10px] text-slate-400">
                Automatically step token when only 1 legal move exists
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ autoMoveSingle: !settings.autoMoveSingle })}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                settings.autoMoveSingle ? 'bg-[#43A047] text-white shadow' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.autoMoveSingle ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Language Selector */}
          <div className="p-3 rounded-2xl bg-[#141F38] border border-white/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Globe className="w-4 h-4 text-emerald-400" /> Language
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'en', label: 'English' },
                { id: 'om', label: 'Afaan Oromoo' },
                { id: 'am', label: 'አማርኛ' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => onUpdateSettings({ language: lang.id as LudoLanguage })}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settings.language === lang.id
                      ? 'bg-[#1E88E5] text-white shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#43A047] hover:bg-[#388E3C] text-white font-bold text-xs shadow-md cursor-pointer"
        >
          Save &amp; Close
        </button>
      </div>
    </div>
  );
};
