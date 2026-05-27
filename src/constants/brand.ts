/** Canonical site logo served from /public (same asset as favicon source). */
export const DEFAULT_LOGO_URL = '/logo.png';

const LEGACY_LOGO_HINTS = ['postimg.cc', 'Whats-App-Image'];

/** Use admin URL when set; replace legacy Postimg / empty with local logo. */
export function resolveLogoUrl(url?: string | null): string {
  const trimmed = url?.trim();
  if (!trimmed) return DEFAULT_LOGO_URL;
  if (LEGACY_LOGO_HINTS.some((h) => trimmed.includes(h))) return DEFAULT_LOGO_URL;
  return trimmed;
}
