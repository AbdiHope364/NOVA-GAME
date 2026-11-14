import React from 'react';
import {
  Award,
  BookOpen,
  Bot,
  Dices,
  Play,
  RotateCcw,
  Settings,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { LudoLanguage, LudoTheme, LUDO_TRANSLATIONS } from '../types';

export interface SplashScreenProps {
  hasSavedGame: boolean;
  theme: LudoTheme;
  language: LudoLanguage;
  onResumeGame: () => void;
  onPlayVsAi: () => void;
  onPassAndPlay: () => void;
  onOnlinePvP: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  hasSavedGame,
  theme,
  language,
  onResumeGame,
  onPlayVsAi,
  onPassAndPlay,
  onOnlinePvP,
  onOpenRules,
  onOpenSettings,
}) => {
  const strings = LUDO_TRANSLATIONS[language] || LUDO_TRANSLATIONS.en;

  return (
    <div
      className={`min-h-[82vh] w-full flex flex-col items-center justify-center p-4 select-none ${
        theme === 'dark' ? 'text-white' : 'text-slate-900'
      }`}
    >
      <div className="w-full max-w-md mx-auto space-y-6 text-center">
        {/* Animated App Logo with Pawns & Die Graphic */}
        <div className="relative inline-block mx-auto mb-2">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#1B2A41] to-[#2D4263] border-4 border-amber-400/80 shadow-[0_12px_32px_rgba(250,204,21,0.35)] flex items-center justify-center relative overflow-hidden transform hover:scale-105 transition-transform">
            {/* 4 Colored Corner Dots inside Logo */}
            <span className="absolute top-2 left-2 w-3.5 h-3.5 rounded-full bg-[#E53935] shadow" />
            <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-[#43A047] shadow" />
            <span className="absolute bottom-2 left-2 w-3.5 h-3.5 rounded-full bg-[#1E88E5] shadow" />
            <span className="absolute bottom-2 right-2 w-3.5 h-3.5 rounded-full bg-[#FDD835] shadow" />

            {/* Center Die Emoji */}
            <span className="text-4xl sm:text-5xl drop-shadow animate-pulse">🎲</span>
          </div>

          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[10px] tracking-wider shadow">
            3D PREMIER
          </span>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow">
            {strings.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
            {strings.subtitle}
          </p>
        </div>

        {/* Quick Resume Button (if saved match exists) */}
        {hasSavedGame && (
          <button
            type="button"
            onClick={onResumeGame}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-sm inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(34,197,94,0.4)] transition-transform hover:scale-102 active:scale-98 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 animate-spin-slow" /> {strings.resumeGame}
          </button>
        )}

        {/* Main Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* Play vs Computer */}
          <button
            type="button"
            onClick={onPlayVsAi}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#43A047] hover:bg-[#388E3C] text-white font-black text-sm inline-flex items-center justify-center gap-2.5 shadow-lg transition-transform hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Bot className="w-5 h-5" /> {strings.playVsAi}
          </button>

          {/* Pass & Play (Local) */}
          <button
            type="button"
            onClick={onPassAndPlay}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#1E88E5] hover:bg-[#1976D2] text-white font-black text-sm inline-flex items-center justify-center gap-2.5 shadow-lg transition-transform hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Users className="w-5 h-5" /> {strings.passAndPlay}
          </button>

          {/* Online Multiplayer */}
          <button
            type="button"
            onClick={onOnlinePvP}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#FDD835] hover:bg-[#FBC02D] text-slate-950 font-black text-sm inline-flex items-center justify-center gap-2.5 shadow-lg transition-transform hover:scale-102 active:scale-98 cursor-pointer"
          >
            <Zap className="w-5 h-5" /> {strings.onlinePvP}
          </button>
        </div>

        {/* Secondary Buttons: Rules & Settings */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onOpenRules}
            className="py-3 px-3 rounded-2xl bg-[#141F38] hover:bg-[#1B2A41] text-slate-200 border border-white/10 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-cyan-300" /> {strings.rules}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="py-3 px-3 rounded-2xl bg-[#141F38] hover:bg-[#1B2A41] text-slate-200 border border-white/10 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-amber-300" /> {strings.settings}
          </button>
        </div>
      </div>
    </div>
  );
};
