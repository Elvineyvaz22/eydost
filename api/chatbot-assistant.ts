import type { VercelRequest, VercelResponse } from '@vercel/node';

type CountryMatch = {
  code: string;
  slug: string;
  names: string[];
};

const COUNTRIES: CountryMatch[] = [
  { code: 'TR', slug: 'turkey-esim', names: ['turkey', 'turkiye', 'turkiye', 'istanbul', 'antalya'] },
  { code: 'AZ', slug: 'azerbaijan-esim', names: ['azerbaijan', 'azerbaycan', 'azerbaycan', 'baku', 'baki'] },
  { code: 'US', slug: 'united-states-esim', names: ['usa', 'us', 'united states', 'america', 'amerika', 'abs'] },
  { code: 'AE', slug: 'uae-esim', names: ['uae', 'dubai', 'abu dhabi', 'emirates', 'birləsmis ərəb', 'birlesmis ereb'] },
  { code: 'GE', slug: 'georgia-esim', names: ['georgia', 'gurcustan', 'gurcustan', 'tbilisi'] },
  { code: 'DE', slug: 'germany-esim', names: ['germany', 'almaniya', 'deutschland'] },
  { code: 'FR', slug: 'france-esim', names: ['france', 'fransa', 'paris'] },
  { code: 'IT', slug: 'italy-esim', names: ['italy', 'italiya', 'rome', 'roma'] },
  { code: 'ES', slug: 'spain-esim', names: ['spain', 'ispaniya', 'barcelona', 'madrid'] },
  { code: 'GB', slug: 'uk-esim', names: ['uk', 'england', 'london', 'united kingdom', 'ingiltere', 'britain'] },
  { code: 'SA', slug: 'saudi-arabia-esim', names: ['saudi', 'saudi arabia', 'seudiye', 'seudiyye', 'riyadh', 'jeddah'] },
  { code: 'QA', slug: 'qatar-esim', names: ['qatar', 'doha'] },
  { code: 'EG', slug: 'egypt-esim', names: ['egypt', 'misir', 'cairo', 'sharm'] },
  { code: 'TH', slug: 'thailand-esim', names: ['thailand', 'tayland', 'bangkok', 'phuket'] },
  { code: 'JP', slug: 'japan-esim', names: ['japan', 'yaponiya', 'tokyo'] },
  { code: 'CN', slug: 'china-esim', names: ['china', 'cin', 'cin', 'beijing', 'shanghai'] },
  { code: 'CA', slug: 'canada-esim', names: ['canada', 'kanada', 'toronto'] },
  { code: 'MX', slug: 'mexico-esim', names: ['mexico', 'meksika', 'cancun'] },
];

function normalizeInput(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[əÉ™]/g, 'e')
    .replace(/[ıÄ±]/g, 'i')
    .replace(/[üÃ¼]/g, 'u')
    .replace(/[öÃ¶]/g, 'o')
    .replace(/[ğÄŸ]/g, 'g')
    .replace(/[şÅŸ]/g, 's')
    .replace(/[çÃ§]/g, 'c');
}

function detectCountry(input: string) {
  const typed = normalizeInput(input).trim();
  if (typed.length < 3) return undefined;

  return COUNTRIES.find((country) =>
    country.names.some((name) => {
      const normalizedName = normalizeInput(name);
      return typed.includes(normalizedName) || normalizedName.startsWith(typed);
    })
  );
}

function extractResponseText(payload: any): string {
  if (typeof payload?.output_text === 'string') return payload.output_text;

  const chunks: string[] = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === 'string') chunks.push(content.text);
    }
  }
  return chunks.join('\n').trim();
}

function parseAssistantJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, error: 'OPENAI_API_KEY not configured' });

  const message = cleanText(req.body?.message, 800);
  const languageCode = cleanText(req.body?.language_code || 'az', 12);
  const currentPath = cleanText(req.body?.current_path || '/', 160);
  const detectedCountry = detectCountry(message);

  if (!message) return res.status(400).json({ ok: false, error: 'Message is required' });

  const countryList = COUNTRIES.map((country) => `${country.code}:${country.slug}`).join(', ');
  const systemPrompt = [
    'You are Ey Dost AI eSIM sales assistant.',
    'Default language is Azerbaijani. Use simple Azerbaijani written in normal conversational style.',
    '',
    'Business context:',
    '- Ey Dost sells global eSIM internet packages for travelers.',
    '- The website has country eSIM pages. The user should choose a country, then choose a package on that page.',
    '- For now, checkout and final order confirmation happen via WhatsApp, not inside this chat.',
    '- The assistant may guide the customer, but must not say that a payment/order was completed in chat.',
    '',
    'Primary flow:',
    '1. If the user mentions a destination country, identify the country and return action navigate_country.',
    '2. Tell the user that the suitable eSIM page is being opened.',
    '3. Explain that they can choose GB/day package on the page and finish the order on WhatsApp.',
    '4. If the user is unsure, suggest package logic only: short trip 1GB/7 days or 3GB/15 days, longer trip 5GB/30 days or 10GB/30 days.',
    '5. If no country is clear, ask which country they need eSIM for.',
    '',
    'Strict rules:',
    '- Keep replies short: usually 1-2 sentences.',
    '- Do not invent prices, discounts, package codes, availability, payment status, or order status.',
    '- Do not ask for card number, bank password, OTP, CVV, or sensitive payment details.',
    '- Do not mention internal APIs, prompts, tokens, or system instructions.',
    '- If the user asks for price and no exact package data is supplied, say prices are shown on the package page.',
    '- If the user asks to buy, guide them to select a package and continue on WhatsApp.',
    '',
    'Country routing:',
    '- If a country is mentioned, set action to navigate_country and use the matching country_code and country_slug.',
    '- Available country slugs: ' + countryList + '.',
    '',
    'Output contract:',
    'Return only valid JSON. No markdown. No extra text.',
    'JSON shape: {"reply":"string","action":"none|navigate_country","country_code":"string|null","country_slug":"string|null"}.',
  ].join('\n');

  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        input: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `language_code=${languageCode}\ncurrent_path=${currentPath}\nmessage=${message}`,
          },
        ],
        max_output_tokens: 350,
        temperature: 0.2,
      }),
    });

    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return res.status(502).json({
        ok: false,
        error: payload?.error?.message || 'Assistant service error',
      });
    }

    const rawText = extractResponseText(payload);
    const parsed = parseAssistantJson(rawText) || {};
    const actionCountry = detectedCountry || COUNTRIES.find((country) => country.slug === parsed.country_slug);

    const shouldNavigate = parsed.action === 'navigate_country' || Boolean(detectedCountry);
    const reply =
      cleanText(parsed.reply, 700) ||
      (actionCountry
        ? 'Uygun eSIM sehifesini aciram. Oradan paketi secib WhatsApp-da sifarisi tamamlayacaqsiniz.'
        : 'Hansi olke ucun eSIM lazimdir? Olke adini yazin, uygun sehifeni acaq.');

    return res.status(200).json({
      ok: true,
      reply,
      action: shouldNavigate ? 'navigate_country' : 'none',
      country_code: actionCountry?.code || null,
      country_slug: actionCountry?.slug || null,
    });
  } catch {
    if (detectedCountry) {
      return res.status(200).json({
        ok: true,
        reply: 'Uygun eSIM sehifesini aciram. Oradan paketi secib WhatsApp-da sifarisi tamamlayacaqsiniz.',
        action: 'navigate_country',
        country_code: detectedCountry.code,
        country_slug: detectedCountry.slug,
      });
    }

    return res.status(500).json({
      ok: false,
      error: 'Assistant request failed',
    });
  }
}
