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
      return path;
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

const memoryTranslationCache: Record<string, string> = {};

/**
 * Automatically translates dynamic text into English, Afaan Oromoo, or Amharic
 * using a free public API endpoint (MyMemory Translation API - 0 API Key required)
 * with instant client-side caching.
 */
export async function autoTranslate(text: string, targetLang: Language): Promise<string> {
  if (!text || text.trim() === '' || targetLang === 'en') return text;

  const cacheKey = `${targetLang}:${text.trim()}`;

  // 1. In-memory cache
  if (memoryTranslationCache[cacheKey]) {
    return memoryTranslationCache[cacheKey];
  }

  // 2. LocalStorage cache
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem(`nova_tr_${cacheKey}`);
    if (saved) {
      memoryTranslationCache[cacheKey] = saved;
      return saved;
    }
  }

  // 3. Free API call to MyMemory (No API key required)
  try {
    const langPair = `en|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    const res = await fetch(url);

    if (res.ok) {
      const data = await res.json();
      const translated = data?.responseData?.translatedText;

      if (translated && typeof translated === 'string') {
        memoryTranslationCache[cacheKey] = translated;
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            localStorage.setItem(`nova_tr_${cacheKey}`, translated);
          } catch (_) {}
        }
        return translated;
      }
    }
  } catch (error) {
    // Return original text on network error or offline mode
  }

  return text;
}

export * from './translations/en.js';
