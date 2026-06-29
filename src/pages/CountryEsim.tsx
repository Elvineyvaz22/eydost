import { useParams, Link } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Wifi, Clock, Globe, ChevronRight, Zap, Shield, Infinity as InfinityIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getPackageBySlug } from '../data/esimPackages';
import FlagImage from '../components/FlagImage';
import { appendReferralToMessage, getWaId, createOrder, trackAgentLead } from '../utils/whatsapp';
import { useState, useEffect } from 'react';
import Seo from '../components/Seo';
import { showToast } from '../components/Toast';
import { trackEvent, trackGoogleAdsEsimPurchase, trackTikTokProductEvent, parseUsdPrice, EVENTS } from '../utils/analytics';
import { fetchPublicPackagesForCountry, getCachedPackagesForCountry, countryCodeToFlag, getCountryNameLocalized, formatPrice, formatGB, type ESIMPackageRaw } from '../services/esimApi';

const WA_LINK = 'https://wa.me/994992010117';
const UNLIMITED_DAY_ORDER = [3, 5, 7, 10, 15, 30];
const UNLIMITED_LIMIT_PRIORITY = ['3 GB/Day', '2 GB/Day', '1 GB/Day'];
const MIN_STANDARD_BYTES = 1024 * 1024 * 1024;
const STANDARD_PLAN_LIMIT = 7;

const SLUG_TO_CODE: Record<string, string> = {
  'turkey-esim': 'TR', 'united-states-esim': 'US', 'germany-esim': 'DE',
  'france-esim': 'FR', 'uk-esim': 'GB', 'italy-esim': 'IT', 'spain-esim': 'ES',
  'netherlands-esim': 'NL', 'belgium-esim': 'BE', 'switzerland-esim': 'CH',
  'austria-esim': 'AT', 'poland-esim': 'PL', 'portugal-esim': 'PT', 'sweden-esim': 'SE',
  'norway-esim': 'NO', 'denmark-esim': 'DK', 'finland-esim': 'FI', 'czech-republic-esim': 'CZ',
  'hungary-esim': 'HU', 'romania-esim': 'RO', 'bulgaria-esim': 'BG', 'greece-esim': 'GR',
  'croatia-esim': 'HR', 'slovakia-esim': 'SK', 'slovenia-esim': 'SI', 'estonia-esim': 'EE',
  'latvia-esim': 'LV', 'lithuania-esim': 'LT', 'ireland-esim': 'IE', 'luxembourg-esim': 'LU',
  'malta-esim': 'MT', 'cyprus-esim': 'CY', 'azerbaijan-esim': 'AZ', 'georgia-esim': 'GE',
  'ukraine-esim': 'UA', 'russia-esim': 'RU', 'canada-esim': 'CA', 'mexico-esim': 'MX',
  'brazil-esim': 'BR', 'argentina-esim': 'AR', 'chile-esim': 'CL', 'colombia-esim': 'CO',
  'peru-esim': 'PE', 'china-esim': 'CN', 'japan-esim': 'JP', 'south-korea-esim': 'KR',
  'hong-kong-esim': 'HK', 'taiwan-esim': 'TW', 'singapore-esim': 'SG', 'malaysia-esim': 'MY',
  'thailand-esim': 'TH', 'indonesia-esim': 'ID', 'philippines-esim': 'PH', 'vietnam-esim': 'VN',
  'india-esim': 'IN', 'pakistan-esim': 'PK', 'bangladesh-esim': 'BD', 'sri-lanka-esim': 'LK',
  'australia-esim': 'AU', 'new-zealand-esim': 'NZ', 'uae-esim': 'AE', 'saudi-arabia-esim': 'SA',
  'israel-esim': 'IL', 'jordan-esim': 'JO', 'kuwait-esim': 'KW', 'qatar-esim': 'QA',
  'bahrain-esim': 'BH', 'oman-esim': 'OM', 'lebanon-esim': 'LB', 'egypt-esim': 'EG',
  'south-africa-esim': 'ZA', 'nigeria-esim': 'NG', 'kenya-esim': 'KE', 'ghana-esim': 'GH',
  'tanzania-esim': 'TZ', 'ethiopia-esim': 'ET', 'morocco-esim': 'MA', 'tunisia-esim': 'TN',
  'algeria-esim': 'DZ', 'uganda-esim': 'UG', 'moldova-esim': 'MD', 'iceland-esim': 'IS',
  'albania-esim': 'AL', 'bosnia-esim': 'BA', 'north-macedonia-esim': 'MK', 'serbia-esim': 'RS',
  'montenegro-esim': 'ME',
};

/** Show real API packages (not strict 1/3/5/10 GB tiers — those hid most countries). */
function isDataPlanPackage(p: ESIMPackageRaw): boolean {
  if (p.is_unlimited || isUnlimitedPlan(p.name)) return false;
  if (!p.volume || p.volume <= 0) return false;
  if (!p.sell_price_minor || p.sell_price_minor <= 0) return false;
  return true;
}

function isUnlimitedPlan(name: string): boolean {
  // "GB/Day" and "GB/Day FUP" packages are daily-fenced unlimited — treat as unlimited
  return /GB\/Day/i.test(name);
}

function getUnlimitedDailyLimit(p: ESIMPackageRaw): string {
  const nameMatch = p.name.match(/(\d+(?:[.,]\d+)?)\s*(GB|MB)\s*\/\s*Day/i);
  if (nameMatch) {
    return `${nameMatch[1].replace(',', '.')} ${nameMatch[2].toUpperCase()}/Day`;
  }
  if (p.volume && p.volume > 0) return `${formatGB(p.volume)}/Day`;
  return 'FUP';
}

function limitSortValue(limit: string): number {
  const match = limit.match(/(\d+(?:[.,]\d+)?)\s*(GB|MB)/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const value = Number(match[1].replace(',', '.'));
  return match[2].toUpperCase() === 'GB' ? value * 1024 : value;
}

function sortUnlimitedDays(a: LivePlan, b: LivePlan): number {
  const ai = UNLIMITED_DAY_ORDER.indexOf(a.days);
  const bi = UNLIMITED_DAY_ORDER.indexOf(b.days);
  if (ai !== -1 || bi !== -1) {
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  }
  return a.days - b.days;
}

function standardPlanRank(plan: LivePlan): number {
  const gb = Math.round(plan.gb / (1024 * 1024 * 1024));
  const preferred = [
    [1, 7],
    [3, 15],
    [3, 30],
    [5, 30],
    [10, 30],
    [20, 30],
    [50, 30],
  ];
  const rank = preferred.findIndex(([pgb, days]) => pgb === gb && days === plan.days);
  return rank === -1 ? 1000 + gb + plan.days / 1000 : rank;
}

function normalizeStandardPlans(plans: LivePlan[]): LivePlan[] {
  const bestByTier = new Map<string, LivePlan>();
  for (const plan of plans) {
    if (plan.gb < MIN_STANDARD_BYTES) continue;
    const gb = Math.round((plan.gb / (1024 * 1024 * 1024)) * 10) / 10;
    const key = `${gb}-${plan.days}`;
    const current = bestByTier.get(key);
    if (!current || (plan.priceMinor ?? Number.MAX_SAFE_INTEGER) < (current.priceMinor ?? Number.MAX_SAFE_INTEGER)) {
      bestByTier.set(key, plan);
    }
  }
  return Array.from(bestByTier.values())
    .sort((a, b) => standardPlanRank(a) - standardPlanRank(b) || a.gb - b.gb || a.days - b.days)
    .slice(0, STANDARD_PLAN_LIMIT);
}

interface LivePlan {
  gb: number; // raw volume in bytes
  days: number;
  price: string;
  priceMinor?: number;
  currencyCode?: string;
  code: string;
  id: string;
  isUnlimited: boolean;
  countryCode: string;
  dailyLimit?: string;
  name?: string;
}

function multiplyPlanPrice(plan: LivePlan, days: number): string {
  if (typeof plan.priceMinor === 'number') {
    return formatPrice(plan.priceMinor * days, plan.currencyCode || 'AZN');
  }
  const amount = Number((plan.price || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) && amount > 0 ? `$${(amount * days).toFixed(2)}` : plan.price;
}

// Build a localized WhatsApp order message. Keeps `Code:` and `ID:` as machine
// keys; greeting + labels are translated.
function buildOrderMessage(opts: {
  countryName: string;
  plan: LivePlan;
  language: string;
  unlimited?: boolean;
}): string {
  const language = opts.language;
  const { countryName, plan, unlimited } = opts;
  {
    const copy = {
      az: { greeting: 'Salam! eSIM almaq istəyirəm.', country: 'Ölkə', plan: 'Paket', price: 'Qiymət', day: 'gün', days: 'gün', unlimited: 'Limitsiz' },
      en: { greeting: 'Hi! I want to buy an eSIM.', country: 'Country', plan: 'Plan', price: 'Price', day: 'day', days: 'days', unlimited: 'Unlimited' },
      tr: { greeting: 'Merhaba! eSIM satın almak istiyorum.', country: 'Ülke', plan: 'Paket', price: 'Fiyat', day: 'gün', days: 'gün', unlimited: 'Sınırsız' },
      ru: { greeting: 'Здравствуйте! Я хочу купить eSIM.', country: 'Страна', plan: 'Тариф', price: 'Цена', day: 'день', days: 'дн.', unlimited: 'Безлимит' },
      ar: { greeting: 'مرحبا! أريد شراء eSIM.', country: 'الدولة', plan: 'الباقة', price: 'السعر', day: 'يوم', days: 'أيام', unlimited: 'غير محدود' },
      es: { greeting: '¡Hola! Quiero comprar una eSIM.', country: 'País', plan: 'Plan', price: 'Precio', day: 'día', days: 'días', unlimited: 'Ilimitado' },
      zh: { greeting: '你好！我想购买 eSIM。', country: '国家', plan: '套餐', price: '价格', day: '天', days: '天', unlimited: '无限' },
    } as const;
    const text = copy[language as keyof typeof copy] || copy.en;
    const daysWord = plan.days === 1 ? text.day : text.days;
    let localizedPlanText: string;

    if (unlimited) {
      const dailyLimit = plan.dailyLimit ? ` ${plan.dailyLimit}` : '';
      localizedPlanText = `${text.unlimited}${dailyLimit} · ${plan.days} ${daysWord}`;
    } else {
      const gbBytes = plan.gb;
      const gb = gbBytes / (1024 * 1024 * 1024);
      const volStr = gb >= 1 ? `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB` : `${Math.round(gbBytes / (1024 * 1024))} MB`;
      localizedPlanText = `${volStr} · ${plan.days} ${daysWord}`;
    }

    return [
      text.greeting,
      `${text.country}: ${countryName}`,
      `${text.plan}: ${localizedPlanText}`,
      `${text.price}: ${plan.price}`,
      `Code: ${plan.code}`,
      `ID: ${plan.id}`,
    ].join('\n');
  }
  const az = language === 'az';
  const ru = language === 'ru';
  const tr = language === 'tr';
  const ar = language === 'ar';
  const es = language === 'es';
  const zh = language === 'zh';

  const greeting = az
    ? 'Salam! eSIM almaq istəyirəm.'
    : ru
      ? 'Здравствуйте! Я хочу купить eSIM.'
      : tr
        ? 'Merhaba! eSIM satın almak istiyorum.'
        : ar
          ? 'مرحباً! أريد شراء eSIM.'
          : es
            ? '¡Hola! Quiero comprar una eSIM.'
            : zh
              ? '你好！我想购买 eSIM。'
              : 'Hi! I want to buy an eSIM.';
  const countryLabel = az ? 'Ölkə' : ru ? 'Страна' : tr ? 'Ülke' : ar ? 'الدولة' : es ? 'País' : zh ? '国家' : 'Country';
  const planLabel = az ? 'Paket' : ru ? 'Тариф' : tr ? 'Paket' : ar ? 'الباقة' : es ? 'Plan' : zh ? '套餐' : 'Plan';
  const priceLabel = az ? 'Qiymət' : ru ? 'Цена' : tr ? 'Fiyat' : ar ? 'السعر' : es ? 'Precio' : zh ? '价格' : 'Price';
  const daysWord = az
    ? 'gün'
    : ru
      ? (plan.days === 1 ? 'день' : 'дн.')
      : tr
        ? 'gün'
        : ar
          ? 'يوم'
          : es
            ? (plan.days === 1 ? 'día' : 'días')
            : zh
              ? '天'
              : (plan.days === 1 ? 'day' : 'days');
  const unlimitedWord = az ? 'Limitsiz' : ru ? 'Безлимит' : tr ? 'Sınırsız' : ar ? 'غير محدود' : es ? 'Ilimitado' : zh ? '无限' : 'Unlimited';

  let planText: string;
  if (unlimited) {
    const dailyLimit = plan.dailyLimit ? ` ${plan.dailyLimit}` : '';
    planText = `${unlimitedWord}${dailyLimit} · ${plan.days} ${daysWord}`;
  } else {
    const gbBytes = plan.gb;
    const gb = gbBytes / (1024 * 1024 * 1024);
    const volStr = gb >= 1 ? `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB` : `${Math.round(gbBytes / (1024 * 1024))} MB`;
    planText = `${volStr} · ${plan.days} ${daysWord}`;
  }

  const lines = [
    greeting,
    `${countryLabel}: ${countryName}`,
    `${planLabel}: ${planText}`,
    `${priceLabel}: ${plan.price}`,
    `Code: ${plan.code}`,
    `ID: ${plan.id}`,
  ];
  return lines.join('\n');
}

function LimitedPlanCard({ plan, countryName }: { plan: LivePlan; countryName: string }) {
  const { t, language } = useLanguage();
  const [isOrdering, setIsOrdering] = useState(false);
  const waId = getWaId();
  const isTelegramWebApp = typeof window !== 'undefined' && Boolean((window as any).Telegram?.WebApp?.initData);
  const tg = (window as any).Telegram?.WebApp;

  const handleBuyClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const textMsg = appendReferralToMessage(buildOrderMessage({ countryName, plan, language }), language);

    trackGoogleAdsEsimPurchase({
      transactionId: plan.id || plan.code,
      value: parseUsdPrice(plan.price),
    });
    trackEvent(EVENTS.WHATSAPP_ESIM_ORDER, { code: plan.code, id: plan.id });
    trackTikTokProductEvent('InitiateCheckout', {
      contentId: plan.id || plan.code,
      contentName: plan.name || `${countryName} eSIM ${formatGB(plan.gb)} ${plan.days} days`,
      value: parseUsdPrice(plan.price),
      eventId: `checkout_${plan.id || plan.code}_${Date.now()}`,
    });
    trackAgentLead({
      productType: 'esim',
      eventType: 'whatsapp_click',
      packageCode: plan.code || plan.id,
      packageName: countryName,
      viewedPackage: `${countryName} eSIM · ${formatGB(plan.gb)} · ${plan.days} gün · ${plan.price}`,
      page: window.location.pathname,
    });

    if (isTelegramWebApp && tg) {
      tg.sendData(textMsg);
      tg.close();
      return;
    }

    if (waId) {
      setIsOrdering(true);
      try {
        // Include localized message so the backend/bot doesn't default to English.
        await createOrder({ wa_id: waId, type: 'esim', code: plan.code, details: textMsg });
        showToast(
          language === 'az'
            ? 'Sifarişiniz WhatsApp-a göndərildi! Zəhmət olmasa çat bölməsinə qayıdın.'
            : language === 'ru'
              ? 'Ваш заказ отправлен в WhatsApp! Пожалуйста, вернитесь в чат.'
              : language === 'tr'
                ? 'Siparişiniz WhatsApp’a gönderildi! Lütfen sohbetinize geri dönün.'
                : language === 'ar'
                  ? 'تم إرسال طلبك إلى واتساب! الرجاء العودة إلى الدردشة.'
                  : language === 'es'
                    ? '¡Tu pedido se envió a WhatsApp! Vuelve al chat.'
                    : language === 'zh'
                      ? '你的订单已发送到 WhatsApp！请返回聊天。'
                      : 'Your order has been sent to WhatsApp! Please return to your chat.',
        );
      } finally {
        setIsOrdering(false);
      }
    } else {
      window.location.href = WA_LINK + "?text=" + encodeURIComponent(textMsg);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-xl transition-all duration-300 group flex flex-col h-full sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">4G / 5G Speed</div>
          <div className="text-xs text-gray-400">Auto-activate</div>
        </div>
      </div>
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Wifi className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t.countryEsim.data}</p>
            <p className="text-sm font-bold text-gray-900">{formatGB(plan.gb)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <Clock className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t.countryEsim.validity}</p>
            <p className="text-sm font-bold text-gray-900">{plan.days} {t.esimPackages.days}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <Globe className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t.countryEsim.coverage}</p>
            <p className="text-sm font-bold text-gray-900 truncate max-w-[140px]">{countryName}</p>
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <button
          onClick={handleBuyClick}
          className={"flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 text-white " +
            (isTelegramWebApp ? 'bg-[#24A1DE] hover:bg-[#1f8ec4]' : 'bg-[#25D366] hover:bg-[#20bd5a]') +
            (isOrdering ? 'opacity-70 cursor-not-allowed' : '')}
        >
          <MessageCircle className="w-4 h-4" />
          {isOrdering ? '...' : (isTelegramWebApp ? 'SEC' : t.esimPackages.buyButton)}
        </button>
      </div>
    </div>
  );
}

function UnlimitedPlanCard({ plan, countryName }: { plan: LivePlan; countryName: string }) {
  const { t, language } = useLanguage();
  const [isOrdering, setIsOrdering] = useState(false);
  const waId = getWaId();
  const isTelegramWebApp = typeof window !== 'undefined' && Boolean((window as any).Telegram?.WebApp?.initData);
  const tg = (window as any).Telegram?.WebApp;

  const handleBuyClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const textMsg = appendReferralToMessage(buildOrderMessage({ countryName, plan, language, unlimited: true }), language);

    trackGoogleAdsEsimPurchase({
      transactionId: plan.id || plan.code,
      value: parseUsdPrice(plan.price),
    });
    trackEvent(EVENTS.WHATSAPP_ESIM_ORDER, { code: plan.code, id: plan.id });
    trackTikTokProductEvent('InitiateCheckout', {
      contentId: plan.id || plan.code,
      contentName: plan.name || `${countryName} eSIM unlimited ${plan.days} days`,
      value: parseUsdPrice(plan.price),
      eventId: `checkout_${plan.id || plan.code}_${Date.now()}`,
    });
    trackAgentLead({
      productType: 'esim',
      eventType: 'whatsapp_click',
      packageCode: plan.code || plan.id,
      packageName: countryName,
      viewedPackage: `${countryName} eSIM · Limitsiz ${plan.dailyLimit || 'FUP'} · ${plan.days} gün · ${plan.price}`,
      page: window.location.pathname,
    });

    if (isTelegramWebApp && tg) {
      tg.sendData(textMsg);
      tg.close();
      return;
    }

    if (waId) {
      setIsOrdering(true);
      try {
        await createOrder({ wa_id: waId, type: 'esim', code: plan.code, details: textMsg });
        showToast(
          language === 'az'
            ? 'Sifarişiniz WhatsApp-a göndərildi! Zəhmət olmasa çat bölməsinə qayıdın.'
            : language === 'ru'
              ? 'Ваш заказ отправлен в WhatsApp! Пожалуйста, вернитесь в чат.'
              : 'Your order has been sent to WhatsApp! Please return to your chat.',
        );
      } finally {
        setIsOrdering(false);
      }
    } else {
      window.location.href = WA_LINK + "?text=" + encodeURIComponent(textMsg);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-orange-200 p-5 hover:shadow-xl transition-all duration-300 group flex flex-col h-full relative overflow-hidden sm:p-6">
      <div className="absolute top-0 right-0 bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
        LİMİTSİZ
      </div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">4G / 5G Speed</div>
          <div className="text-xs text-gray-400">Auto-activate</div>
        </div>
      </div>
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <InfinityIcon className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t.countryEsim.data}</p>
            <p className="text-sm font-bold text-orange-700">Limitsiz {plan.dailyLimit || 'FUP'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <Clock className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t.countryEsim.validity}</p>
            <p className="text-sm font-bold text-gray-900">{plan.days} {t.esimPackages.days}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <Globe className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t.countryEsim.coverage}</p>
            <p className="text-sm font-bold text-gray-900 truncate max-w-[140px]">{countryName}</p>
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <button
          onClick={handleBuyClick}
          className={"flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 text-white " +
            (isTelegramWebApp ? 'bg-[#24A1DE] hover:bg-[#1f8ec4]' : 'bg-[#25D366] hover:bg-[#20bd5a]') +
            (isOrdering ? 'opacity-70 cursor-not-allowed' : '')}
        >
          <MessageCircle className="w-4 h-4" />
          {isOrdering ? '...' : (isTelegramWebApp ? 'SEC' : t.esimPackages.buyButton)}
        </button>
      </div>
    </div>
  );
}

export default function CountryEsim() {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();

  const staticPkg = slug ? getPackageBySlug(slug) : undefined;
  const staticCountryCode = staticPkg?.countryCode;
  const fallbackCode = slug ? SLUG_TO_CODE[slug] : null;
  const activeCountryCode = staticCountryCode || fallbackCode;

  const [livePkgs, setLivePkgs] = useState<ESIMPackageRaw[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [activePlanType, setActivePlanType] = useState<'standard' | 'unlimited'>('standard');

  useEffect(() => {
    if (!activeCountryCode) return;
    const cached = getCachedPackagesForCountry(activeCountryCode);
    if (cached?.length) {
      setLivePkgs(cached);
      setLiveLoading(false);
    } else {
      setLiveLoading(true);
    }
    setLiveError(null);
    fetchPublicPackagesForCountry(activeCountryCode)
      .then(pkgs => { setLivePkgs(pkgs); setLiveLoading(false); })
      .catch(err => { setLiveError(err.message); setLiveLoading(false); setLivePkgs([]); });
  }, [activeCountryCode]);

  const countryName = getCountryNameLocalized(activeCountryCode || '', language);
  const flag = countryCodeToFlag(activeCountryCode || '');

  const limitedPlans: LivePlan[] = livePkgs
    .filter(isDataPlanPackage)
    .map(p => ({
      gb: p.volume as number,
      days: p.duration,
      price: formatPrice(p.sell_price_minor, p.currencyCode),
      priceMinor: p.sell_price_minor,
      currencyCode: p.currencyCode,
      code: p.packageCode,
      id: p.slug,
      isUnlimited: false,
      countryCode: activeCountryCode || '',
      name: p.name,
    }))
    .sort((a, b) => a.gb - b.gb);

  const unlimitedPlans: LivePlan[] = livePkgs
    .filter(p => (p.is_unlimited || isUnlimitedPlan(p.name)) && (p.sell_price_minor ?? 0) > 0)
    .map(p => ({
      gb: 0,
      days: p.duration,
      price: formatPrice(p.sell_price_minor, p.currencyCode),
      priceMinor: p.sell_price_minor,
      currencyCode: p.currencyCode,
      code: p.packageCode,
      id: p.slug,
      isUnlimited: true,
      countryCode: activeCountryCode || '',
      dailyLimit: getUnlimitedDailyLimit(p),
      name: p.name,
    }))
    .sort((a, b) => {
      const limitDiff = limitSortValue(a.dailyLimit || '') - limitSortValue(b.dailyLimit || '');
      return limitDiff || sortUnlimitedDays(a, b);
    });

  const displayLimitedPlans = normalizeStandardPlans(limitedPlans);
  const showFallbackNote = false;
  const unlimitedLimitOptions = Array.from(new Set(unlimitedPlans.map(plan => plan.dailyLimit || 'FUP')))
    .sort((a, b) => limitSortValue(a) - limitSortValue(b));
  const selectedUnlimitedLimit =
    UNLIMITED_LIMIT_PRIORITY.find(priority =>
      unlimitedLimitOptions.some(limit => limit.toLowerCase() === priority.toLowerCase())
    ) || unlimitedLimitOptions[0] || null;
  const filteredUnlimitedPlans = selectedUnlimitedLimit
    ? unlimitedPlans
        .filter(plan => (plan.dailyLimit || 'FUP') === selectedUnlimitedLimit)
        .sort(sortUnlimitedDays)
    : unlimitedPlans;
  const realMultiDayUnlimitedPlans = filteredUnlimitedPlans.filter(plan => plan.days > 1 && UNLIMITED_DAY_ORDER.includes(plan.days));
  const baseUnlimitedPlan = filteredUnlimitedPlans
    .filter(plan => plan.days === 1)
    .sort((a, b) => (a.priceMinor ?? 0) - (b.priceMinor ?? 0))[0] || filteredUnlimitedPlans[0];
  const displayUnlimitedPlans = realMultiDayUnlimitedPlans.length > 0
    ? realMultiDayUnlimitedPlans.sort(sortUnlimitedDays)
    : baseUnlimitedPlan
      ? UNLIMITED_DAY_ORDER.map(days => ({
          ...baseUnlimitedPlan,
          days,
          price: multiplyPlanPrice(baseUnlimitedPlan, days),
          id: `${baseUnlimitedPlan.id}-${days}d`,
          name: `${baseUnlimitedPlan.name || baseUnlimitedPlan.dailyLimit || 'Unlimited'} ${days} days`,
        }))
      : filteredUnlimitedPlans;
  const totalPlans = displayLimitedPlans.length + unlimitedPlans.length;
  const selectedPlanType = activePlanType === 'unlimited' && unlimitedPlans.length > 0 ? 'unlimited' : 'standard';
  const visiblePlans = selectedPlanType === 'unlimited' ? displayUnlimitedPlans : displayLimitedPlans;

  useEffect(() => {
    if (!activeCountryCode || totalPlans === 0) return;
    const firstPlan = displayLimitedPlans[0] || displayUnlimitedPlans[0] || unlimitedPlans[0];
    const contentId = activeCountryCode.toUpperCase();
    const dedupeKey = `tt_view_${contentId}_${slug || ''}`;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(dedupeKey)) return;
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(dedupeKey, '1');

    trackTikTokProductEvent('ViewContent', {
      contentId,
      contentName: `${countryName} eSIM`,
      value: firstPlan ? parseUsdPrice(firstPlan.price) : undefined,
      eventId: `view_${contentId}_${Date.now()}`,
    });
  }, [activeCountryCode, countryName, displayLimitedPlans, displayUnlimitedPlans, slug, totalPlans, unlimitedPlans]);

  if (liveLoading && livePkgs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </main>
        <Footer />
      </div>
    );
  }

  if (displayLimitedPlans.length === 0 && unlimitedPlans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Seo title="eSIM not found" canonicalPath={"/" + (slug || '')} />
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <p className="text-6xl mb-4">?</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No packages available</h2>
            <p className="text-gray-500 mb-6">No eSIM packages found for "{slug}"</p>
            <Link to="/esim" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">Browse All Countries</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Seo title={countryName + " eSIM"} description={"Buy " + countryName + " eSIM plans. Instant delivery via WhatsApp."} canonicalPath={"/" + (slug || '')} />
      <Header />
      <div className="bg-gradient-to-br from-gray-900 to-[#0A0F1C] pt-28 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors">{t.countryEsim.home}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/esim" className="hover:text-white transition-colors">eSIM</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white font-medium">{countryName}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 flex-shrink-0">
              <FlagImage flag={flag} countryCode={activeCountryCode || ''} size="full" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 uppercase">{countryName} eSIM</h1>
              <p className="text-gray-400 text-lg">{t.countryEsim.subtitle}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                  <Zap className="w-4 h-4" /> {totalPlans} plans available
                </span>
                <span className="flex items-center gap-1.5 text-blue-400 text-sm font-medium">
                  <Shield className="w-4 h-4" /> Instant delivery via WhatsApp
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link to="/esim" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            {t.countryEsim.backToAll}
          </Link>

          {showFallbackNote && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6">
              {t.countryEsim.fallbackNote || 'Showing cached prices — live sync updating soon.'}
            </p>
          )}

          {liveError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6">
              {language === 'az'
                ? 'Canlı paketləri yükləmək mümkün olmadı. Aşağıda mövcud qiymətlər göstərilir.'
                : language === 'ru'
                  ? 'Не удалось загрузить актуальные пакеты. Ниже показаны доступные цены.'
                  : 'Could not load live packages. Showing available prices below.'}
            </p>
          )}

          <section className="mb-10">
            <div className="sticky top-16 z-20 -mx-4 mb-5 border-y border-gray-100 bg-gray-50/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-gray-200 sm:max-w-md">
                <button
                  type="button"
                  onClick={() => setActivePlanType('standard')}
                  className={
                    'flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition active:scale-[0.98] ' +
                    (selectedPlanType === 'standard'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50')
                  }
                >
                  <Wifi className="h-4 w-4" />
                  <span>Standart</span>
                  <span className={selectedPlanType === 'standard' ? 'text-blue-100' : 'text-gray-400'}>
                    {displayLimitedPlans.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => unlimitedPlans.length > 0 && setActivePlanType('unlimited')}
                  disabled={unlimitedPlans.length === 0}
                  className={
                    'flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ' +
                    (selectedPlanType === 'unlimited'
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50')
                  }
                >
                  <InfinityIcon className="h-4 w-4" />
                  <span>Limitsiz</span>
                  <span className={selectedPlanType === 'unlimited' ? 'text-orange-100' : 'text-gray-400'}>
                    {displayUnlimitedPlans.length}
                  </span>
                </button>
              </div>
            </div>

            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-gray-900 sm:text-2xl">
                  {selectedPlanType === 'unlimited' ? 'Limitsiz paketlər' : 'Standart paketlər'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedPlanType === 'unlimited'
                    ? 'Gündəlik limitli/FUP paketləri. Uzun istifadə üçün daha rahat seçimdir.'
                    : 'Sabit GB həcmi olan klassik data paketləri.'}
                </p>
              </div>
              <span className={
                'shrink-0 rounded-full px-3 py-1 text-sm font-bold ' +
                (selectedPlanType === 'unlimited'
                  ? 'bg-orange-50 text-orange-700'
                  : 'bg-blue-50 text-blue-700')
              }>
                {visiblePlans.length} paket
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {selectedPlanType === 'unlimited'
                ? visiblePlans.map((plan) => (
                    <UnlimitedPlanCard key={plan.id || plan.code} plan={plan} countryName={countryName} />
                  ))
                : visiblePlans.map((plan, i) => (
                    <LimitedPlanCard key={plan.id || plan.code || String(i)} plan={plan} countryName={countryName} />
                  ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
