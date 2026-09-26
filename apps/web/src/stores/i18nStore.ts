import { create } from 'zustand';
import { Language, getTranslation, TranslationKeys } from '@nova/i18n';

export interface I18nState {
  language: Language;
  t: TranslationKeys;
  setLanguage: (lang: Language) => void;
}

const savedLang = (localStorage.getItem('nova_lang') as Language) || 'en';

export const useI18nStore = create<I18nState>((set) => ({
  language: savedLang,
  t: getTranslation(savedLang),
  setLanguage: (lang) => {
    localStorage.setItem('nova_lang', lang);
    set({ language: lang, t: getTranslation(lang) });
  },
}));
