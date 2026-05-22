import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const LINK_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{7,127}$/;
const MAX_TAXI_ORDERS_PER_LINK = 4;

function validateLinkId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return LINK_ID_RE.test(trimmed) ? trimmed : null;
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function normalizeTaxiAddress(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isSameTaxiRoute(
  a: { pickup_address: string; dropoff_address: string },
  b: { pickup_address: string; dropoff_address: string }
): boolean {
  return (
    normalizeTaxiAddress(a.pickup_address) === normalizeTaxiAddress(b.pickup_address) &&
    normalizeTaxiAddress(a.dropoff_address) === normalizeTaxiAddress(b.dropoff_address)
  );
}

async function pruneTaxiOrders(supabase: SupabaseClient, linkId: string): Promise<void> {
  const { data: rows, error } = await supabase
    .from('taxi_link_orders')
    .select('id')
    .eq('link_id', linkId)
    .order('created_at', { ascending: false });

  if (error || !rows || rows.length <= MAX_TAXI_ORDERS_PER_LINK) return;

  const idsToDelete = rows.slice(MAX_TAXI_ORDERS_PER_LINK).map((r) => r.id);
  await supabase.from('taxi_link_orders').delete().in('id', idsToDelete);
}

async function insertTaxiOrderIfNew(
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
) {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase not configured on server' });
    }

    const linkId = validateLinkId(req.query.link_id ?? req.body?.link_id);
    if (!linkId) {
      return res.status(400).json({ error: 'Invalid or missing link_id' });
    }

    if (req.method === 'GET') {
      const [ordersRes, favoritesRes] = await Promise.all([
        supabase
          .from('taxi_link_orders')
          .select('id, pickup_address, dropoff_address, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, status, created_at')
          .eq('link_id', linkId)
          .order('created_at', { ascending: false })
          .limit(MAX_TAXI_ORDERS_PER_LINK),
        supabase
          .from('taxi_link_favorites')
          .select('id, label, address, lat, lng, kind, created_at')
          .eq('link_id', linkId)
          .order('created_at', { ascending: false })
          .limit(30),
      ]);

      if (ordersRes.error) console.warn('[taxi-link-data] orders', ordersRes.error.message);
      if (favoritesRes.error) console.warn('[taxi-link-data] favorites', favoritesRes.error.message);

      return res.status(200).json({
        orders: ordersRes.error ? [] : ordersRes.data ?? [],
        favorites: favoritesRes.error ? [] : favoritesRes.data ?? [],
      });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const action = body.action as string;

      if (action === 'add_order') {
        const { order, duplicate } = await insertTaxiOrderIfNew(supabase, linkId, {
          pickup_address: String(body.pickup_address ?? ''),
          dropoff_address: String(body.dropoff_address ?? ''),
          pickup_lat: body.pickup_lat != null ? Number(body.pickup_lat) : null,
          pickup_lng: body.pickup_lng != null ? Number(body.pickup_lng) : null,
          dropoff_lat: body.dropoff_lat != null ? Number(body.dropoff_lat) : null,
          dropoff_lng: body.dropoff_lng != null ? Number(body.dropoff_lng) : null,
        });
        return res.status(200).json({ order, duplicate });
      }

      if (action === 'add_favorite') {
        const address = String(body.address ?? '').trim();
        if (!address) return res.status(400).json({ error: 'address required' });

        const kind =
          body.kind === 'home' || body.kind === 'work' || body.kind === 'pickup' || body.kind === 'dropoff'
            ? body.kind
            : 'other';

        const { data, error } = await supabase
          .from('taxi_link_favorites')
          .insert({
            link_id: linkId,
            label: String(body.label ?? '').trim() || address.split(',')[0],
            address,
            lat: body.lat != null ? Number(body.lat) : null,
            lng: body.lng != null ? Number(body.lng) : null,
            kind,
          })
          .select('*')
          .single();

        if (error) {
          console.error('[taxi-link-data] add_favorite', error);
          return res.status(500).json({ error: error.message });
        }
        return res.status(200).json({ favorite: data });
      }

      return res.status(400).json({ error: 'Unknown action' });
    }

    if (req.method === 'DELETE') {
      const favoriteId = typeof req.query.favorite_id === 'string' ? req.query.favorite_id : null;
      if (!favoriteId) return res.status(400).json({ error: 'favorite_id required' });

      const { error } = await supabase
        .from('taxi_link_favorites')
        .delete()
        .eq('id', favoriteId)
        .eq('link_id', linkId);

      if (error) {
        console.error('[taxi-link-data] DELETE', error);
        return res.status(500).json({ error: error.message });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[taxi-link-data] unhandled', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' });
  }
}
