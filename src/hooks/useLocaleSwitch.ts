import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import type { AppLanguage } from '../utils/languagePreference';
import { blogPathForLanguageSwitch } from '../utils/localePaths';

/** Switch UI language; on blog pages also navigate to the matching /{locale}/blog URL. */
export function useLocaleSwitch() {
  const { setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (nextLocale: AppLanguage) => {
      const nextPath = blogPathForLanguageSwitch(location.pathname, nextLocale);
      setLanguage(nextLocale);
      if (nextPath) navigate(nextPath);
    },
    [location.pathname, navigate, setLanguage],
  );
}
