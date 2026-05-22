import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { insertTaxiOrderIfNew, MAX_TAXI_ORDERS_PER_LINK } from './taxiOrdersDb';

const LINK_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{7,127}$/;

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(204).end();

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

    if (ordersRes.error || favoritesRes.error) {
      console.error('[taxi-link-data] GET', ordersRes.error || favoritesRes.error);
      return res.status(500).json({ error: (ordersRes.error || favoritesRes.error)!.message });
    }

    return res.status(200).json({
      orders: ordersRes.data ?? [],
      favorites: favoritesRes.data ?? [],
    });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const action = body.action as string;

    if (action === 'add_order') {
      try {
        const { order, duplicate } = await insertTaxiOrderIfNew(supabase, linkId, {
          pickup_address: String(body.pickup_address ?? ''),
          dropoff_address: String(body.dropoff_address ?? ''),
          pickup_lat: body.pickup_lat != null ? Number(body.pickup_lat) : null,
          pickup_lng: body.pickup_lng != null ? Number(body.pickup_lng) : null,
          dropoff_lat: body.dropoff_lat != null ? Number(body.dropoff_lat) : null,
          dropoff_lng: body.dropoff_lng != null ? Number(body.dropoff_lng) : null,
        });
        return res.status(200).json({ order, duplicate });
      } catch (error) {
        console.error('[taxi-link-data] add_order', error);
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Insert failed' });
      }
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
}
