import type { VercelRequest, VercelResponse } from '@vercel/node';
import { botApiConfigured, callBotAgentApi, normalizeAgent, pickAgentToken } from '../src/server/botAgent';

function clean(value: unknown, max = 160) {
  return String(value || '').trim().slice(0, max);
}

function isStrongAccessCode(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!botApiConfigured()) {
    return res.status(500).json({ error: 'Bot API env not configured' });
  }

  const fullName = clean(req.body?.fullName || req.body?.full_name);
  const companyName = clean(req.body?.companyName || req.body?.company_name);
  const email = clean(req.body?.email).toLowerCase();
  const phoneNumber = clean(req.body?.phoneNumber || req.body?.phone_number, 50);
  const accessCode = clean(req.body?.accessCode || req.body?.password, 80);
  const partnerType = clean(req.body?.partnerType || req.body?.partner_type || 'agency', 40) || 'agency';

  if (!fullName || !companyName || !email || !phoneNumber || !accessCode) {
    return res.status(400).json({ error: 'Ad, sirket adi, telefon, email ve giris kodu teleb olunur' });
  }

  if (!isStrongAccessCode(accessCode)) {
    return res.status(400).json({ error: 'Giris kodu minimum 8 simvol, 1 boyuk herf ve 1 reqem olmalidir' });
  }

  try {
    const payload = await callBotAgentApi('/api/agents/register', {
      method: 'POST',
      body: {
        full_name: fullName,
        fullName,
        company_name: companyName,
        companyName,
        email,
        phone_number: phoneNumber,
        password: accessCode,
        partner_type: partnerType,
        partnerType,
      },
    });

    let agentToken = pickAgentToken(payload);
    const agent = normalizeAgent(payload, { fullName, companyName, email });

    if (!agentToken) {
      const loginPayload = await callBotAgentApi('/api/agents/login', {
        method: 'POST',
        body: {
          email,
          password: accessCode,
        },
      });
      agentToken = pickAgentToken(loginPayload);
    }

    return res.status(200).json({ agent, agentToken });
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Qeydiyyat alinmadi' });
  }
}
