import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const MAX_TAXI_ORDERS_PER_LINK = 4;

/** Opaque id from bot link (?id=…). Must be hard to guess. */
const LINK_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{7,127}$/;

function validateLinkId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return LINK_ID_RE.test(trimmed) ? trimmed : null;
}

function nullableNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

type SessionRow = {
  link_id: string;
  wa_id: string | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  pickup_country_code: string | null;
  step: string | null;
};

function rowToDraft(row: SessionRow) {
  return {
    linkId: row.link_id,
    waId: row.wa_id,
    pickupAddress: row.pickup_address || '',
    dropoffAddress: row.dropoff_address || '',
    pickupCoords:
      row.pickup_lat != null && row.pickup_lng != null
        ? { lat: row.pickup_lat, lng: row.pickup_lng }
        : null,
    dropoffCoords:
      row.dropoff_lat != null && row.dropoff_lng != null
        ? { lat: row.dropoff_lat, lng: row.dropoff_lng }
        : null,
    pickupCountryCode: row.pickup_country_code,
    step: row.step,
    updatedAt: null as string | null,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({ error: 'Supabase not configured on server' });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (req.method === 'GET') {
    const linkId = validateLinkId(req.query.link_id);
    if (!linkId) {
      return res.status(400).json({ error: 'Invalid or missing link_id' });
    }

    const { data, error } = await supabase
      .from('taxi_link_sessions')
      .select('*')
      .eq('link_id', linkId)
      .maybeSingle();

    if (error) {
      console.error('[taxi-session] GET', error);
      return res.status(500).json({ error: error.message });
    }

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

    if (ordersRes.error) console.warn('[taxi-session] orders', ordersRes.error.message);
    if (favoritesRes.error) console.warn('[taxi-session] favorites', favoritesRes.error.message);

    if (!data) {
      return res.status(200).json({
        session: null,
        orders: ordersRes.data ?? [],
        favorites: favoritesRes.data ?? [],
      });
    }

    return res.status(200).json({
      session: rowToDraft(data as SessionRow),
      orders: ordersRes.data ?? [],
      favorites: favoritesRes.data ?? [],
    });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const linkId = validateLinkId(body.link_id);
    if (!linkId) {
      return res.status(400).json({ error: 'Invalid or missing link_id' });
    }

    const waId = typeof body.wa_id === 'string' && body.wa_id.trim() ? body.wa_id.trim() : null;
    const step =
      body.step === 'select_dropoff' || body.step === 'confirm_ride' || body.step === 'select_pickup'
        ? body.step
        : 'select_pickup';

    const payload: Record<string, unknown> = {
      link_id: linkId,
      step,
      pickup_address: typeof body.pickup_address === 'string' ? body.pickup_address : '',
      dropoff_address: typeof body.dropoff_address === 'string' ? body.dropoff_address : '',
      pickup_country_code:
        typeof body.pickup_country_code === 'string' ? body.pickup_country_code : null,
    };

    if (waId) payload.wa_id = waId;

    payload.pickup_lat = nullableNumber(body.pickup_lat);
    payload.pickup_lng = nullableNumber(body.pickup_lng);
    payload.dropoff_lat = nullableNumber(body.dropoff_lat);
    payload.dropoff_lng = nullableNumber(body.dropoff_lng);

    const { data, error } = await supabase
      .from('taxi_link_sessions')
      .upsert(payload, { onConflict: 'link_id' })
      .select('*')
      .single();

    if (error) {
      console.error('[taxi-session] POST', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ session: rowToDraft(data as SessionRow) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[taxi-session] unhandled', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Server error' });
  }
}
