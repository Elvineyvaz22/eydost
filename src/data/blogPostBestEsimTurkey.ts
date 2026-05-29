import type { BlogPost } from './blogTypes';
import { bestEsimTurkeyEn } from './bestEsimTurkey/en';
import { bestEsimTurkeyAz } from './bestEsimTurkey/az';
import { bestEsimTurkeyRu } from './bestEsimTurkey/ru';
import { bestEsimTurkeyTr } from './bestEsimTurkey/tr';
import { bestEsimTurkeyAr } from './bestEsimTurkey/ar';
import { bestEsimTurkeyEs } from './bestEsimTurkey/es';
import { bestEsimTurkeyZh } from './bestEsimTurkey/zh';

export const bestEsimTurkeyPost: BlogPost = {
  slug: 'best-esim-turkey-2026',
  category: 'esim',
  publishedAt: '2026-05-28',
  readingMinutes: 7,
  en: bestEsimTurkeyEn,
  az: bestEsimTurkeyAz,
  ru: bestEsimTurkeyRu,
  tr: bestEsimTurkeyTr,
  ar: bestEsimTurkeyAr,
  es: bestEsimTurkeyEs,
  zh: bestEsimTurkeyZh,
};
