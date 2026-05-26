/**
 * eSIM Account Service
 * ====================
 * `bot.eydost.az` API-sinə Vercel proxy (`/api/esim-proxy`) vasitəsilə müraciət.
 *
 * Stabil identifikator: `whatsapp_user_id` (qısa: `wa_id`).
 * `x-api-key` brauzerdə YOXDUR — yalnız serverdə (Vercel function env-də).
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

export interface PackageResponse {
  package_code: string;
  slug?: string | null;
  name: string;
  country_code?: string | null;
  currency: string;
  sell_price: string;
  sell_price_minor: number;
  volume?: string | null;
  duration?: number | null;
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
  init?: { method?: 'GET' | 'POST'; body?: unknown },
): Promise<T> {
  const search = new URLSearchParams({ endpoint });
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') search.set(k, v);
  }

  const res = await fetch(`${PROXY_BASE}?${search.toString()}`, {
    method: init?.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
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

/** Bütün eSIM-lər (aktiv + keçmiş) — backend hələ əlavə etməlidir. */
export function getCustomerEsims(waId: string): Promise<EsimResponse[]> {
  return callProxy<EsimResponse[]>('customer-esims', { wa_id: waId });
}

/** Bütün sifarişlər — backend hələ əlavə etməlidir. */
export function getCustomerOrders(waId: string): Promise<OrderResponse[]> {
  return callProxy<OrderResponse[]>('customer-orders', { wa_id: waId });
}

/** Bir eSIM üçün istifadə statistikası. */
export function getEsimUsage(esimId: number | string, waId?: string): Promise<UsageResponse> {
  return callProxy<UsageResponse>('esim-usage', {
    esim_id: String(esimId),
    wa_id: waId,
  });
}

/** Ölkəyə görə paket kataloqu. */
export function listPackages(
  countryCode: string,
  packageCode?: string,
): Promise<PackageResponse[]> {
  return callProxy<PackageResponse[]>('packages', {
    country_code: countryCode,
    package_code: packageCode,
  });
}

/** Draft order — "Botda ödə" düyməsi üçün. */
export interface DraftOrderInput {
  waId: string;
  countryCode: string;
  packageCode: string;
  languageCode?: string;
  fullName?: string;
}

export function createDraftOrder(input: DraftOrderInput): Promise<OrderResponse> {
  return callProxy<OrderResponse>(
    'create-order',
    { wa_id: input.waId },
    {
      method: 'POST',
      body: {
        country_code: input.countryCode,
        package_code: input.packageCode,
        language_code: input.languageCode,
        full_name: input.fullName,
      },
    },
  );
}

// ── Bota ödəniş üçün yönləndirmə ──────────────────────────────────────────────

export const ESIM_BOT_WHATSAPP_NUMBER = '994992010117';

export function buildPayInBotUrl(orderId: number | string): string {
  const text = encodeURIComponent(`PAY ${orderId}`);
  return `https://wa.me/${ESIM_BOT_WHATSAPP_NUMBER}?text=${text}`;
}

// ── Backwards-compatible export ───────────────────────────────────────────────

export { EsimApiError };
