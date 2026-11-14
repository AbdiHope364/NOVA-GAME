import React, { useState, useRef, useEffect } from 'react';
import { useI18nStore } from '../../stores/i18nStore';
import { supportedLanguages, Language } from '@nova/i18n';
import { Globe, ChevronDown, Check, Languages } from 'lucide-react';

export interface LanguageSelectorProps {
  align?: 'left' | 'right';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ align = 'right', className = '' }) => {
  const { language, setLanguage } = useI18nStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = supportedLanguages.find((l: any) => l.code === language) || supportedLanguages[0];

  useEffect(() => {
    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, []);

  return (
    <div className={`relative shrink-0 ${className}`} ref={containerRef}>
      {/* Trigger Button - Clean Lucide Icon & Code */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-bold text-slate-200 transition-colors shadow-inner shrink-0 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        aria-label="Toggle language menu"
      >
        <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="font-mono text-xs font-black uppercase tracking-wider text-slate-200">
          {currentLang.code}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Solid High-Contrast Dropdown Menu (Inward-aligned, guaranteed inside container) */}
      {isOpen && (
        <div 
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-2 z-[100] bg-slate-900 border border-slate-700/90 rounded-2xl p-2 shadow-2xl min-w-[195px] max-w-[calc(100vw-32px)] flex flex-col gap-1 ring-1 ring-cyan-500/30`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            <span>Select Language</span>
          </div>
          {supportedLanguages.map((l: any) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLanguage(l.code as Language);
                setIsOpen(false);
              }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left active:scale-95 ${
                l.code === language
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono font-black text-cyan-300">
                  {l.code.toUpperCase()}
                </span>
                <span className="font-bold text-slate-100">{l.name}</span>
              </div>
              {l.code === language && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-1.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
