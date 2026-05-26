/**
 * eSIM Account Service (read-only)
 * =================================
 * `bot.eydost.az`-a Vercel proxy (`/api/esim-proxy`) vasitəsilə müraciət.
 *
 * Stabil identifikator: `whatsapp_user_id` (qısa: `wa_id`).
 * `x-api-key` brauzerdə YOXDUR — yalnız serverdə (Vercel function env-də).
 *
 * Sayt yalnız müştərinin sifariş/balans məlumatını göstərir; satış və ödəniş
 * WhatsApp botunda baş verir, ona görə də burada heç bir create-order/payment
 * çağırışı yoxdur.
 *
 * Backend OpenAPI: https://bot.eydost.az/openapi.json
 */

const PROXY_BASE = '/api/esim-proxy';

// ── Backend modelləri (Swagger-dən kopyalanmışdır) ─────────────────────────────

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { message: string };
}

export interface OrderResponse {
  id: number;
  status: string;
  order_type: string;
  country_code: string;
  package_code: string;
  currency?: string | null;
  sell_price?: string | null;
  transaction_id: string;
  provider_order_no?: string | null;
}

export interface EsimResponse {
  id: number;
  iccid?: string | null;
  esim_tran_no?: string | null;
  qr_code_url?: string | null;
  short_url?: string | null;
  activation_code?: string | null;
  smdp_address?: string | null;
  pin?: string | null;
  puk?: string | null;
  apn?: string | null;
  status?: string | null;
}

export interface UsageResponse {
  total_volume?: string | number | null;
  used_volume?: string | number | null;
  remain_volume?: string | number | null;
  expired_time?: string | null;
  status?: string | null;
}

// ── Aşağı səviyyəli helper ────────────────────────────────────────────────────

class EsimApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'EsimApiError';
  }
}

async function callProxy<T>(
  endpoint: string,
  params: Record<string, string | undefined>,
): Promise<T> {
  const search = new URLSearchParams({ endpoint });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') search.set(k, v);
  }

  const res = await fetch(`${PROXY_BASE}?${search.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  let json: ApiEnvelope<T> | { error?: { message?: string } } | null = null;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || !json || (json as ApiEnvelope<T>).success === false) {
    const message =
      (json as ApiEnvelope<T>)?.error?.message ||
      (json as { error?: { message?: string } })?.error?.message ||
      `Request failed (${res.status})`;
    throw new EsimApiError(message, res.status);
  }

  return (json as ApiEnvelope<T>).data;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Bütün eSIM-lər (aktiv + keçmiş). Backend `/customers/by-wa/{wa_id}/esims`. */
export function getCustomerEsims(waId: string): Promise<EsimResponse[]> {
  return callProxy<EsimResponse[]>('customer-esims', { wa_id: waId });
}

/** Bütün sifarişlər. Backend `/customers/by-wa/{wa_id}/orders`. */
export function getCustomerOrders(waId: string): Promise<OrderResponse[]> {
  return callProxy<OrderResponse[]>('customer-orders', { wa_id: waId });
}

/** Bir eSIM üçün istifadə statistikası (qalan trafik / gün). */
export function getEsimUsage(esimId: number | string, waId?: string): Promise<UsageResponse> {
  return callProxy<UsageResponse>('esim-usage', {
    esim_id: String(esimId),
    wa_id: waId,
  });
}

// ── eSIM bot WhatsApp linki (yeni paket almaq üçün) ───────────────────────────

export const ESIM_BOT_WHATSAPP_NUMBER = '994992010117';
export const ESIM_BOT_WHATSAPP_URL = `https://wa.me/${ESIM_BOT_WHATSAPP_NUMBER}`;

// ── Backwards-compatible export ───────────────────────────────────────────────

export { EsimApiError };
