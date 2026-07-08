function clean(value: unknown, max = 200) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function resolveBotId() {
  return clean(process.env.TAXIBOOKER_BOT_ID || process.env.TAXIBOOKER_BSQD_BOT_ID, 80);
}

function resolveToken() {
  return clean(process.env.TAXIBOOKER_API_TOKEN || process.env.TAXIBOOKER_BSQD_TOKEN, 500);
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestOnce(url: string, method: 'POST' | 'PUT', body: Record<string, unknown>, token: string) {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const parsed = text ? safeJson(text) : null;
  return {
    ok: response.ok,
    status: response.status,
    body: parsed,
  };
}

async function postThenPut(url: string, body: Record<string, unknown>) {
  const token = resolveToken();
  const botId = resolveBotId();
  if (!token) {
    return {
      ok: false,
      status: 500,
      body: { error: 'TAXIBOOKER_API_TOKEN not configured' },
      attempted: [],
    };
  }
  if (!botId) {
    return {
      ok: false,
      status: 500,
      body: { error: 'TAXIBOOKER_BOT_ID not configured' },
      attempted: [],
    };
  }

  const attempts: Array<{ method: 'POST' | 'PUT'; status: number; body: unknown }> = [];
  const methods: Array<'POST' | 'PUT'> = ['POST', 'PUT'];

  for (const method of methods) {
    try {
      const first = await requestOnce(url, method, body, token);
      attempts.push({ method, status: first.status, body: first.body });
      console.log('[taxibooker] outbound', { url, method, status: first.status, body: first.body });

      if (first.ok) {
        return { ok: true, status: first.status, body: first.body, attempted: attempts };
      }

      if (first.status === 404 || first.status === 405) {
        continue;
      }

      return { ok: false, status: first.status, body: first.body, attempted: attempts };
    } catch (error) {
      attempts.push({ method, status: 0, body: error instanceof Error ? error.message : String(error) });
      console.warn('[taxibooker] outbound network error', { url, method, error });
      await sleep(250);
      try {
        const retry = await requestOnce(url, method, body, token);
        attempts.push({ method, status: retry.status, body: retry.body });
        console.log('[taxibooker] outbound retry', { url, method, status: retry.status, body: retry.body });

        if (retry.ok) {
          return { ok: true, status: retry.status, body: retry.body, attempted: attempts };
        }
        if (retry.status === 404 || retry.status === 405) {
          continue;
        }
        return { ok: false, status: retry.status, body: retry.body, attempted: attempts };
      } catch (retryError) {
        attempts.push({ method, status: 0, body: retryError instanceof Error ? retryError.message : String(retryError) });
        console.error('[taxibooker] outbound retry failed', { url, method, retryError });
      }
    }
  }

  return {
    ok: false,
    status: attempts.at(-1)?.status || 502,
    body: attempts.at(-1)?.body || { error: 'Taxibooker sync failed' },
    attempted: attempts,
  };
}

export function buildAffiliateEndpoint(eventName: 'affiliate_PUT' | 'affiliate_DEL') {
  return `https://bsqd.me/api/bot/${resolveBotId()}/master/event/${eventName}`;
}

export async function syncAffiliateCode(affiliateCode: string, expireDate?: string) {
  const endpoint = buildAffiliateEndpoint('affiliate_PUT');
  return postThenPut(endpoint, {
    affiliate_code: clean(affiliateCode, 80).replace(/[^a-zA-Z0-9_-]/g, ''),
    expire_date: clean(expireDate || '', 20) || undefined,
  });
}

export async function deleteAffiliateCode(affiliateCode: string) {
  const endpoint = buildAffiliateEndpoint('affiliate_DEL');
  return postThenPut(endpoint, {
    affiliate_code: clean(affiliateCode, 80).replace(/[^a-zA-Z0-9_-]/g, ''),
  });
}
