import type { AppLanguage } from './languagePreference';

/** Default locale for SEO URL prefixes and x-default hreflang. */
export const DEFAULT_LOCALE: AppLanguage = 'en';

/** All blog URLs use /{locale}/blog/… — each locale has its own indexable page. */
export const LOCALIZED_PATH_LOCALES: readonly AppLanguage[] = [
  'en',
  'az',
  'ru',
  'tr',
  'ar',
  'es',
  'zh',
];

const LOCALE_PATH_PATTERN = LOCALIZED_PATH_LOCALES.join('|');

export function isLocalizedPathLocale(value: string | undefined): value is AppLanguage {
  return value != null && (LOCALIZED_PATH_LOCALES as readonly string[]).includes(value);
}

/** hreflang attribute value (BCP 47). */
export function hrefLangCode(locale: AppLanguage): string {
  return locale === 'zh' ? 'zh-Hans' : locale;
}

/** First path segment if it is a localized locale (e.g. /en/blog → en). */
export function parseLocaleFromPath(pathname: string): AppLanguage | null {
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (!match) return null;
  return isLocalizedPathLocale(match[1]) ? match[1] : null;
}

/** Parse /{locale}/blog or /{locale}/blog/{slug}. */
export function parseBlogLocalePath(pathname: string): { locale: AppLanguage; slug?: string } | null {
  const re = new RegExp(`^/(${LOCALE_PATH_PATTERN})/blog(?:/([^/?#]+))?/?$`);
  const match = pathname.match(re);
  if (!match || !isLocalizedPathLocale(match[1])) return null;
  return { locale: match[1], slug: match[2] };
}

export function blogPath(slug?: string, locale: AppLanguage = DEFAULT_LOCALE): string {
  const base = `/${locale}/blog`;
  return slug ? `${base}/${slug}` : base;
}

/** When switching language on a blog page, return the equivalent localized URL. */
export function blogPathForLanguageSwitch(
  pathname: string,
  nextLocale: AppLanguage,
): string | null {
  const parsed = parseBlogLocalePath(pathname);
  if (!parsed) return null;
  return blogPath(parsed.slug, nextLocale);
}

export function isBlogLocalePath(pathname: string): boolean {
  return parseBlogLocalePath(pathname) != null;
}

/** Map legacy /blog URLs to locale-prefixed paths for in-app links. */
export function localizePathname(pathname: string, locale: AppLanguage = DEFAULT_LOCALE): string {
  if (pathname === '/blog') return blogPath(undefined, locale);
  if (pathname.startsWith('/blog/')) {
    return blogPath(pathname.slice('/blog/'.length), locale);
  }
  return pathname;
}

export type HreflangAlternate = { hrefLang: string; href: string };

export function blogHreflangAlternates(
  siteUrl: string,
  slug?: string,
): HreflangAlternate[] {
  const base = siteUrl.replace(/\/+$/, '');
  const toUrl = (path: string) => `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const links: HreflangAlternate[] = LOCALIZED_PATH_LOCALES.map((locale) => ({
    hrefLang: hrefLangCode(locale),
    href: toUrl(blogPath(slug, locale)),
  }));

  links.push({
    hrefLang: 'x-default',
    href: toUrl(blogPath(slug, DEFAULT_LOCALE)),
  });

  return links;
}
