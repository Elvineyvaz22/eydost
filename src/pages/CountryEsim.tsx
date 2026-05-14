import { useParams, Link } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Wifi, Clock, Globe, ChevronRight, Zap, Shield, Infinity } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import { getPackageBySlug } from '../data/esimPackages';
import FlagImage from '../components/FlagImage';
import { getWaId, createOrder } from '../utils/whatsapp';
import { useState, useEffect } from 'react';
import Seo from '../components/Seo';
import { showToast } from '../components/Toast';
import { fetchPublicPackagesForCountry, countryCodeToFlag, getCountryName, type ESIMPackageRaw } from '../services/esimApi';

const WA_LINK = 'https://wa.me/994992010117';

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

interface LivePlan {
  gb: string;
  days: number;
  price: string;
  code: string;
  id: string;
}

function LimitedPlanCard({ plan, countryName }: { plan: LivePlan; countryName: string }) {
  const { t } = useLanguage();
  const [isOrdering, setIsOrdering] = useState(false);
  const waId = getWaId();
  const isTelegramWebApp = typeof window !== 'undefined' && Boolean((window as any).Telegram?.WebApp?.initData);
  const tg = (window as any).Telegram?.WebApp;

  const handleBuyClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const textMsg = "[ESIM_ORDER]\nHi! I want to buy an eSIM.\nCode: " + plan.code;

    if (isTelegramWebApp && tg) {
      tg.sendData(textMsg);
      tg.close();
      return;
    }

    if (waId) {
      setIsOrdering(true);
      try {
        await createOrder({ wa_id: waId, type: 'esim', code: plan.code });
        showToast('Sifarisiniz WhatsApp-a gonderildi! Zehmet olmasa cat bolmesine qayidin.');
      } finally {
        setIsOrdering(false);
      }
    } else {
      window.location.href = WA_LINK + "?text=" + encodeURIComponent(textMsg);
    }
  };

  const gbNum = parseFloat(plan.gb);
  const gbDisplay = gbNum >= 1 ? plan.gb + " GB" : Math.round(gbNum * 1024) + " MB";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
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
            <p className="text-sm font-bold text-gray-900">{gbDisplay}</p>
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
  const { t } = useLanguage();
  const [isOrdering, setIsOrdering] = useState(false);
  const waId = getWaId();
  const isTelegramWebApp = typeof window !== 'undefined' && Boolean((window as any).Telegram?.WebApp?.initData);
  const tg = (window as any).Telegram?.WebApp;

  const handleBuyClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const textMsg = "[ESIM_ORDER]\nHi! I want to buy an eSIM.\nCode: " + plan.code;

    if (isTelegramWebApp && tg) {
      tg.sendData(textMsg);
      tg.close();
      return;
    }

    if (waId) {
      setIsOrdering(true);
      try {
        await createOrder({ wa_id: waId, type: 'esim', code: plan.code });
        showToast('Sifarisiniz WhatsApp-a gonderildi! Zehmet olmasa cat bolmesine qayidin.');
      } finally {
        setIsOrdering(false);
      }
    } else {
      window.location.href = WA_LINK + "?text=" + encodeURIComponent(textMsg);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-purple-200 p-6 hover:shadow-xl transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
        UNLIMITED
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
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <Infinity className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t.countryEsim.data}</p>
            <p className="text-sm font-bold text-purple-700">Unlimited</p>
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
  const { t } = useLanguage();

  const staticPkg = slug ? getPackageBySlug(slug) : undefined;
  const staticCountryCode = staticPkg?.countryCode;
  const fallbackCode = slug ? SLUG_TO_CODE[slug] : null;
  const activeCountryCode = staticCountryCode || fallbackCode;

  const [livePkgs, setLivePkgs] = useState<ESIMPackageRaw[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [, setLiveError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeCountryCode) return;
    setLiveLoading(true);
    setLiveError(null);
    fetchPublicPackagesForCountry(activeCountryCode)
      .then(pkgs => { setLivePkgs(pkgs); setLiveLoading(false); })
      .catch(err => { setLiveError(err.message); setLiveLoading(false); });
  }, [activeCountryCode]);

  const countryName = getCountryName(activeCountryCode || '');
  const flag = countryCodeToFlag(activeCountryCode || '');

  const limitedPlans: LivePlan[] = livePkgs
    .filter(p => p.volume > 0)
    .map(p => {
      const sellMinor = (p as any).sell_price_minor ?? 0;
      const currency = p.currencyCode || 'USD';
      const priceDisplay = currency === 'AZN'
        ? (sellMinor / 100).toFixed(2) + " \u20BC"
        : "$" + (sellMinor / 100).toFixed(2);
      const gbNum = p.volume / (1024 * 1024 * 1024);
      const gbDisplay = gbNum >= 1 ? gbNum.toFixed(1) : (gbNum * 1024).toFixed(0);
      return {
        gb: gbDisplay,
        days: p.duration,
        price: priceDisplay,
        code: p.packageCode,
        id: p.slug,
      };
    })
    .sort((a, b) => parseFloat(a.gb) - parseFloat(b.gb));

  const unlimitedPlans: LivePlan[] = livePkgs
    .filter(p => p.volume === 0)
    .map(p => {
      const sellMinor = (p as any).sell_price_minor ?? 0;
      const currency = p.currencyCode || 'USD';
      const priceDisplay = currency === 'AZN'
        ? (sellMinor / 100).toFixed(2) + " \u20BC"
        : "$" + (sellMinor / 100).toFixed(2);
      return {
        gb: '0',
        days: p.duration,
        price: priceDisplay,
        code: p.packageCode,
        id: p.slug,
      };
    })
    .sort((a, b) => a.days - b.days);

  const totalPlans = limitedPlans.length + unlimitedPlans.length;

  if (liveLoading) {
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

  if (livePkgs.length === 0 && !staticPkg) {
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

          {limitedPlans.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Wifi className="w-5 h-5 text-blue-600" />
                {t.countryEsim.availablePlans || 'Available Plans'} ({limitedPlans.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {limitedPlans.map((plan, i) => (
                  <LimitedPlanCard key={plan.code} plan={plan} countryName={countryName} />
                ))}
              </div>
            </div>
          )}

          {unlimitedPlans.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Infinity className="w-5 h-5 text-purple-600" />
                Unlimited Plans ({unlimitedPlans.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unlimitedPlans.map((plan, i) => (
                  <UnlimitedPlanCard key={plan.code} plan={plan} countryName={countryName} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
