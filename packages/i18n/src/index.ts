import { en, TranslationKeys } from './translations/en.js';
import { om } from './translations/om.js';
import { am } from './translations/am.js';

export type Language = 'en' | 'om' | 'am';

export const supportedLanguages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'om', name: 'Afaan Oromoo', flag: '🇪🇹' },
  { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
];

export const translations: Record<Language, TranslationKeys> = {
  en,
  om,
  am,
};

export function getTranslation(lang: Language = 'en'): TranslationKeys {
  return translations[lang] || translations.en;
}

export * from './translations/en.js';
