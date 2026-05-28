/**
 * WhatsApp integration utility.
 * Handles wa_id tracking, direct ordering, and the canonical WhatsApp numbers
 * for each service line (so we never hard-code the same number in two places).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Canonical WhatsApp numbers — ONE source of truth.
// E.164 format (no `+`, no spaces) so they go straight into wa.me/<number>.
// ─────────────────────────────────────────────────────────────────────────────
export const WA_NUMBERS = {
  /** Taxi bookings, ride dispatch, airport transfers — 24/7 multilingual line. */
  taxi: '994992000444',
  /** eSIM purchase, activation help, plan questions — 24/7 multilingual line. */
  esim: '994992010117',
} as const;

/** Pretty-formatted versions of the same numbers, for visible captions. */
export const WA_NUMBERS_PRETTY = {
  taxi: '+994 99 200 04 44',
  esim: '+994 99 201 01 17',
} as const;

export type WaIntent = 'taxi' | 'esim';

/** Build a wa.me deep link for the given service intent, with optional prefilled text. */
export function getWhatsAppLink(intent: WaIntent, prefilledMessage?: string): string {
  const base = `https://wa.me/${WA_NUMBERS[intent]}`;
  if (!prefilledMessage) return base;
  return `${base}?text=${encodeURIComponent(prefilledMessage)}`;
}

/** Get the raw E.164 digits for a given intent (for `tel:` links, JSON-LD, etc.). */
export function getWhatsAppNumber(intent: WaIntent): string {
  return WA_NUMBERS[intent];
}

/** Get the user-facing pretty form (e.g. "+994 99 201 01 17"). */
export function getWhatsAppPretty(intent: WaIntent): string {
  return WA_NUMBERS_PRETTY[intent];
}

/**
 * Pick the right number based on the current pathname.
 *  - eSIM catalog, country/regional eSIM landing pages, eSIM blog posts → eSIM line
 *  - Taxi page, taxi blog posts → taxi line
 *  - Anywhere else (homepage, about, legal, blog index) → eSIM by default,
 *    because eSIM is the higher-volume service. Components that want to show
 *    BOTH numbers should call `getWhatsAppLink('taxi')` and `getWhatsAppLink('esim')`
 *    explicitly instead of using this helper.
 */
export function pickWhatsAppIntent(pathname: string): WaIntent {
  const p = (pathname || '/').toLowerCase();
  if (p === '/taxi' || p.startsWith('/taxi/')) return 'taxi';
  if (p.includes('/blog/') && (p.includes('taxi') || p.includes('ride') || p.includes('airport-transfer'))) {
    return 'taxi';
  }
  if (p === '/esim' || p.endsWith('-esim') || p.includes('/blog/') && p.includes('esim')) {
    return 'esim';
  }
  return 'esim';
}


export const getWaId = (): string | null => {
  // 1. Check URL
  const params = new URLSearchParams(window.location.search);
  const waId = params.get('wa_id');
  
  if (waId) {
    sessionStorage.setItem('eydost_wa_id', waId);
    return waId;
  }
  
  // 2. Check Session
  return sessionStorage.getItem('eydost_wa_id');
};

export const createOrder = async (data: {
  wa_id: string;
  type: 'esim' | 'taxi';
  code?: string;
  id?: string;
  details?: string;
}) => {
  try {
    const response = await fetch('/api/whatsapp/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const contentType = response.headers.get('content-type') ?? '';
    if (!response.ok || !contentType.includes('application/json')) {
      return {
        ok: false,
        status: 'error',
        message: response.ok ? 'Unexpected order response' : `Order failed (${response.status})`,
      };
    }

    const payload = await response.json();
    if (payload?.status === 'error') {
      return { ok: false, ...payload };
    }

    return { ok: true, ...payload };
  } catch (error) {
    console.error('Failed to create order:', error);
    return { ok: false, status: 'error', message: 'Connection failed' };
  }
};

/**
 * Telegram order - birbaşa botun API-sinə göndərir
 * Bot mesajı emal edir və istifadəçiyə ödəniş linki göndərir
 */
export const sendTelegramOrder = async (data: {
  code?: string;
  id?: string;
  country?: string;
  gb?: string;
  days?: string;
  price?: string;
  message?: string;
}) => {
  try {
    // Backend API-yə göndərir - bot oradan istifadəçiyə mesaj göndərir
    const response = await fetch('/api/telegram/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to send Telegram order:', error);
    return { status: 'error', message: 'Connection failed' };
  }
};
