import type { VercelRequest, VercelResponse } from '@vercel/node';
import { botApiConfigured, callBotAgentApi, getAgentTokenFromRequest } from './_bot-agent';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!botApiConfigured()) {
    return res.status(500).json({ error: 'Bot API env not configured' });
  }

  const agentToken = getAgentTokenFromRequest(req);
  if (!agentToken) {
    return res.status(401).json({ error: 'Agent session is required' });
  }

  try {
    const payload = await callBotAgentApi('/api/agents/searches', {
      token: agentToken,
      query: { limit: req.body?.limit || 100 },
    });
    return res.status(200).json(payload);
  } catch (error: any) {
    return res.status(502).json({ error: error?.message || 'Agent searches yuklenmedi' });
  }
}
