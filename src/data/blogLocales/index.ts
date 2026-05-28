import type { BlogExtraLocales } from './types';
import { locales as whatIsEsimCompleteGuide } from './what-is-esim-complete-guide';
import { locales as howToInstallEsimIphone } from './how-to-install-esim-iphone';
import { locales as howToInstallEsimAndroid } from './how-to-install-esim-android';
import { locales as bestEuropeEsim2026 } from './best-europe-esim-2026';
import { locales as stayConnectedEuropeWithoutRoaming } from './stay-connected-europe-without-roaming';
import { locales as esimVsRoamingCostComparison } from './esim-vs-roaming-cost-comparison';
import { bestEsimGermany2026Locales } from './best-esim-germany-2026';
import { howToUseEsimFranceLocales } from './how-to-use-esim-france';
import { bookTaxiEuropeWhatsappLocales } from './book-taxi-europe-whatsapp';
import { airportTransferEuropeGuideLocales } from './airport-transfer-europe-guide';

export const BLOG_LOCALES: Record<string, BlogExtraLocales> = {
  'what-is-esim-complete-guide': whatIsEsimCompleteGuide,
  'how-to-install-esim-iphone': howToInstallEsimIphone,
  'how-to-install-esim-android': howToInstallEsimAndroid,
  'best-europe-esim-2026': bestEuropeEsim2026,
  'stay-connected-europe-without-roaming': stayConnectedEuropeWithoutRoaming,
  'esim-vs-roaming-cost-comparison': esimVsRoamingCostComparison,
  'best-esim-germany-2026': bestEsimGermany2026Locales,
  'how-to-use-esim-france': howToUseEsimFranceLocales,
  'book-taxi-europe-whatsapp': bookTaxiEuropeWhatsappLocales,
  'airport-transfer-europe-guide': airportTransferEuropeGuideLocales,
};
