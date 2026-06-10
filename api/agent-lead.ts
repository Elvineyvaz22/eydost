import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function clean(value: unknown, max = 220) {
  return String(value || '').trim().slice(0, max);
}

function firstHeader(req: VercelRequest, name: string) {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function getGeo(req: VercelRequest) {
  const country = clean(
    firstHeader(req, 'x-vercel-ip-country') ||
      firstHeader(req, 'cf-ipcountry') ||
      firstHeader(req, 'x-country-code'),
    40
  );
  const region = clean(firstHeader(req, 'x-vercel-ip-country-region'), 80);
  const city = clean(firstHeader(req, 'x-vercel-ip-city'), 80);
  return [country, region, city].filter(Boolean).join(' / ');
}

function normalizeSource(value: string) {
  const v = clean(value, 80).toLowerCase();
  if (!v) return '';
  if (v.includes('instagram.com') || v.includes('l.instagram.com')) return 'instagram';
  if (v.includes('linktr.ee')) return 'linktree';
  if (v.includes('tiktok.com')) return 'tiktok';
  if (v.includes('wa.me') || v.includes('whatsapp.com') || v.includes('l.whatsapp.com')) return 'whatsapp';
  if (v.includes('facebook.com') || v.includes('l.facebook.com')) return 'facebook';
  return v.replace(/^www\./, '').slice(0, 80);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase env not configured' });
  }

  const referralCode = clean(req.body?.referralCode || req.body?.ref, 64).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!referralCode) {
    return res.status(400).json({ error: 'referralCode is required' });
  }

  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('id, status')
    .eq('referral_code', referralCode)
    .maybeSingle();

  if (agentError) return res.status(500).json({ error: agentError.message });
  if (!agent || agent.status !== 'active') {
    return res.status(200).json({ ok: false, ignored: true });
  }

  const packageCode = clean(req.body?.packageCode || req.body?.code, 80);
  const packageName = clean(req.body?.packageName, 120);
  const viewedPackage = clean(req.body?.viewedPackage, 160);
  const page = clean(req.body?.page, 160);
  const deviceType = clean(req.body?.deviceType, 30);
  const browserLanguage = clean(req.body?.browserLanguage, 40);
  const referrer = clean(req.body?.referrer, 180);
  const utmSource = normalizeSource(clean(req.body?.utmSource, 80)) || normalizeSource(referrer);
  const utmMedium = clean(req.body?.utmMedium, 80);
  const utmCampaign = clean(req.body?.utmCampaign, 120);
  const geo = getGeo(req);

  const notes = [
    packageCode ? `Package code: ${packageCode}` : '',
    packageName ? `Package: ${packageName}` : '',
    viewedPackage ? `Viewed package: ${viewedPackage}` : '',
    page ? `Page: ${page}` : '',
    deviceType ? `Device: ${deviceType}` : '',
    browserLanguage ? `Language: ${browserLanguage}` : '',
    utmSource ? `Source: ${utmSource}` : '',
    utmMedium ? `Medium: ${utmMedium}` : '',
    utmCampaign ? `Campaign: ${utmCampaign}` : '',
    geo ? `Geo: ${geo}` : '',
    referrer ? `Referrer: ${referrer}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const { data, error } = await supabase
    .from('agent_referrals')
    .insert({
      agent_id: agent.id,
      customer_name: null,
      customer_contact: null,
      product_type: 'esim',
      order_reference: null,
      sale_amount: 0,
      commission_amount: 0,
      status: 'lead',
      notes: notes || null,
    })
    .select('id')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true, id: data.id });
}
