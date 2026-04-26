import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MessageCircle, ArrowLeft, Wifi, Clock, Globe, ChevronRight, Loader2, Zap, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePackages } from '../contexts/PackagesContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import {
  fetchAllPackagesForCountry,
  countryCodeToFlag,
  getCountryName,
  formatPrice,
  formatGB,
  type ESIMPackageRaw,
} from '../services/esimApi';

const WA_LINK = 'https://wa.me/994512778085';

function PlanCard({ pkg, countryName, flag }: { pkg: ESIMPackageRaw; countryName: string; flag: string }) {
  const { t } = useLanguage();
  const gb = formatGB(pkg.volume);
  const price = formatPrice(pkg.price);
  const isMultiCountry = (pkg.location || '').split(',').length > 1;

  const waMsg = encodeURIComponent(
    `Hi! I'd like to buy an eSIM for ${countryName}.\n📦 Plan: ${pkg.name}\n📊 Data: ${gb}\n⏱ Validity: ${pkg.duration} ${pkg.durationUnit}\n💰 Price: ${price}\n📦 Code: ${pkg.packageCode}`
  );

  return (
    <div className={`bg-white rounded-2xl border p-6 hover:shadow-xl transition-all duration-300 group flex flex-col ${
      pkg.favorite ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-100'
    }`}>
      {pkg.favorite && (
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-bold">⭐ Best Value</span>
        </div>
      )}

      {/* Price header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-2xl font-extrabold text-gray-900">{price}</span>
          {isMultiCountry && (
            <span className="ml-2 text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">Multi-country</span>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">{pkg.speed}</div>
          <div className="text-xs text-gray-400">{pkg.activeType === 1 ? 'Auto-activate' : 'Manual'}</div>
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
            <p className="text-sm font-bold text-gray-900">{gb}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <Clock className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t.countryEsim.validity}</p>
            <p className="text-sm font-bold text-gray-900">{pkg.duration} {pkg.durationUnit}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
            <Globe className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{t.countryEsim.coverage}</p>
            <p className="text-sm font-bold text-gray-900 truncate max-w-[140px]">{pkg.description || countryName}</p>
          </div>
        </div>
      </div>

      {/* Buy button */}
      <a
        href={`${WA_LINK}?text=${waMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#20bd5a] transition-colors mt-auto"
      >
        <MessageCircle className="w-4 h-4" />
        {t.esimPackages.buyButton}
      </a>
    </div>
  );
}

export default function CountryEsim() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const { liveCountryGroups } = usePackages();

  const [packages, setPackages] = useState<ESIMPackageRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve country code from slug (slug = lowercase ISO code)
  const countryCode = slug?.toUpperCase() || '';
  const countryName = getCountryName(countryCode);
  const flag = countryCodeToFlag(countryCode);

  // Nearby countries from live data for sidebar
  const popularCountries = liveCountryGroups.slice(0, 10).filter(g => g.countryCode !== countryCode);

  useEffect(() => {
    if (!countryCode) return;
    setLoading(true);
    setError(null);
    window.scrollTo(0, 0);

    fetchAllPackagesForCountry(countryCode)
      .then(pkgs => {
        // Sort: favorite first, then by price
        const sorted = [...pkgs].sort((a, b) => {
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          return a.price - b.price;
        });
        setPackages(sorted);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [countryCode]);

  // If country code is invalid/unknown, show not found
  if (!countryCode || (!loading && packages.length === 0 && !error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-6xl mb-4">😕</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Country not found</h2>
            <p className="text-gray-500 mb-6">No eSIM packages available for "{slug}"</p>
            <Link to="/packages" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
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
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 to-[#0A0F1C] pt-28 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link to="/" className="hover:text-white transition-colors">{t.countryEsim.home}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/packages" className="hover:text-white transition-colors">eSIM</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white font-medium">{countryName}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <span className="text-7xl leading-none">{flag}</span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
                {countryName} eSIM
              </h1>
              <p className="text-gray-400 text-lg">{t.countryEsim.subtitle}</p>
              {!loading && (
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
                    <Zap className="w-4 h-4" /> {packages.length} plans available
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-400 text-sm font-medium">
                    <Shield className="w-4 h-4" /> Instant delivery via WhatsApp
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link to="/packages"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            {t.countryEsim.backToAll}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Plans */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-6">{t.countryEsim.availablePlans}</h2>

              {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-gray-500">Loading plans for {countryName}...</p>
                </div>
              )}

              {error && (
                <div className="py-10 text-center text-red-500 font-medium">
                  Error loading plans: {error}
                </div>
              )}

              {!loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {packages.map((pkg, i) => (
                    <PlanCard key={i} pkg={pkg} countryName={countryName} flag={flag} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t.countryEsim.popularDestinations}</h3>
                <div className="space-y-1">
                  {popularCountries.slice(0, 8).map((c, i) => (
                    <Link key={i} to={`/${c.countryCode.toLowerCase()}`}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors group">
                      <span className="text-xl">{c.flag}</span>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors flex-1">
                        {c.countryName}
                      </span>
                      <span className="text-xs text-green-600 font-semibold">
                        {c.packages[0] ? formatPrice(c.packages[0].price) : ''}
                      </span>
                    </Link>
                  ))}
                </div>
                <Link to="/packages"
                  className="block text-center text-sm text-blue-600 font-semibold mt-4 py-2 hover:underline">
                  {t.countryEsim.viewAll} →
                </Link>
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
