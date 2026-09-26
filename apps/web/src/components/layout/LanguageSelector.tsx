import React from 'react';
import { useI18nStore } from '../../stores/i18nStore';
import { supportedLanguages, Language } from '@nova/i18n';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useI18nStore();

  return (
    <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 gap-1 text-xs">
      <Globe className="w-3.5 h-3.5 text-cyan-400" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer pr-1"
      >
        {supportedLanguages.map((l) => (
          <option key={l.code} value={l.code} className="bg-slate-900 text-slate-100">
            {l.flag} {l.name}
          </option>
        ))}
      </select>
    </div>
  );
};
