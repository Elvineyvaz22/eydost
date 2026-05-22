import type { SupabaseClient } from '@supabase/supabase-js';

export const MAX_TAXI_ORDERS_PER_LINK = 4;

export function normalizeTaxiAddress(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isSameTaxiRoute(
  a: { pickup_address: string; dropoff_address: string },
  b: { pickup_address: string; dropoff_address: string }
): boolean {
  return (
    normalizeTaxiAddress(a.pickup_address) === normalizeTaxiAddress(b.pickup_address) &&
    normalizeTaxiAddress(a.dropoff_address) === normalizeTaxiAddress(b.dropoff_address)
  );
}

/** Keep only the newest MAX_TAXI_ORDERS_PER_LINK rows per customer link. */
export async function pruneTaxiOrders(supabase: SupabaseClient, linkId: string): Promise<void> {
  const { data: rows, error } = await supabase
    .from('taxi_link_orders')
    .select('id')
    .eq('link_id', linkId)
    .order('created_at', { ascending: false });

  if (error || !rows || rows.length <= MAX_TAXI_ORDERS_PER_LINK) return;

  const idsToDelete = rows.slice(MAX_TAXI_ORDERS_PER_LINK).map((r) => r.id);
  await supabase.from('taxi_link_orders').delete().in('id', idsToDelete);
}

export async function insertTaxiOrderIfNew(
  supabase: SupabaseClient,
  linkId: string,
  payload: {
    pickup_address: string;
    dropoff_address: string;
    pickup_lat: number | null;
    pickup_lng: number | null;
    dropoff_lat: number | null;
    dropoff_lng: number | null;
  }
): Promise<{ order: Record<string, unknown>; duplicate: boolean }> {
  const { data: latest } = await supabase
    .from('taxi_link_orders')
    .select('*')
    .eq('link_id', linkId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest && isSameTaxiRoute(latest, payload)) {
    return { order: latest, duplicate: true };
  }

  const { data, error } = await supabase
    .from('taxi_link_orders')
    .insert({ link_id: linkId, ...payload, status: 'saved' })
    .select('*')
    .single();

  if (error) throw error;

  await pruneTaxiOrders(supabase, linkId);
  return { order: data, duplicate: false };
}
