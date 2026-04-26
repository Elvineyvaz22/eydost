import { useState, useEffect } from 'react';
import { Search, ArrowLeft, Globe2, MapPin, Rocket, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePackages } from '../contexts/PackagesContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import FlagImage from '../components/FlagImage';
import type { PackageData, RegionalPackage } from '../data/esimPackages';

function CountryCard({ pkg }: { pkg: PackageData }) {
  return (
    <Link
      to={`/${pkg.slug}`}
      className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex-shrink-0">
        <FlagImage flag={pkg.flag} countryCode={pkg.countryCode} size="md" className="rounded-md" />
      </div>
      <span className="flex-1 text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
        {pkg.country}
      </span>
      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
        {pkg.plans[0]?.price}
      </span>
    </Link>
  );
}

function RegionalCard({ pkg }: { pkg: RegionalPackage }) {
  const { t } = useLanguage();
  const esimT = t.esimPackages as Record<string, string>;
  return (
    <Link
      to={`/${pkg.slug}`}
      className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex-shrink-0 flex gap-0.5">
        {pkg.flags.slice(0, 2).map((f, i) => (
          <FlagImage key={i} flag={f} size="sm" className="rounded-sm" />
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
          {pkg.name}
        </p>
        <p className="text-xs text-gray-400">{pkg.countryCount} {esimT.countriesLabel}</p>
      </div>
      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
        {pkg.plans[0]?.price}
      </span>
    </Link>
  );
}

export default function AllPackages() {
  const { t } = useLanguage();
  const { packages, regionalPackages, globalPackage } = usePackages();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'countries' | 'regional' | 'global'>('all');

  const esimT = t.esimPackages as Record<string, string>;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredCountries = packages.filter(p => 
    p.country.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => a.country.localeCompare(b.country));

  const filteredRegional = regionalPackages.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const showGlobal = globalPackage.name.toLowerCase().includes(search.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.countryEsim.home}
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                {esimT.tabCountries}
              </h1>
              <p className="text-lg text-gray-500">
                {esimT.subtitle}
              </p>
            </div>

            {/* Search */}
            <div className="w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={esimT.searchPlaceholder}
                  className="w-full pl-12 pr-5 py-3.5 border-transparent bg-white rounded-2xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 outline-none text-sm shadow-sm transition-all placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {[
              { id: 'all', label: esimT.filterAll, icon: <Rocket className="w-4 h-4" /> },
              { id: 'countries', label: esimT.tabCountries, icon: <MapPin className="w-4 h-4" /> },
              { id: 'regional', label: esimT.tabRegional, icon: <Globe2 className="w-4 h-4" /> },
              { id: 'global', label: esimT.tabGlobal, icon: <Globe className="w-4 h-4" /> },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  tab === t.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-500 hover:text-gray-800 border border-gray-100'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Regional Packages Section */}
          {(tab === 'all' || tab === 'regional') && filteredRegional.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Globe2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">{esimT.tabRegional}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredRegional.map((pkg, i) => (
                  <RegionalCard key={i} pkg={pkg} />
                ))}
              </div>
            </div>
          )}

          {/* Global Package Section */}
          {(tab === 'all' || tab === 'global') && showGlobal && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Globe className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">{esimT.tabGlobal}</h2>
              </div>
              <div className="max-w-sm">
                <RegionalCard pkg={globalPackage} />
              </div>
            </div>
          )}

          {/* Countries Section */}
          {(tab === 'all' || tab === 'countries') && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">{esimT.tabCountries}</h2>
              </div>
              
              {filteredCountries.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-400">{esimT.noResults}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {filteredCountries.map((pkg, i) => (
                    <CountryCard key={i} pkg={pkg} />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
