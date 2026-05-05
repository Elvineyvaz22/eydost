import { useParams, Link, Navigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Wifi, Clock, Globe, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { regionalPackages, globalPackage } from '../data/esimPackages';
import { usePackages } from '../contexts/PackagesContext';
import type { RegionalPackage } from '../data/esimPackages';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import FlagImage from '../components/FlagImage';
import { getWaId, createOrder } from '../utils/whatsapp';
import { useState, useMemo } from 'react';
import Seo from '../components/Seo';

const WA_LINK = 'https://wa.me/994558878889';
const TG_BOT_USERNAME = 'eydost_esim_bot';

function getRegionalBySlug(slug: string): RegionalPackage | undefined {
  if (globalPackage.slug === slug) return globalPackage;
  return regionalPackages.find(p => p.slug === slug);
}

export default function RegionalEsim() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const { liveRegionalPackages } = usePackages();

  const livePkg = useMemo(() => {
    if (!slug || !liveRegionalPackages) return undefined;
    const p = liveRegionalPackages.find(p => `${p.name.toLowerCase().replace(/\s+/g, '-')}-esim` === slug);
    if (!p) return undefined;

    return {
      name: p.name,
      slug: slug!,
      flags: p.location.split(',').slice(0, 4).map((code: string) => code.trim().toUpperCase()),
      countryCount: p.location.split(',').length,
      plans: [{
        gb: parseFloat((p.volume / (1024 * 1024 * 1024)).toFixed(1)),
        days: p.duration,
        price: `$${((p.sellingPrice || p.price * 1.75) / 10000).toFixed(2)}`,
        code: p.packageCode,
        id: p.slug
      }]
    } satisfies RegionalPackage;
  }, [liveRegionalPackages, slug]);

  const pkg = livePkg || (slug ? getRegionalBySlug(slug) : undefined);

  const [isOrdering, setIsOrdering] = useState(false);
  const waId = getWaId();
  const isTelegramWebApp = typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp?.initData);

  if (!pkg) return <Navigate to="/" replace />;

  const handleBuyClick = async (e: React.MouseEvent<HTMLAnchorElement>, rawMsg: string, plan: RegionalPackage['plans'][number]) => {
    if (isTelegramWebApp) {
      e.preventDefault();
      const tg = window.Telegram?.WebApp;
      if (!tg) return;
      tg.sendData(rawMsg);
      tg.close();
      return;
    }

    if (waId) {
      e.preventDefault();
      setIsOrdering(true);
      try {
        await createOrder({
          wa_id: waId,
          type: 'esim',
          code: pkg.name.toUpperCase(),
          id: plan.gb + 'GB',
        });
        alert('Sifarişiniz WhatsApp-a göndərildi! Zəhmət olmasa çat bölməsinə qayıdın.');
      } finally {
        setIsOrdering(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Seo
        title={`${pkg.name} eSIM`}
        description={`Buy ${pkg.name} regional eSIM plans. Instant delivery via WhatsApp.`}
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
                  {pkg.countryCount} {t.esimPackages.countriesLabel} - {t.countryEsim.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-wide">
              {t.countryEsim.availablePlans}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pkg.plans.map((plan, i) => {
                const rawMsg = `Hi! I want to buy an eSIM for ${pkg.name}.\n📊 Data: ${plan.gb}GB\n⏱ Validity: ${plan.days} days\n💰 Price: ${plan.price}`;
                const tgLink = `https://t.me/${TG_BOT_USERNAME}?text=${encodeURIComponent(rawMsg)}`;
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
                      const msg = JSON.stringify({
                        country: pkg.name,
                        gb: plan.gb,
                        days: plan.days,
                        price: plan.price,
                        message: rawMsg
                      });
                      handleBuyClick(e as any, msg, plan);
                    }}
                    className={`flex items-center justify-center gap-3 w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 text-white ${
                      isTelegramWebApp 
                        ? 'bg-[#24A1DE] hover:bg-[#1f8ec4]' 
                        : 'bg-[#25D366] hover:bg-[#20bd5a]'
                    } ${isOrdering ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {isOrdering ? '...' : (isTelegramWebApp ? 'SİFARİŞ ET' : t.esimPackages.buyButton)}
                  </button>
                </div>
              )})}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
