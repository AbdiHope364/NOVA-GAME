import { create } from 'zustand';
import { Language, getTranslation, TranslationKeys, autoTranslate } from '@nova/i18n';

export interface I18nState {
  language: Language;
  t: TranslationKeys;
  setLanguage: (lang: Language) => void;
  autoTranslateText: (text: string) => Promise<string>;
}

const savedLang = (localStorage.getItem('nova_lang') as Language) || 'en';

export const useI18nStore = create<I18nState>((set, get) => ({
  language: savedLang,
  t: getTranslation(savedLang),
  setLanguage: (lang) => {
    localStorage.setItem('nova_lang', lang);
    set({ language: lang, t: getTranslation(lang) });
  },
  autoTranslateText: (text) => {
    const lang = get().language;
    return autoTranslate(text, lang);
  },
}));
