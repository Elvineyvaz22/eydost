import { useParams, Link } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Wifi, Clock, Globe, ChevronRight, Zap, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePackages } from '../contexts/PackagesContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import { getPackageBySlug, type PackageData, type Plan } from '../data/esimPackages';
import { getPlanCode } from '../data/planCodeMap';
import FlagImage from '../components/FlagImage';
import { getWaId, createOrder } from '../utils/whatsapp';
import { useState, useMemo } from 'react';
import Seo from '../components/Seo';

const WA_LINK = 'https://wa.me/994558878889';
const TG_BOT_USERNAME = 'eydost_esim_bot';

function PlanCard({ plan, countryName, countryCode, planIndex }: { plan: Plan; countryName: string; countryCode: string; planIndex: number }) {
  const { t } = useLanguage();

  const planCodeEntry = getPlanCode(countryCode, planIndex);

  const tgRawMsg = planCodeEntry
    ? `Hi! I want to buy an eSIM.\nCode: ${planCodeEntry.code}\nID: ${planCodeEntry.id}`
    : `Hi! I want to buy an eSIM for ${countryName}.\n📊 Data: ${plan.gb}GB\n⏱ Validity: ${plan.days} days\n💰 Price: ${plan.price}`;

  const waRawMsg = planCodeEntry
    ? `Hi! I want to buy an eSIM.\nCode: ${planCodeEntry.code}\nID: ${planCodeEntry.id}`
    : `Hi! I want to buy an eSIM for ${countryName}.\n📊 Data: ${plan.gb}GB\n⏱ Validity: ${plan.days} days\n💰 Price: ${plan.price}`;

  const waMsg = encodeURIComponent(waRawMsg);
  const tgLink = `https://t.me/${TG_BOT_USERNAME}?text=${encodeURIComponent(tgRawMsg)}`;

  const [isOrdering, setIsOrdering] = useState(false);
  const waId = getWaId();

  const isTelegramWebApp = typeof window !== 'undefined' && 
    (window as any).Telegram?.WebApp?.platform !== undefined && 
    (window as any).Telegram?.WebApp?.platform !== 'unknown';
  const tg = (window as any).Telegram?.WebApp;

    const textMsg = planCodeEntry
      ? `Hi! I want to buy an eSIM.\nCode: ${planCodeEntry.code}\nID: ${planCodeEntry.id}`
      : `Hi! I want to buy an eSIM for ${countryName}.\nData: ${plan.gb}GB\nValidity: ${plan.days} days\nPrice: ${plan.price}`;

    if (isTelegramWebApp && tg) {
      e.preventDefault();
      if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      
      const userId = tg.initDataUnsafe?.user?.id;
      
      // Backend-mediated Order (Best Practice)
      fetch('/api/telegram/mini-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'esim_order',
          country: countryName,
          code: planCodeEntry?.code || 'ESIM',
          user_id: userId,
          gb: plan.gb,
          days: plan.days,
          price: plan.price
        })
      }).finally(() => {
        // Also try standard way as backup
        const textMsg = `Hi! I want to buy an eSIM for ${countryName}.\nData: ${plan.gb}GB\nValidity: ${plan.days} days\nPrice: ${plan.price}`;
        try { tg.sendData(textMsg); } catch(e) {}
        setTimeout(() => tg.close(), 100);
      });
      return;
    }

    if (waId) {
      e.preventDefault();
      setIsOrdering(true);
      try {
        await createOrder({
          wa_id: waId,
          type: 'esim',
          code: planCodeEntry?.code || countryCode.toUpperCase(),
          id: planCodeEntry?.id || 'GENERIC',
        });
        alert('Sifarişiniz WhatsApp-a göndərildi! Zəhmət olmasa çat bölməsinə qayıdın.');
      } finally {
        setIsOrdering(false);
      }
    } else {
      window.location.href = `${WA_LINK}?text=${waMsg}`;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
      {/* Price header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">4G / 5G Speed</div>
          <div className="text-xs text-gray-400">Auto-activate</div>
        </div>
      </div>

      {/* Plan details */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Wifi className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t.countryEsim.data}</p>
            <p className="text-sm font-bold text-gray-900">{plan.gb} GB</p>
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

      {/* Buy button */}
      <div className="mt-auto">
        <button
          onClick={handleBuyClick}
          className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 text-white ${
            isTelegramWebApp 
              ? 'bg-[#24A1DE] hover:bg-[#1f8ec4]' 
              : 'bg-[#25D366] hover:bg-[#20bd5a]'
          } ${isOrdering ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <MessageCircle className="w-4 h-4" />
          {isOrdering ? '...' : (isTelegramWebApp ? 'SİFARİŞ ET' : t.esimPackages.buyButton)}
        </button>
      </div>
    </div>
  );
}

export default function CountryEsim() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const { liveCountryGroups, liveLoading } = usePackages();

  // Try to find in live data first
  const livePkg = useMemo(() => {
    if (!slug || !liveCountryGroups) return undefined;
    return liveCountryGroups.find(group => 
      `${group.countryName.toLowerCase().replace(/\s+/g, '-')}-esim` === slug
    );
  }, [liveCountryGroups, slug]);

  const pkg = useMemo(() => {
    if (livePkg) {
      return {
        country: livePkg.countryName,
        countryCode: livePkg.countryCode,
        flag: livePkg.flag,
        slug: slug!,
        region: 'all',
        plans: livePkg.packages.map(p => ({
          gb: parseFloat((p.volume / (1024 * 1024 * 1024)).toFixed(1)),
          days: p.duration,
          price: `$${((p.sellingPrice || p.price * 1.75) / 10000).toFixed(2)}`,
          code: p.packageCode,
          id: p.slug
        }))
      } as PackageData;
    }
    return slug ? getPackageBySlug(slug) : undefined;
  }, [livePkg, slug]);

  // If country code is invalid/unknown, show not found
  if (liveLoading && !pkg) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Seo title="eSIM not found" canonicalPath={`/${slug || ''}`} />
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <p className="text-6xl mb-4">😕</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Country not found</h2>
            <p className="text-gray-500 mb-6">No eSIM packages available for "{slug}"</p>
            <Link to="/esim" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
              Browse All Countries
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Seo
        title={`${pkg.country} eSIM`}
        description={`Buy ${pkg.country} eSIM plans. Instant delivery via WhatsApp. Choose data and validity that fits your trip.`}
        canonicalPath={`/${pkg.slug}`}
      />
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 to-[#0A0F1C] pt-28 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors">{t.countryEsim.home}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/esim" className="hover:text-white transition-colors">eSIM</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white font-medium">{pkg.country}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 flex-shrink-0">
               <FlagImage flag={pkg.flag} countryCode={pkg.countryCode} size="full" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 uppercase">
                {pkg.country} eSIM
              </h1>
              <p className="text-gray-400 text-lg">{t.countryEsim.subtitle}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                  <Zap className="w-4 h-4" /> {pkg.plans.length} plans available
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
          <Link to="/esim"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            {t.countryEsim.backToAll}
          </Link>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t.countryEsim.availablePlans}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pkg.plans.map((plan, i) => (
                <PlanCard key={i} plan={plan} countryName={pkg.country} countryCode={pkg.countryCode} planIndex={i} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
