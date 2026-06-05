import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

type AuthResult = { ok: true } | { ok: false; status: number; message: string };

async function verifyAdmin(req: VercelRequest): Promise<AuthResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, status: 500, message: 'Supabase env not configured' };
  }

  const auth = req.headers.authorization;
  const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return { ok: false, status: 401, message: 'Missing bearer token' };

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { ok: false, status: 401, message: 'Invalid session' };

  const role = (data.user.app_metadata as Record<string, unknown> | undefined)?.role;
  if (role !== 'admin') return { ok: false, status: 403, message: 'Admin role required' };

  return { ok: true };
}

function textToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function parseRecipients(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifyAdmin(req);
  if (auth.ok !== true) return res.status(auth.status).json({ error: auth.message });

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const mailFrom = process.env.MAIL_FROM || (smtpUser ? `Ey Dost <${smtpUser}>` : '');

  if (!smtpHost || !smtpUser || !smtpPass || !mailFrom) {
    return res.status(500).json({ error: 'SMTP env not configured' });
  }

  const to = parseRecipients(req.body?.to);
  const cc = parseRecipients(req.body?.cc);
  const bcc = parseRecipients(req.body?.bcc);
  const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
  const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';
  const replyTo = typeof req.body?.replyTo === 'string' && req.body.replyTo.trim() ? req.body.replyTo.trim() : smtpUser;

  if (to.length === 0) return res.status(400).json({ error: 'Recipient is required' });
  if (!subject) return res.status(400).json({ error: 'Subject is required' });
  if (!body) return res.status(400).json({ error: 'Body is required' });

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: mailFrom,
      to,
      cc: cc.length ? cc : undefined,
      bcc: bcc.length ? bcc : undefined,
      replyTo,
      subject,
      text: body,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#111827">${textToHtml(body)}</div>`,
    });

    return res.status(200).json({
      ok: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
  } catch (err) {
    console.error('[send-outreach-email] SMTP error', err);
    return res.status(502).json({ error: err instanceof Error ? err.message : 'SMTP send failed' });
  }
}
