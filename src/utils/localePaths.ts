import type { AppLanguage } from './languagePreference';

/** Default locale for SEO URL prefixes (phase 1). */
export const DEFAULT_LOCALE: AppLanguage = 'en';

/**
 * Locales that have their own URL prefix (/en/, /az/, …).
 * Add 'az', 'tr', etc. when those blog locales go live.
 */
export const LOCALIZED_PATH_LOCALES: readonly AppLanguage[] = ['en'];

export function isLocalizedPathLocale(value: string | undefined): value is AppLanguage {
  return value != null && (LOCALIZED_PATH_LOCALES as readonly string[]).includes(value);
}

/** First path segment if it is a localized locale (e.g. /en/blog → en). */
export function parseLocaleFromPath(pathname: string): AppLanguage | null {
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (!match) return null;
  return isLocalizedPathLocale(match[1]) ? match[1] : null;
}

export function blogPath(slug?: string, locale: AppLanguage = DEFAULT_LOCALE): string {
  const base = `/${locale}/blog`;
  return slug ? `${base}/${slug}` : base;
}

/** Map legacy /blog URLs to locale-prefixed paths for in-app links. */
export function localizePathname(pathname: string, locale: AppLanguage = DEFAULT_LOCALE): string {
  if (pathname === '/blog') return blogPath(undefined, locale);
  if (pathname.startsWith('/blog/')) {
    return blogPath(pathname.slice('/blog/'.length), locale);
  }
  return pathname;
}
