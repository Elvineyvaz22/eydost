import type { BlogPost } from './blogTypes';
import { bestEsimUaeEn } from './bestEsimUae/en';
import { bestEsimUaeAz } from './bestEsimUae/az';
import { bestEsimUaeRu } from './bestEsimUae/ru';
import { bestEsimUaeTr } from './bestEsimUae/tr';
import { bestEsimUaeAr } from './bestEsimUae/ar';
import { bestEsimUaeEs } from './bestEsimUae/es';
import { bestEsimUaeZh } from './bestEsimUae/zh';

export const bestEsimUaePost: BlogPost = {
  slug: 'best-esim-uae-dubai-2026',
  category: 'esim',
  publishedAt: '2026-05-20',
  readingMinutes: 7,
  en: bestEsimUaeEn,
  az: bestEsimUaeAz,
  ru: bestEsimUaeRu,
  tr: bestEsimUaeTr,
  ar: bestEsimUaeAr,
  es: bestEsimUaeEs,
  zh: bestEsimUaeZh,
};
