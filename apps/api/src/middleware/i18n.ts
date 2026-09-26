import { Request, Response, NextFunction } from 'express';
import { getTranslation, Language, TranslationKeys } from '@nova/i18n';

export interface I18nRequest extends Request {
  lang?: Language;
  t?: TranslationKeys;
}

export function i18nMiddleware(req: I18nRequest, res: Response, next: NextFunction) {
  const queryLang = req.query.lang as string;
  const headerLang = req.headers['accept-language']?.substring(0, 2);

  let selectedLang: Language = 'en';
  if (['en', 'om', 'am'].includes(queryLang)) {
    selectedLang = queryLang as Language;
  } else if (['en', 'om', 'am'].includes(headerLang || '')) {
    selectedLang = headerLang as Language;
  }

  req.lang = selectedLang;
  req.t = getTranslation(selectedLang);
  next();
}
