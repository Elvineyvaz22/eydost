/**
 * WhatsApp integration utility.
 * Handles wa_id tracking and direct ordering via backend API.
 */

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

export type CreateOrderResult = {
  status?: string;
  success?: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
};

export function orderSucceeded(result: CreateOrderResult): boolean {
  return result.status !== 'error' && result.success !== false && !result.error;
}

export const createOrder = async (data: {
  wa_id: string;
  type: 'esim' | 'taxi';
  code?: string;
  id?: string;
  details?: string;
}): Promise<CreateOrderResult> => {
  try {
    const response = await fetch('/api/whatsapp/order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json() as CreateOrderResult
      : null;

    if (!response.ok) {
      return {
        status: 'error',
        message: payload?.message || payload?.error || `Order API failed with ${response.status}`,
      };
    }

    if (!payload) {
      return { status: 'error', message: 'Order API returned an invalid response' };
    }

    if (!orderSucceeded(payload)) {
      return {
        status: 'error',
        message: payload.message || payload.error || 'Order API rejected the request',
      };
    }

    return payload;
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
