/**
 * Per-customer taxi link (secret ?id= from Taxibooker).
 * Draft lives in Supabase via /api/taxi-session — not localStorage.
 */

export type TaxiOrderDraft = {
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupCoords?: { lat: number; lng: number };
  dropoffCoords?: { lat: number; lng: number };
  pickupCountryCode?: string | null;
  step?: 'select_pickup' | 'select_dropoff' | 'confirm_ride';
  updatedAt?: string;
};

/**
 * Müştəri linkindəki id (məxfilik açarı).
 * Yalnız URL-də ?id= və ya ?bookingId= olduqda səhifə açılır.
 */
export function resolveTaxiLinkId(searchParams: URLSearchParams): string | null {
  const fromUrl = searchParams.get('id') || searchParams.get('bookingId');
  if (!fromUrl?.trim()) return null;
  return fromUrl.trim();
}

export function resolveTaxiWaId(searchParams: URLSearchParams): string | null {
  const wa = searchParams.get('wa_id');
  return wa?.trim() || null;
}
