import type { VercelRequest, VercelResponse } from '@vercel/node';
import { botApiConfigured, callBotAgentApi, normalizeAgent, pickAgentToken } from './_bot-agent';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!botApiConfigured()) {
    return res.status(500).json({ error: 'Bot API env not configured' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  const accessCode = String(req.body?.accessCode || req.body?.password || '').trim();

  if (!email || !accessCode) {
    return res.status(400).json({ error: 'Email and access code are required' });
  }

  try {
    const payload = await callBotAgentApi('/api/agents/login', {
      method: 'POST',
      body: {
        email,
        password: accessCode,
      },
    });

    const agentToken = pickAgentToken(payload);
    const agent = normalizeAgent(payload, { email });

    if (!agentToken) {
      return res.status(502).json({ error: 'Agent token did not return from bot API' });
    }

    return res.status(200).json({ agent, agentToken });
  } catch (error: any) {
    return res.status(401).json({ error: error?.message || 'Giris alinmadi' });
  }
}
