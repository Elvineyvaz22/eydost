import type { VercelRequest, VercelResponse } from '@vercel/node';

const schema = {
  openapi: '3.1.0',
  info: {
    title: 'EYDOST eSIM Sales Actions',
    description: 'Read-only eSIM package search tools for EYDOST ChatGPT agent. Prices are returned from EYDOST API and must not be invented.',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'https://eydost.com',
      description: 'EYDOST production API',
    },
  ],
  paths: {
    '/api/chatgpt-esim-packages': {
      get: {
        operationId: 'searchEsimPackages',
        summary: 'Search real eSIM packages',
        description:
          'Returns real EYDOST eSIM packages for a country. Use this before recommending packages or prices. Do not invent package data.',
        parameters: [
          {
            name: 'country',
            in: 'query',
            required: true,
            description: 'Destination country code or name. Examples: TR, Turkey, US.',
            schema: {
              type: 'string',
              examples: ['TR', 'Turkey'],
            },
          },
          {
            name: 'type',
            in: 'query',
            required: false,
            description: 'Package type. standard means fixed total data. daily means data per day.',
            schema: {
              type: 'string',
              enum: ['standard', 'daily'],
            },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Maximum number of packages to return.',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 20,
              default: 8,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Package list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    source: { type: 'string' },
                    country_code: { type: 'string' },
                    currency: { type: 'string' },
                    packages: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          package_code: { type: 'string' },
                          slug: { type: 'string' },
                          country_code: { type: 'string' },
                          name: { type: 'string' },
                          data: { type: 'string' },
                          duration_days: { type: ['integer', 'null'] },
                          type: { type: 'string', enum: ['standard', 'daily'] },
                          unlimited: { type: 'boolean' },
                          currency: { type: 'string' },
                          price_usd: { type: 'number' },
                          price: { type: 'string' },
                        },
                        required: ['package_code', 'name', 'data', 'type', 'currency', 'price_usd', 'price'],
                      },
                    },
                    assistant_note: { type: 'string' },
                  },
                  required: ['ok', 'country_code', 'currency', 'packages'],
                },
              },
            },
          },
        },
      },
    },
    '/api/worldcup-packages': {
      get: {
        operationId: 'searchWorldCupPackages',
        summary: 'Search World Cup 2026 eSIM packages',
        description:
          'Returns campaign packages for World Cup 2026. Currently active for United States only.',
        parameters: [
          {
            name: 'country',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
              enum: ['US'],
            },
          },
          {
            name: 'type',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['standard', 'daily'],
            },
          },
        ],
        responses: {
          '200': {
            description: 'World Cup package list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    campaign: { type: 'string' },
                    country: { type: 'string' },
                    packages: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          country_code: { type: 'string' },
                          country: { type: 'string' },
                          name: { type: 'string' },
                          data: { type: 'string' },
                          days: { type: 'string' },
                          type: { type: 'string' },
                          network: { type: 'string' },
                          currency: { type: 'string' },
                          price_usd: { type: 'number' },
                          price: { type: 'string' },
                        },
                      },
                    },
                  },
                  required: ['ok', 'campaign', 'country', 'packages'],
                },
              },
            },
          },
        },
      },
    },
  },
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  return res.status(200).json(schema);
}
