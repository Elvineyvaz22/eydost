import { useParams, Link, Navigate } from 'react-router-dom';
import { MessageCircle, ArrowLeft, Wifi, Clock, Globe, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { regionalPackages, globalPackage, packages } from '../data/esimPackages';
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

const regionToCountryRegion: Record<string, string[]> = {
  'europe-esim': ['europe'],
  'asia-esim': ['asia'],
  'middle-east-africa-esim': ['middleeast', 'africa'],
  'americas-esim': ['americas'],
  'global-esim': ['europe', 'asia', 'middleeast', 'africa', 'americas'],
};

export default function RegionalEsim() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const pkg = slug ? getRegionalBySlug(slug) : undefined;

  if (!pkg) return <Navigate to="/" replace />;

  const regionKeys = slug ? regionToCountryRegion[slug] || [] : [];
  const coveredCountries = packages.filter(p => regionKeys.includes(p.region));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-blue-600 transition-colors">{t.countryEsim.home}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/#esim-packages" className="hover:text-blue-600 transition-colors">eSIM</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">{pkg.name}</span>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            to="/#esim-packages"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.countryEsim.backToAll}
          </Link>

          {/* Hero */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 mb-10 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex gap-2 flex-wrap">
                {pkg.flags.map((f, i) => (
                  <FlagImage key={i} flag={f} size="lg" />
                ))}
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  {pkg.name} eSIM
                </h1>
                <p className="text-gray-600 text-lg">
                  {pkg.countryCount} {t.esimPackages.countriesLabel} - {t.countryEsim.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Plans */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t.countryEsim.availablePlans}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pkg.plans.map((plan, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
                        {i === pkg.plans.length - 1 ? t.countryEsim.bestValue : `${plan.gb}GB`}
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                    </div>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                          <Wifi className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">{t.countryEsim.data}</p>
                          <p className="text-sm font-semibold text-gray-900">{plan.gb} GB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">{t.countryEsim.validity}</p>
                          <p className="text-sm font-semibold text-gray-900">{plan.days} {t.esimPackages.days}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">{t.countryEsim.coverage}</p>
                          <p className="text-sm font-semibold text-gray-900">{pkg.name}</p>
                        </div>
                      </div>
                    </div>
                    <a
                      href={`${WA_LINK}?text=${encodeURIComponent(
                        `Hi! I would like to buy an eSIM package for ${pkg.name} region: ${plan.gb}GB (${plan.days} days). Price: ${plan.price}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#20bd5a] transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {t.esimPackages.buyButton}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar - covered countries */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t.countryEsim.coveredCountries}</h3>
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {coveredCountries.map((c, i) => (
                    <Link
                      key={i}
                      to={`/${c.slug}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <FlagImage flag={c.flag} countryCode={c.countryCode} size="sm" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors flex-1">
                        {c.country}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
