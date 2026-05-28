import type { BlogPost } from './blogTypes';
import { globalEsimPlanEn } from './globalEsimPlan/en';
import { globalEsimPlanAz } from './globalEsimPlan/az';
import { globalEsimPlanRu } from './globalEsimPlan/ru';
import { globalEsimPlanTr } from './globalEsimPlan/tr';
import { globalEsimPlanAr } from './globalEsimPlan/ar';
import { globalEsimPlanEs } from './globalEsimPlan/es';
import { globalEsimPlanZh } from './globalEsimPlan/zh';

/** Multilingual — matches TrySoro slug for SEO continuity */
export const globalEsimDataPlanPost: BlogPost = {
  slug: 'what-is-a-global-esim-data-plan',
  category: 'esim',
  publishedAt: '2026-05-28',
  readingMinutes: 9,
  en: globalEsimPlanEn,
  az: globalEsimPlanAz,
  ru: globalEsimPlanRu,
  tr: globalEsimPlanTr,
  ar: globalEsimPlanAr,
  es: globalEsimPlanEs,
  zh: globalEsimPlanZh,
};
