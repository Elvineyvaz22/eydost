import type { TaxiOrderDraft } from '../utils/taxiLinkSession';

export type TaxiLinkSession = TaxiOrderDraft & {
  linkId: string;
  waId?: string | null;
};

export async function fetchTaxiSession(linkId: string): Promise<TaxiLinkSession | null> {
  const res = await fetch(`/api/taxi-session?link_id=${encodeURIComponent(linkId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Failed to load session (${res.status})`);
  }
  const json = (await res.json()) as { session: TaxiLinkSession | null };
  return json.session;
}

export async function saveTaxiSession(
  linkId: string,
  draft: TaxiOrderDraft,
  waId?: string | null
): Promise<TaxiLinkSession> {
  const res = await fetch('/api/taxi-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      link_id: linkId,
      wa_id: waId || undefined,
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
    throw new Error((err as { error?: string }).error || `Failed to save session (${res.status})`);
  }

  const json = (await res.json()) as { session: TaxiLinkSession };
  return json.session;
}
