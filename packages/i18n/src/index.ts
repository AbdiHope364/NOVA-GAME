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

/**
 * Returns the translation dictionary for a given language code.
 * Requires 0 external API calls.
 */
export function getTranslation(lang: Language = 'en'): TranslationKeys {
  return translations[lang] || translations.en;
}

/**
 * Translates a dot-notated key path (e.g. "common.signIn") with optional parameter substitution.
 * 100% offline, zero-API cost.
 */
export function translatePath(
  lang: Language,
  path: string,
  params?: Record<string, string | number>
): string {
  const dict = getTranslation(lang);
  const keys = path.split('.');
  let current: any = dict;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return path; // Fallback to path string if key not found
    }
  }

  if (typeof current !== 'string') return path;

  let result = current;
  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    });
  }

  return result;
}

export * from './translations/en.js';
