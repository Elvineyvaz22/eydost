import type { BlogPost } from './blogTypes';
import { londonHeathrowTaxiEn } from './londonHeathrowTaxi/en';
import { londonHeathrowTaxiAz } from './londonHeathrowTaxi/az';
import { londonHeathrowTaxiRu } from './londonHeathrowTaxi/ru';
import { londonHeathrowTaxiTr } from './londonHeathrowTaxi/tr';
import { londonHeathrowTaxiAr } from './londonHeathrowTaxi/ar';
import { londonHeathrowTaxiEs } from './londonHeathrowTaxi/es';
import { londonHeathrowTaxiZh } from './londonHeathrowTaxi/zh';

export const londonHeathrowTaxiPost: BlogPost = {
  slug: 'london-heathrow-airport-taxi-whatsapp',
  category: 'taxi',
  publishedAt: '2026-05-28',
  readingMinutes: 7,
  en: londonHeathrowTaxiEn,
  az: londonHeathrowTaxiAz,
  ru: londonHeathrowTaxiRu,
  tr: londonHeathrowTaxiTr,
  ar: londonHeathrowTaxiAr,
  es: londonHeathrowTaxiEs,
  zh: londonHeathrowTaxiZh,
};
