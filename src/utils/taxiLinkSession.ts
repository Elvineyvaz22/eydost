/**
 * Per-customer taxi link (secret ?id= from Taxibooker).
 * Draft lives in Supabase via /api/taxi-session — not localStorage.
 */

const LINK_ID_SESSION_KEY = 'eydost_taxi_link_id';
const WA_ID_SESSION_KEY = 'eydost_taxi_wa_id';

export type TaxiOrderDraft = {
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupCoords?: { lat: number; lng: number };
  dropoffCoords?: { lat: number; lng: number };
  pickupCountryCode?: string | null;
  step?: 'select_pickup' | 'select_dropoff' | 'confirm_ride';
  updatedAt?: string;
};

function rememberLinkId(id: string) {
  try {
    sessionStorage.setItem(LINK_ID_SESSION_KEY, id);
  } catch {
    /* ignore */
  }
}

function rememberWaId(wa: string) {
  try {
    sessionStorage.setItem(WA_ID_SESSION_KEY, wa);
  } catch {
    /* ignore */
  }
}

export function getRememberedTaxiLinkId(): string | null {
  try {
    return sessionStorage.getItem(LINK_ID_SESSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Müştəri linkindəki id (məxfilik açarı).
 * URL-də ?id= / ?bookingId= və ya bu sessiyada saxlanılmış id.
 */
export function resolveTaxiLinkId(searchParams: URLSearchParams): string | null {
  const fromUrl = searchParams.get('id') || searchParams.get('bookingId');
  if (fromUrl?.trim()) {
    const id = fromUrl.trim();
    rememberLinkId(id);
    return id;
  }
  return getRememberedTaxiLinkId();
}

export function resolveTaxiWaId(searchParams: URLSearchParams): string | null {
  const wa = searchParams.get('wa_id');
  if (wa?.trim()) {
    rememberWaId(wa.trim());
    return wa.trim();
  }
  try {
    return sessionStorage.getItem(WA_ID_SESSION_KEY);
  } catch {
    return null;
  }
}

/** Header və nav üçün — şəxsi link id saxlanılır */
export function buildTaxiHref(searchParams?: URLSearchParams): string {
  const params = searchParams ?? (typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams());
  const id = resolveTaxiLinkId(params);
  if (!id) return '/taxi';
  const q = new URLSearchParams();
  q.set('id', id);
  const wa = resolveTaxiWaId(params);
  if (wa) q.set('wa_id', wa);
  return `/taxi?${q.toString()}`;
}
