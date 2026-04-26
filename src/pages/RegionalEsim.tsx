import { useParams, Link, Navigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Wifi, Clock, Globe, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { regionalPackages, globalPackage } from '../data/esimPackages';
import type { RegionalPackage } from '../data/esimPackages';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import FlagImage from '../components/FlagImage';

const WA_LINK = 'https://wa.me/994512778085';

function getRegionalBySlug(slug: string): RegionalPackage | undefined {
  if (globalPackage.slug === slug) return globalPackage;
  return regionalPackages.find(p => p.slug === slug);
}

export default function RegionalEsim() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const pkg = slug ? getRegionalBySlug(slug) : undefined;

  if (!pkg) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="bg-white border-b border-gray-100 pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-blue-600 transition-colors">{t.countryEsim.home}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/packages" className="hover:text-blue-600 transition-colors">eSIM</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium uppercase">{pkg.name}</span>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            to="/packages"
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
              {pkg.plans.map((plan, i) => (
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
                  <a
                    href={`${WA_LINK}?text=${encodeURIComponent(
                      `Hi! I would like to buy an eSIM package for ${pkg.name} region: ${plan.gb}GB (${plan.days} days). Price: ${plan.price}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold text-base hover:bg-[#20bd5a] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-200"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {t.esimPackages.buyButton}
                  </a>
                </div>
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
