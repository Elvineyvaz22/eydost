import { useParams, Link, Navigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Wifi, Clock, Globe, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { regionalPackages, globalPackage } from '../data/esimPackages';
import { usePackages } from '../contexts/PackagesContext';
import type { RegionalPackage } from '../data/esimPackages';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FlagImage from '../components/FlagImage';
import { appendReferralToMessage, getWaId, createOrder, trackAgentLead } from '../utils/whatsapp';
import { useState, useMemo, useEffect } from 'react';
import Seo from '../components/Seo';
import { trackEvent, trackGoogleAdsEsimPurchase, trackMetaEvent, trackTikTokProductEvent, parseUsdPrice, EVENTS } from '../utils/analytics';
import EuropeCoverageNetworks from '../components/EuropeCoverageNetworks';
import { EUROPE_COVERAGE_COUNT } from '../data/europeCoverage';
import { formatPriceStringForVisitor, useVisitorCurrency } from '../contexts/VisitorCurrencyContext';

const WA_LINK = 'https://wa.me/994992010117';
const ALLOWED_GB = [1, 3, 5, 10, 20, 50, 100];

/** One plan per allowed GB tier — prefer 30-day validity, then lowest price. */
function filterPlansForAds(plans: RegionalPackage['plans']): RegionalPackage['plans'] {
  const picked: RegionalPackage['plans'] = [];
  for (const gb of ALLOWED_GB) {
    const matches = plans.filter(p => Math.round(p.gb) === gb);
    if (!matches.length) continue;
    const best =
      matches.find(p => p.days === 30) ??
      matches.reduce((a, b) => {
        const pa = parseFloat(a.price.replace(/[^0-9.]/g, '')) || 999;
        const pb = parseFloat(b.price.replace(/[^0-9.]/g, '')) || 999;
        return pb < pa ? b : a;
      });
    picked.push(best);
  }
  return picked;
}

type OrderLang = 'en' | 'az' | 'ru' | 'tr' | 'ar' | 'es' | 'zh';
type DisplayRegionalPlan = RegionalPackage['plans'][number] & { usdPrice?: number };

function msg(lang: OrderLang, map: { en: string; az: string; ru: string; tr: string; ar: string; es: string; zh: string }) {
  return map[lang] ?? map.en;
}

function buildOrderMessage(
  plan: RegionalPackage['plans'][number],
  regionName: string,
  lang: OrderLang,
): string {
  const greeting = msg(lang, {
    en: 'Hi! I want to buy an eSIM.',
    az: 'Salam! eSIM almaq istəyirəm.',
    ru: 'Здравствуйте! Я хочу купить eSIM.',
    tr: 'Merhaba! eSIM satın almak istiyorum.',
    ar: 'مرحباً! أريد شراء eSIM.',
    es: '¡Hola! Quiero comprar una eSIM.',
    zh: '你好！我想购买 eSIM。',
  });
  const regionLabel = msg(lang, { en: 'Region', az: 'Region', ru: 'Регион', tr: 'Bölge', ar: 'المنطقة', es: 'Región', zh: '区域' });
  const packageLabel = msg(lang, { en: 'Package', az: 'Paket', ru: 'Тариф', tr: 'Paket', ar: 'الباقة', es: 'Paquete', zh: '套餐' });
  const validityLabel = msg(lang, { en: 'Validity', az: 'Müddət', ru: 'Срок', tr: 'Süre', ar: 'المدة', es: 'Validez', zh: '有效期' });
  const priceLabel = msg(lang, { en: 'Price', az: 'Qiymət', ru: 'Цена', tr: 'Fiyat', ar: 'السعر', es: 'Precio', zh: '价格' });
  const daysWord = msg(lang, { en: 'days', az: 'gün', ru: 'дн.', tr: 'gün', ar: 'يوم', es: 'días', zh: '天' });

  const lines = [
    greeting,
    `${regionLabel}: ${regionName}`,
    `${packageLabel}: ${plan.gb} GB`,
    `${validityLabel}: ${plan.days} ${daysWord}`,
    `${priceLabel}: ${plan.price}`,
  ];
  if (plan.code) lines.push(`Code: ${plan.code}`);
  if (plan.id) lines.push(`ID: ${plan.id}`);
  return lines.join('\n');
}

function getRegionalBySlug(slug: string): RegionalPackage | undefined {
  if (globalPackage.slug === slug) return globalPackage;
  return regionalPackages.find(p => p.slug === slug);
}

export default function RegionalEsim() {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useLanguage();
  const { currency: displayCurrency } = useVisitorCurrency();
  // WhatsApp message rule: if UI is Arabic, still send EN message text.
  const orderLang: OrderLang =
    language === 'ar'
      ? 'en'
      : language === 'az' || language === 'ru' || language === 'tr' || language === 'es' || language === 'zh'
        ? (language as OrderLang)
        : 'en';
  const { liveRegionalPackages } = usePackages();

  const livePkg = useMemo(() => {
    if (!slug || !liveRegionalPackages) return undefined;
    const p = liveRegionalPackages.find(p => `${p.name.toLowerCase().replace(/\s+/g, '-')}-esim` === slug);
    if (!p) return undefined;
    const gb = parseFloat((p.volume / (1024 * 1024 * 1024)).toFixed(1));
    const markup = gb === 50 || gb === 100 ? 1.5 : 1.75;

    return {
      name: p.name,
      slug: slug!,
      flags: p.location.split(',').slice(0, 4).map((code: string) => code.trim().toUpperCase()),
      countryCount: p.location.split(',').length,
      plans: [{
        gb,
        days: p.duration,
        price: `$${((p.sellingPrice || p.price * markup) / 10000).toFixed(2)}`,
        code: p.packageCode,
        id: p.slug
      }]
    } satisfies RegionalPackage;
  }, [liveRegionalPackages, slug]);

  const rawPkg = livePkg || (slug ? getRegionalBySlug(slug) : undefined);
  const pkg = useMemo(() => {
    if (!rawPkg) return undefined;
    return {
      ...rawPkg,
      plans: filterPlansForAds(rawPkg.plans).map((plan) => ({
        ...plan,
        usdPrice: parseUsdPrice(plan.price),
        price: formatPriceStringForVisitor(plan.price, displayCurrency),
      })),
    };
  }, [displayCurrency, rawPkg]);

  const [isOrdering, setIsOrdering] = useState(false);
  const waId = getWaId();
  const isTelegramWebApp = typeof window !== 'undefined' &&
    (window as any).Telegram?.WebApp?.platform !== undefined &&
    (window as any).Telegram?.WebApp?.platform !== 'unknown';

  useEffect(() => {
    if (!pkg || pkg.plans.length === 0) return;
    const firstPlan = pkg.plans[0];
    const dedupeKey = `tt_view_${pkg.slug}`;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(dedupeKey)) return;
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(dedupeKey, '1');

    trackTikTokProductEvent('ViewContent', {
      contentId: pkg.slug,
      contentName: `${pkg.name} eSIM`,
      value: (firstPlan as DisplayRegionalPlan).usdPrice ?? parseUsdPrice(firstPlan.price),
      eventId: `view_${pkg.slug}_${Date.now()}`,
    });
  }, [pkg]);

  if (!pkg) return <Navigate to="/" replace />;

  const handleBuyClick = async (e: React.MouseEvent<HTMLAnchorElement>, rawMsg: string, plan: RegionalPackage['plans'][number]) => {
    trackGoogleAdsEsimPurchase({
      transactionId: plan.id || plan.code,
      value: (plan as DisplayRegionalPlan).usdPrice ?? parseUsdPrice(plan.price),
    });
    trackMetaEvent('Lead', {
      content_name: `${pkg.name} eSIM`,
      content_category: 'eSIM',
      value: (plan as DisplayRegionalPlan).usdPrice ?? parseUsdPrice(plan.price),
      currency: 'USD',
    });
    trackEvent(EVENTS.WHATSAPP_ESIM_ORDER, {
      source: 'regional_esim',
      region: pkg.name,
      package_code: plan.code,
      package_id: plan.id,
    });
    trackTikTokProductEvent('InitiateCheckout', {
      contentId: plan.id || plan.code || pkg.slug,
      contentName: `${pkg.name} eSIM ${plan.gb} GB ${plan.days} days`,
      value: (plan as DisplayRegionalPlan).usdPrice ?? parseUsdPrice(plan.price),
      eventId: `checkout_${plan.id || plan.code || pkg.slug}_${Date.now()}`,
    });
    trackAgentLead({
      productType: 'esim',
      eventType: 'whatsapp_click',
      packageCode: plan.code || plan.id || pkg.name,
      packageName: pkg.name,
      viewedPackage: `${pkg.name} eSIM · ${plan.gb} GB · ${plan.days} gün · ${plan.price}`,
      page: window.location.pathname,
    });

    if (isTelegramWebApp) {
      e.preventDefault();
      const tg = window.Telegram?.WebApp;
      if (!tg) return;

      tg.sendData(appendReferralToMessage(buildOrderMessage(plan, pkg.name, orderLang), orderLang));
      tg.close();
      return;
    }

    if (waId) {
      e.preventDefault();
      setIsOrdering(true);
      try {
        const details = appendReferralToMessage(buildOrderMessage(plan, pkg.name, orderLang), orderLang);
        await createOrder({
          wa_id: waId,
          type: 'esim',
          code: plan.code || pkg.name.toUpperCase(),
          id: plan.id || `${plan.gb}GB`,
          details,
        });
        alert(
        msg(orderLang, {
          en: 'Your order has been sent to WhatsApp! Please return to your chat.',
          az: 'Sifarişiniz WhatsApp-a göndərildi! Zəhmət olmasa çat bölməsinə qayıdın.',
          ru: 'Ваш заказ отправлен в WhatsApp! Пожалуйста, вернитесь в чат.',
          tr: 'Siparişiniz WhatsApp’a gönderildi! Lütfen sohbetinize geri dönün.',
          ar: 'تم إرسال طلبك إلى واتساب! الرجاء العودة إلى الدردشة.',
          es: '¡Tu pedido se envió a WhatsApp! Vuelve al chat.',
          zh: '你的订单已发送到 WhatsApp！请返回聊天。',
        }),
      );
      } finally {
        setIsOrdering(false);
      }
    } else {
      window.location.href = `${WA_LINK}?text=${encodeURIComponent(appendReferralToMessage(rawMsg, orderLang))}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Seo
        title={pkg.slug === 'europe-esim' ? 'Europe eSIM — 35+ Countries' : `${pkg.name} eSIM`}
        description={
          pkg.slug === 'europe-esim'
            ? 'Europe eSIM (EU-35) for 35 countries. Vodafone, Orange, O2, TIM & more — 4G/5G. Plans from $1.09. Instant delivery via WhatsApp.'
            : `Buy ${pkg.name} regional eSIM plans. Instant delivery via WhatsApp.`
        }
        canonicalPath={`/${pkg.slug}`}
      />
      <Header />

      <div className="bg-white border-b border-gray-100 pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-blue-600 transition-colors">{t.countryEsim.home}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/esim" className="hover:text-blue-600 transition-colors">eSIM</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium uppercase">{pkg.name}</span>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            to="/esim"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.countryEsim.backToAll}
          </Link>

          {/* Hero */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-10 mb-10 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 relative z-10">
              <div className="flex gap-2 flex-wrap">
                {pkg.flags.map((f, i) => (
                  <div key={i} className="w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                    <FlagImage flag={f} size="full" />
                  </div>
                ))}
              </div>
              <div>
                <h1 className="text-3xl sm:text-5xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                  {pkg.name} eSIM
                </h1>
                <p className="text-gray-500 text-lg">
                  {pkg.slug === 'europe-esim' ? EUROPE_COVERAGE_COUNT : pkg.countryCount}{' '}
                  {t.esimPackages.countriesLabel} · {t.countryEsim.subtitle}
                </p>
                {pkg.slug === 'europe-esim' && (
                  <p className="text-sm text-blue-600 font-medium mt-2">
                    Code EU-35 · Vodafone, Orange, O2, TIM & more
                  </p>
                )}
              </div>
            </div>
          </div>

          {pkg.slug === 'europe-esim' && <EuropeCoverageNetworks />}

          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-wide">
              {t.countryEsim.availablePlans}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pkg.plans.map((plan, i) => {
                return (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-100 p-8 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 flex flex-col h-full group"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="bg-blue-50 text-blue-700 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider">
                        {i === pkg.plans.length - 1 ? t.countryEsim.bestValue : `${plan.gb}GB`}
                      </div>
                      <span className="text-3xl font-black text-gray-900">{plan.price}</span>
                    </div>
                    <div className="space-y-4 mb-8 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                          <Wifi className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t.countryEsim.data}</p>
                          <p className="text-base font-black text-gray-900">{plan.gb} GB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t.countryEsim.validity}</p>
                          <p className="text-base font-black text-gray-900">{plan.days} {t.esimPackages.days}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                          <Globe className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{t.countryEsim.coverage}</p>
                          <p className="text-base font-black text-gray-900 uppercase">{pkg.name}</p>
                        </div>
                      </div>
                    </div>
                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        handleBuyClick(e as any, buildOrderMessage(plan, pkg.name, orderLang), plan);
                      }}
                      className={`flex items-center justify-center gap-3 w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 text-white ${isTelegramWebApp
                          ? 'bg-[#24A1DE] hover:bg-[#1f8ec4]'
                          : 'bg-[#25D366] hover:bg-[#20bd5a]'
                        } ${isOrdering ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {isOrdering ? '...' : (isTelegramWebApp ? 'SEÇ' : t.esimPackages.buyButton)}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
