import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/** Opaque id from bot link (?id=…). Must be hard to guess. */
const LINK_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{7,127}$/;

function validateLinkId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return LINK_ID_RE.test(trimmed) ? trimmed : null;
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
        .limit(50),
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

    if (body.pickup_lat != null && body.pickup_lng != null) {
      payload.pickup_lat = Number(body.pickup_lat);
      payload.pickup_lng = Number(body.pickup_lng);
    }
    if (body.dropoff_lat != null && body.dropoff_lng != null) {
      payload.dropoff_lat = Number(body.dropoff_lat);
      payload.dropoff_lng = Number(body.dropoff_lng);
    }

    const { data, error } = await supabase
      .from('taxi_link_sessions')
      .upsert(payload, { onConflict: 'link_id' })
      .select('*')
      .single();

    if (error) {
      console.error('[taxi-session] POST', error);
      return res.status(500).json({ error: error.message });
    }

    let order = null;
    if (
      body.save_order === true &&
      typeof body.pickup_address === 'string' &&
      typeof body.dropoff_address === 'string' &&
      body.pickup_address.trim() &&
      body.dropoff_address.trim()
    ) {
      const orderRes = await supabase
        .from('taxi_link_orders')
        .insert({
          link_id: linkId,
          pickup_address: body.pickup_address,
          dropoff_address: body.dropoff_address,
          pickup_lat: body.pickup_lat != null ? Number(body.pickup_lat) : null,
          pickup_lng: body.pickup_lng != null ? Number(body.pickup_lng) : null,
          dropoff_lat: body.dropoff_lat != null ? Number(body.dropoff_lat) : null,
          dropoff_lng: body.dropoff_lng != null ? Number(body.dropoff_lng) : null,
          status: 'saved',
        })
        .select('*')
        .single();
      if (orderRes.error) {
        console.error('[taxi-session] save_order insert failed', orderRes.error);
      } else {
        order = orderRes.data;
      }
    }

    return res.status(200).json({
      session: rowToDraft(data as SessionRow),
      order,
      orderError: order ? null : body.save_order === true ? 'order_insert_failed' : null,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
