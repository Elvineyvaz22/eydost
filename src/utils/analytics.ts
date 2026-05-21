/**
 * Global analytics utility for tracking user events.
 * Respects GDPR consent (analytics only when user accepted all cookies).
 */

import { getStoredConsent } from './cookieConsent';

const GOOGLE_ADS_ESIM_CONVERSION = 'AW-18089479742/ZexsCOHBw64cEL6c3rFD';

function canTrackAds(): boolean {
  if (typeof window === 'undefined') return false;
  if (getStoredConsent() !== 'all') return false;
  return Boolean((window as { gtag?: (...args: unknown[]) => void }).gtag);
}

export function parseUsdPrice(price: string): number {
  const n = parseFloat(price.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 1.0;
}

/** Google Ads: Satın alma — Event snippet (dynamic value / currency / transaction_id) */
export function trackGoogleAdsEsimPurchase(params: {
  transactionId: string;
  value: number;
  currency?: string;
}) {
  if (!canTrackAds()) return;
  const txId = params.transactionId.trim();
  if (!txId) return;

  const dedupeKey = `ads_conv_${txId}`;
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(dedupeKey)) return;
  if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(dedupeKey, '1');

  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag!;
  gtag('event', 'conversion', {
    send_to: GOOGLE_ADS_ESIM_CONVERSION,
    value: params.value,
    currency: params.currency ?? 'USD',
    transaction_id: txId,
  });
}

export const trackEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (!canTrackAds()) return;
  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag!;
  gtag('event', eventName, params);
};

// Common event names for the Super App
export const EVENTS = {
  WHATSAPP_TAXI_ORDER: 'whatsapp_taxi_order',
  WHATSAPP_ESIM_ORDER: 'whatsapp_esim_order',
  WHATSAPP_CHAT_GENERAL: 'whatsapp_chat_general',
  ESIM_SEARCH: 'esim_search',
  CAR_CLASS_SELECTED: 'car_class_selected',
  TAB_SWITCH: 'tab_switch',
};
