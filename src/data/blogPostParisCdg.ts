import type { BlogPost } from './blogTypes';
import { parisCdgTransferEn } from './parisCdgTransfer/en';
import { parisCdgTransferAz } from './parisCdgTransfer/az';
import { parisCdgTransferRu } from './parisCdgTransfer/ru';
import { parisCdgTransferTr } from './parisCdgTransfer/tr';
import { parisCdgTransferAr } from './parisCdgTransfer/ar';
import { parisCdgTransferEs } from './parisCdgTransfer/es';
import { parisCdgTransferZh } from './parisCdgTransfer/zh';

export const parisCdgTransferPost: BlogPost = {
  slug: 'paris-cdg-airport-transfer-guide',
  category: 'taxi',
  publishedAt: '2026-05-27',
  readingMinutes: 7,
  en: parisCdgTransferEn,
  az: parisCdgTransferAz,
  ru: parisCdgTransferRu,
  tr: parisCdgTransferTr,
  ar: parisCdgTransferAr,
  es: parisCdgTransferEs,
  zh: parisCdgTransferZh,
};
