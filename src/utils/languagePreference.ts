export type AppLanguage = 'en' | 'az' | 'ru';

const LANG_KEY = 'eydost_language';
const LANG_MANUAL_KEY = 'eydost_language_manual';
const GEO_SESSION_KEY = 'eydost_geo_lang';

const VALID: AppLanguage[] = ['en', 'az', 'ru'];

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value != null && (VALID as string[]).includes(value);
}

export function getManualLanguage(): AppLanguage | null {
  if (typeof window === 'undefined') return null;
  if (localStorage.getItem(LANG_MANUAL_KEY) !== '1') return null;
  const saved = localStorage.getItem(LANG_KEY);
  return isAppLanguage(saved) ? saved : null;
}

/** Cached geo result for current tab session (avoids EN flash on in-app navigation). */
export function getSessionGeoLanguage(): AppLanguage | null {
  if (typeof window === 'undefined') return null;
  const cached = sessionStorage.getItem(GEO_SESSION_KEY);
  return isAppLanguage(cached) ? cached : null;
}

export function cacheSessionGeoLanguage(lang: AppLanguage) {
  sessionStorage.setItem(GEO_SESSION_KEY, lang);
}

export function saveManualLanguage(lang: AppLanguage) {
  localStorage.setItem(LANG_KEY, lang);
  localStorage.setItem(LANG_MANUAL_KEY, '1');
}

/** AZ → az, all other countries → en */
export function languageFromCountry(country: string | null | undefined): AppLanguage {
  return country?.toUpperCase() === 'AZ' ? 'az' : 'en';
}

export async function detectLanguageFromGeo(): Promise<AppLanguage> {
  try {
    const res = await fetch('/api/geo-country', { credentials: 'same-origin' });
    if (!res.ok) return 'en';
    const data = (await res.json()) as { country?: string | null };
    return languageFromCountry(data.country ?? null);
  } catch {
    return 'en';
  }
}
