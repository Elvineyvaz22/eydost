import type { TaxiOrderDraft } from '../utils/taxiLinkSession';

export type TaxiLinkSession = TaxiOrderDraft & {
  linkId: string;
  waId?: string | null;
};

export type TaxiOrderRecord = {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  status: string;
  created_at: string;
};

export type TaxiFavorite = {
  id: string;
  label: string;
  address: string;
  lat: number | null;
  lng: number | null;
  kind: string;
  created_at: string;
};

export type TaxiProfile = {
  session: TaxiLinkSession | null;
  orders: TaxiOrderRecord[];
  favorites: TaxiFavorite[];
};

export async function fetchTaxiProfile(linkId: string): Promise<TaxiProfile> {
  const res = await fetch(`/api/taxi-session?link_id=${encodeURIComponent(linkId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Failed to load (${res.status})`);
  }
  const json = (await res.json()) as TaxiProfile;
  return {
    session: json.session ?? null,
    orders: json.orders ?? [],
    favorites: json.favorites ?? [],
  };
}

/** @deprecated use fetchTaxiProfile */
export async function fetchTaxiSession(linkId: string): Promise<TaxiLinkSession | null> {
  const profile = await fetchTaxiProfile(linkId);
  return profile.session;
}

export async function saveTaxiSession(
  linkId: string,
  draft: TaxiOrderDraft,
  options?: { waId?: string | null; saveOrder?: boolean }
): Promise<{ session: TaxiLinkSession; order?: TaxiOrderRecord | null }> {
  const res = await fetch('/api/taxi-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      link_id: linkId,
      wa_id: options?.waId || undefined,
      save_order: options?.saveOrder === true,
      step: draft.step,
      pickup_address: draft.pickupAddress ?? '',
      dropoff_address: draft.dropoffAddress ?? '',
      pickup_lat: draft.pickupCoords?.lat,
      pickup_lng: draft.pickupCoords?.lng,
      dropoff_lat: draft.dropoffCoords?.lat,
      dropoff_lng: draft.dropoffCoords?.lng,
      pickup_country_code: draft.pickupCountryCode ?? null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Failed to save (${res.status})`);
  }

  const json = (await res.json()) as {
    session: TaxiLinkSession;
    order?: TaxiOrderRecord | null;
    orderError?: string | null;
  };
  return json;
}

/** Add row to taxi_link_orders (Tələblər tab). */
export async function addTaxiOrder(
  linkId: string,
  draft: TaxiOrderDraft
): Promise<TaxiOrderRecord> {
  const res = await fetch('/api/taxi-link-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      link_id: linkId,
      action: 'add_order',
      pickup_address: draft.pickupAddress ?? '',
      dropoff_address: draft.dropoffAddress ?? '',
      pickup_lat: draft.pickupCoords?.lat,
      pickup_lng: draft.pickupCoords?.lng,
      dropoff_lat: draft.dropoffCoords?.lat,
      dropoff_lng: draft.dropoffCoords?.lng,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to save order history');
  }
  const json = (await res.json()) as { order: TaxiOrderRecord };
  return json.order;
}

export async function addTaxiFavorite(
  linkId: string,
  data: { label?: string; address: string; lat?: number; lng?: number; kind?: string }
): Promise<TaxiFavorite> {
  const res = await fetch('/api/taxi-link-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ link_id: linkId, action: 'add_favorite', ...data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to add favorite');
  }
  const json = (await res.json()) as { favorite: TaxiFavorite };
  return json.favorite;
}

export async function removeTaxiFavorite(linkId: string, favoriteId: string): Promise<void> {
  const res = await fetch(
    `/api/taxi-link-data?link_id=${encodeURIComponent(linkId)}&favorite_id=${encodeURIComponent(favoriteId)}`,
    { method: 'DELETE' }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to remove favorite');
  }
}

export function formatOrderDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleString(locale === 'az' ? 'az-Latn' : locale === 'ru' ? 'ru-RU' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
