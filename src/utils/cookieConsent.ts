/**
 * GDPR / EU cookie consent + Google Consent Mode v2
 */

export type ConsentChoice = 'all' | 'necessary';

const STORAGE_KEY = 'eydost_cookie_consent';

export function getStoredConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === 'all' || v === 'necessary') return v;
  return null;
}

export function setStoredConsent(choice: ConsentChoice): void {
  localStorage.setItem(STORAGE_KEY, choice);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('eydost:consent'));
  }
}

function gtagConsentUpdate(granted: boolean): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtag) return;

  gtag('consent', 'update', {
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
  });
}

/** Apply stored choice on page load (before banner shows again). */
export function applyStoredConsent(): void {
  const choice = getStoredConsent();
  if (choice === 'all') gtagConsentUpdate(true);
  else if (choice === 'necessary') gtagConsentUpdate(false);
}

export function acceptAllCookies(): void {
  setStoredConsent('all');
  gtagConsentUpdate(true);
}

export function acceptNecessaryOnly(): void {
  setStoredConsent('necessary');
  gtagConsentUpdate(false);
}
