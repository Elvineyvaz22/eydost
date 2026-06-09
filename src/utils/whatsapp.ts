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

export const getReferralCode = (): string | null => {
  const storageKey = 'eydost_referral_code';
  const expiresKey = 'eydost_referral_expires_at';
  const params = new URLSearchParams(window.location.search);
  const rawRef =
    params.get('ref') ||
    params.get('referral') ||
    params.get('partner') ||
    params.get('discount');

  if (rawRef) {
    const ref = rawRef.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    if (ref) {
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem(storageKey, ref);
      localStorage.setItem(expiresKey, String(expiresAt));
      sessionStorage.setItem(storageKey, ref);
      return ref;
    }
  }

  const sessionRef = sessionStorage.getItem(storageKey);
  if (sessionRef) return sessionRef;

  const savedRef = localStorage.getItem(storageKey);
  const expiresAt = Number(localStorage.getItem(expiresKey) || 0);

  if (savedRef && expiresAt > Date.now()) {
    sessionStorage.setItem(storageKey, savedRef);
    return savedRef;
  }

  localStorage.removeItem(storageKey);
  localStorage.removeItem(expiresKey);
  return null;
};

export const getTrafficSource = (): string | null => {
  const storageKey = 'eydost_traffic_source';
  const expiresKey = 'eydost_traffic_source_expires_at';
  const params = new URLSearchParams(window.location.search);
  const rawSource =
    params.get('utm_source') ||
    params.get('source') ||
    params.get('referrer_source') ||
    params.get('channel');

  if (rawSource) {
    const source = rawSource.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    if (source) {
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem(storageKey, source);
      localStorage.setItem(expiresKey, String(expiresAt));
      sessionStorage.setItem(storageKey, source);
      return source;
    }
  }

  const sessionSource = sessionStorage.getItem(storageKey);
  if (sessionSource) return sessionSource;

  const savedSource = localStorage.getItem(storageKey);
  const expiresAt = Number(localStorage.getItem(expiresKey) || 0);

  if (savedSource && expiresAt > Date.now()) {
    sessionStorage.setItem(storageKey, savedSource);
    return savedSource;
  }

  localStorage.removeItem(storageKey);
  localStorage.removeItem(expiresKey);
  return null;
};

export const getTrafficMedium = (): string | null => {
  const storageKey = 'eydost_traffic_medium';
  const expiresKey = 'eydost_traffic_medium_expires_at';
  const params = new URLSearchParams(window.location.search);
  const rawMedium = params.get('utm_medium') || params.get('medium');

  if (rawMedium) {
    const medium = rawMedium.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    if (medium) {
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem(storageKey, medium);
      localStorage.setItem(expiresKey, String(expiresAt));
      sessionStorage.setItem(storageKey, medium);
      return medium;
    }
  }

  const sessionMedium = sessionStorage.getItem(storageKey);
  if (sessionMedium) return sessionMedium;

  const savedMedium = localStorage.getItem(storageKey);
  const expiresAt = Number(localStorage.getItem(expiresKey) || 0);

  if (savedMedium && expiresAt > Date.now()) {
    sessionStorage.setItem(storageKey, savedMedium);
    return savedMedium;
  }

  localStorage.removeItem(storageKey);
  localStorage.removeItem(expiresKey);
  return null;
};

export const getTrafficCampaign = (): string | null => {
  const storageKey = 'eydost_traffic_campaign';
  const expiresKey = 'eydost_traffic_campaign_expires_at';
  const params = new URLSearchParams(window.location.search);
  const rawCampaign = params.get('utm_campaign') || params.get('campaign');

  if (rawCampaign) {
    const campaign = rawCampaign.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
    if (campaign) {
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem(storageKey, campaign);
      localStorage.setItem(expiresKey, String(expiresAt));
      sessionStorage.setItem(storageKey, campaign);
      return campaign;
    }
  }

  const sessionCampaign = sessionStorage.getItem(storageKey);
  if (sessionCampaign) return sessionCampaign;

  const savedCampaign = localStorage.getItem(storageKey);
  const expiresAt = Number(localStorage.getItem(expiresKey) || 0);

  if (savedCampaign && expiresAt > Date.now()) {
    sessionStorage.setItem(storageKey, savedCampaign);
    return savedCampaign;
  }

  localStorage.removeItem(storageKey);
  localStorage.removeItem(expiresKey);
  return null;
};

export const getTrafficReferrerHost = (): string | null => {
  try {
    const referrer = document.referrer || '';
    if (!referrer) return null;
    const host = new URL(referrer).hostname.toLowerCase();
    if (!host) return null;

    if (host.includes('instagram.com') || host.includes('l.instagram.com')) return 'instagram';
    if (host.includes('linktr.ee')) return 'linktree';
    if (host.includes('tiktok.com')) return 'tiktok';
    if (host.includes('wa.me') || host.includes('whatsapp.com') || host.includes('l.whatsapp.com')) return 'whatsapp';
    if (host.includes('facebook.com') || host.includes('l.facebook.com')) return 'facebook';
    return host.replace(/^www\./, '').slice(0, 80);
  } catch {
    return null;
  }
};

export const appendReferralToMessage = (message: string, language = 'az'): string => {
  const ref = getReferralCode();
  if (!ref) return message;

  const label =
    language === 'az'
      ? 'Endirim kodu'
      : language === 'tr'
        ? 'Indirim kodu'
        : language === 'ru'
          ? 'Promo code'
          : 'Promo code';

  return `${message}\n${label}: ${ref}`;
};

export const trackAgentLead = async (data: {
  productType?: 'esim' | 'taxi' | 'other';
  packageCode?: string;
  packageName?: string;
  viewedPackage?: string;
  page?: string;
} = {}) => {
  const ref = getReferralCode();
  if (!ref) return;
  const source = getTrafficSource() || getTrafficReferrerHost();
  const medium = getTrafficMedium();
  const campaign = getTrafficCampaign();

  try {
    await fetch('/api/agent-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referralCode: ref,
        productType: data.productType || 'esim',
        packageCode: data.packageCode,
        packageName: data.packageName,
        viewedPackage: data.viewedPackage,
        page: data.page || window.location.pathname,
        deviceType: window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768 ? 'mobile' : 'desktop',
        browserLanguage: navigator.language,
        referrer: document.referrer,
        utmSource: source,
        utmMedium: medium,
        utmCampaign: campaign,
      }),
    });
  } catch (error) {
    console.warn('Failed to track agent lead:', error);
  }
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
    return await response.json();
  } catch (error) {
    console.error('Failed to create order:', error);
    return { status: 'error', message: 'Connection failed' };
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
