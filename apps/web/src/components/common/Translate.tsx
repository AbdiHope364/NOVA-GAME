import React, { useState, useEffect } from 'react';
import { useI18nStore } from '../../stores/i18nStore';

interface TranslateProps {
  text: string;
  fallback?: string;
  className?: string;
}

export const Translate: React.FC<TranslateProps> = ({ text, fallback, className }) => {
  const language = useI18nStore((s) => s.language);
  const autoTranslateText = useI18nStore((s) => s.autoTranslateText);
  const [translatedText, setTranslatedText] = useState<string>(fallback || text);

  useEffect(() => {
    let isMounted = true;
    if (language === 'en') {
      setTranslatedText(text);
      return;
    }

    autoTranslateText(text).then((res: string) => {
      if (isMounted) {
        setTranslatedText(res || text);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [text, language, autoTranslateText]);

  return <span className={className}>{translatedText}</span>;
};
