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

function languageFromNavigator(): AppLanguage | null {
  if (typeof navigator === 'undefined') return null;
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of langs) {
    const code = raw.toLowerCase();
    if (code === 'az' || code.startsWith('az-')) return 'az';
  }
  return null;
}

function languageFromTimezone(): AppLanguage | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Asia/Baku') return 'az';
  } catch {
    /* ignore */
  }
  return null;
}

function detectLocalHints(): AppLanguage {
  return languageFromNavigator() ?? languageFromTimezone() ?? 'en';
}

export async function detectLanguageFromGeo(): Promise<AppLanguage> {
  try {
    const res = await fetch('/api/geo-country', { credentials: 'same-origin' });
    const contentType = res.headers.get('content-type') ?? '';
    if (res.ok && contentType.includes('application/json')) {
      const data = (await res.json()) as { country?: string | null };
      if (data.country) {
        return languageFromCountry(data.country);
      }
    }
  } catch {
    /* fall through to local hints */
  }
  return detectLocalHints();
}
