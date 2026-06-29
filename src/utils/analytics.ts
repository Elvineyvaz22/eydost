/**
 * Global analytics utility for tracking user events.
 * Respects GDPR consent (analytics only when user accepted all cookies).
 */

import { getStoredConsent } from './cookieConsent';

const GOOGLE_ADS_ESIM_CONVERSION = 'AW-18089479742/ZexsCOHBw64cEL6c3rFD';

type TikTokEventName =
  | 'ViewContent'
  | 'Search'
  | 'InitiateCheckout'
  | 'PlaceAnOrder'
  | 'CompleteRegistration'
  | 'Purchase';

type TikTokTrackParams = {
  contents?: Array<{
    content_id: string;
    content_type: 'product' | 'product_group';
    content_name: string;
  }>;
  value?: number;
  currency?: string;
  search_string?: string;
};

function canTrackAds(): boolean {
  if (typeof window === 'undefined') return false;
  if (getStoredConsent() !== 'all') return false;
  return Boolean((window as { gtag?: (...args: unknown[]) => void }).gtag);
}

function canTrackTikTok(): boolean {
  if (typeof window === 'undefined') return false;
  if (getStoredConsent() !== 'all') return false;
  return Boolean((window as { ttq?: { track?: (...args: unknown[]) => void } }).ttq?.track);
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

export function trackTikTokEvent(
  eventName: TikTokEventName,
  params: TikTokTrackParams = {},
  eventId?: string,
) {
  if (!canTrackTikTok()) return;
  const ttq = (window as { ttq?: { track?: (...args: unknown[]) => void } }).ttq!;
  const normalizedEventId =
    eventId?.trim() ||
    `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  ttq.track?.(eventName, params, { event_id: normalizedEventId });
}

export function trackTikTokProductEvent(
  eventName: TikTokEventName,
  params: {
    contentId: string;
    contentName: string;
    value?: number;
    currency?: string;
    searchString?: string;
    eventId?: string;
  },
) {
  const contentId = params.contentId.trim();
  const contentName = params.contentName.trim();
  if (!contentId || !contentName) return;
  const payload: TikTokTrackParams = {
    contents: [
      {
        content_id: contentId,
        content_type: 'product',
        content_name: contentName,
      },
    ],
  };
  if (typeof params.value === 'number' && Number.isFinite(params.value)) {
    payload.value = params.value;
    payload.currency = params.currency ?? 'USD';
  }
  if (params.searchString?.trim()) {
    payload.search_string = params.searchString.trim();
  }

  trackTikTokEvent(
    eventName,
    payload,
    params.eventId,
  );
}

// Common event names for the Super App
export const EVENTS = {
  WHATSAPP_TAXI_ORDER: 'whatsapp_taxi_order',
  WHATSAPP_ESIM_ORDER: 'whatsapp_esim_order',
  WHATSAPP_CHAT_GENERAL: 'whatsapp_chat_general',
  ESIM_SEARCH: 'esim_search',
  CAR_CLASS_SELECTED: 'car_class_selected',
  TAB_SWITCH: 'tab_switch',
};
