import { useState, useEffect } from 'react';
import { Search, ArrowLeft, Globe2, MapPin, Rocket, Globe, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePackages } from '../contexts/PackagesContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import FlagImage from '../components/FlagImage';
import type { PackageData, RegionalPackage } from '../data/esimPackages';

function CountryCard({ pkg }: { pkg: PackageData }) {
  const { t } = useLanguage();
  const esimT = t.esimPackages as Record<string, string>;
  
  return (
    <Link
      to={`/${pkg.slug}`}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FlagImage flag={pkg.flag} countryCode={pkg.countryCode} size="md" className="rounded-full shadow-sm" />
          <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {pkg.country}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1 duration-300" />
      </div>
      
      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {esimT.costPerGB}
        </span>
        <span className="text-lg font-extrabold text-green-600">
          {pkg.plans[0]?.price}
        </span>
      </div>
    </Link>
  );
}

function RegionalCard({ pkg }: { pkg: RegionalPackage }) {
  const { t } = useLanguage();
  const esimT = t.esimPackages as Record<string, string>;
  
  return (
    <Link
      to={`/${pkg.slug}`}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {pkg.flags.slice(0, 3).map((f, i) => (
              <FlagImage key={i} flag={f} size="sm" className="rounded-full border-2 border-white shadow-sm" />
            ))}
          </div>
          <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {pkg.name}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1 duration-300" />
      </div>

      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">
            {esimT.costPerGB}
          </span>
          <span className="text-[10px] text-gray-400">{pkg.countryCount} {esimT.countriesLabel}</span>
        </div>
        <span className="text-lg font-extrabold text-green-600">
          {pkg.plans[0]?.price}
        </span>
      </div>
    </Link>
  );
}

export default function AllPackages() {
  const { t } = useLanguage();
  const { packages, regionalPackages, globalPackage } = usePackages();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'countries' | 'regional' | 'global'>('countries');

  const esimT = t.esimPackages as Record<string, string>;

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
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gray-50 pt-32 pb-16 border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              {esimT.destinationsTitle}
            </h1>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mt-10">
              <div className="absolute left-6 top-1/2 -translate-y-1/2">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={esimT.searchPlaceholder}
                className="w-full pl-16 pr-8 py-5 bg-white border-2 border-transparent rounded-full shadow-2xl focus:border-blue-500 focus:ring-0 outline-none text-lg transition-all placeholder-gray-400"
              />
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center justify-center gap-2 mt-12">
              {[
                { id: 'countries', label: esimT.tabCountries, count: packages.length },
                { id: 'regional', label: esimT.tabRegional, count: regionalPackages.length },
                { id: 'global', label: esimT.tabGlobal, count: 1 },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id as any)}
                  className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                    tab === item.id
                      ? 'bg-gray-900 text-white shadow-lg'
                      : 'bg-white text-gray-500 hover:text-gray-900 border border-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-10">
            <Link to="/" className="hover:text-blue-600 transition-colors">Homepage</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-semibold">{esimT.tabCountries}</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {tab === 'countries' ? esimT.tabCountries : tab === 'regional' ? esimT.tabRegional : esimT.tabGlobal}
          </h2>

          {/* Regional Grid */}
          {tab === 'regional' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredRegional.map((pkg, i) => (
                <RegionalCard key={i} pkg={pkg} />
              ))}
              {filteredRegional.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400">
                  {esimT.noResults}
                </div>
              )}
            </div>
          )}

          {/* Global Card */}
          {tab === 'global' && (
            <div className="max-w-sm">
              {showGlobal ? (
                <RegionalCard pkg={globalPackage} />
              ) : (
                <div className="py-20 text-center text-gray-400">
                  {esimT.noResults}
                </div>
              )}
            </div>
          )}

          {/* Countries Grid */}
          {tab === 'countries' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredCountries.map((pkg, i) => (
                <CountryCard key={i} pkg={pkg} />
              ))}
              {filteredCountries.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400">
                  {esimT.noResults}
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
