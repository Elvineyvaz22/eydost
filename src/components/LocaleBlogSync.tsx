import { useEffect, type ReactNode } from 'react';
import type { AppLanguage } from '../utils/languagePreference';
import { useLanguage } from '../contexts/LanguageContext';

/** Keeps UI language in sync with the locale segment in /en/blog/… URLs. */
export default function LocaleBlogSync({
  locale,
  children,
}: {
  locale: AppLanguage;
  children: ReactNode;
}) {
  const { setLanguage } = useLanguage();

  useEffect(() => {
    setLanguage(locale);
  }, [locale, setLanguage]);

  return <>{children}</>;
}
