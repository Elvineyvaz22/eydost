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

function canTrackMeta(): boolean {
  if (typeof window === 'undefined') return false;
  if (getStoredConsent() !== 'all') return false;
  return Boolean((window as { fbq?: (...args: unknown[]) => void }).fbq);
}

function canTrackServerTikTok(): boolean {
  if (typeof window === 'undefined') return false;
  return getStoredConsent() === 'all';
}

function getCookieValue(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  return document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function getTikTokClickId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const urlValue = new URLSearchParams(window.location.search).get('ttclid') || undefined;
  if (urlValue) {
    try {
      sessionStorage.setItem('eydost_ttclid', urlValue);
    } catch {
      // Ignore storage failures.
    }
    return urlValue;
  }
  try {
    return sessionStorage.getItem('eydost_ttclid') || undefined;
  } catch {
    return undefined;
  }
}

function sendTikTokServerEvent(eventName: TikTokEventName, params: TikTokTrackParams, eventId: string) {
  if (!canTrackServerTikTok()) return;

  const body = {
    event: eventName,
    event_id: eventId,
    contents: params.contents,
    value: params.value,
    currency: params.currency,
    search_string: params.search_string,
    url: window.location.href,
    user_agent: navigator.userAgent,
    ttclid: getTikTokClickId(),
    ttp: getCookieValue('_ttp'),
  };

  fetch('/api/tiktok-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Analytics must never block the customer journey.
  });
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
  const normalizedEventId =
    eventId?.trim() ||
    `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  if (canTrackTikTok()) {
    const ttq = (window as { ttq?: { track?: (...args: unknown[]) => void } }).ttq!;
    ttq.track?.(eventName, params, { event_id: normalizedEventId });
  }
  sendTikTokServerEvent(eventName, params, normalizedEventId);
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

type MetaEventName = 'ViewContent' | 'Lead' | 'InitiateCheckout' | 'Purchase';

export function trackMetaEvent(
  eventName: MetaEventName,
  params: Record<string, unknown> = {},
) {
  if (!canTrackMeta()) return;
  const fbq = (window as { fbq?: (...args: unknown[]) => void }).fbq!;
  fbq('track', eventName, params);
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
