import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ArrowLeft, Globe2, MapPin, Rocket, Globe, ChevronRight, X, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePackages } from '../contexts/PackagesContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import FlagImage from '../components/FlagImage';
import { formatPrice, type ESIMCountryGroup, type ESIMPackageRaw } from '../services/esimApi';

function LiveCountryCard({ group }: { group: ESIMCountryGroup }) {
  const { t } = useLanguage();
  const esimT = t.esimPackages as Record<string, string>;
  const cheapest = group.packages[0];
  
  return (
    <Link
      to={`/${group.countryCode.toLowerCase()}`}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FlagImage flag={group.flag} countryCode={group.countryCode} size="md" className="rounded-full shadow-sm" />
          <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {group.countryName}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1 duration-300" />
      </div>
      
      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {esimT.costPerGB || 'From'}
        </span>
        <span className="text-lg font-extrabold text-green-600">
          {cheapest ? formatPrice(cheapest.price) : '—'}
        </span>
      </div>
    </Link>
  );
}

function LiveRegionalCard({ pkg }: { pkg: ESIMPackageRaw }) {
  const { t } = useLanguage();
  const esimT = t.esimPackages as Record<string, string>;
  const locs = (pkg.location || '').split(',');
  
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {locs.slice(0, 3).map((f, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center text-sm overflow-hidden">
                <FlagImage flag="" countryCode={f.trim()} size="sm" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
            {pkg.name}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1 duration-300" />
      </div>

      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">
            {esimT.costPerGB || 'From'}
          </span>
          <span className="text-[10px] text-gray-400">{locs.length} {esimT.countriesLabel || 'countries'}</span>
        </div>
        <span className="text-lg font-extrabold text-green-600">
          {formatPrice(pkg.price)}
        </span>
      </div>
    </div>
  );
}

export default function AllPackages() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { liveCountryGroups, liveRegionalPackages, liveLoading, packages, regionalPackages, globalPackage } = usePackages();
  
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'countries' | 'regional' | 'global'>('countries');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const esimT = t.esimPackages as Record<string, string>;

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Close suggestions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = useMemo(() => {
    return liveCountryGroups
      .filter(p => (p.countryName || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a.countryName || '').localeCompare(b.countryName || ''));
  }, [liveCountryGroups, search]);

  const filteredRegional = useMemo(() => {
    return liveRegionalPackages.filter(p => 
      (p.name || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [liveRegionalPackages, search]);

  const suggestions = useMemo(() => {
    if (search.length === 0) return [];
    return [...filteredCountries].slice(0, 5);
  }, [filteredCountries, search]);

  const showGlobal = (globalPackage?.name || '').toLowerCase().includes(search.toLowerCase());

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
            
            {/* Search Bar with Suggestions */}
            <div ref={searchRef} className="relative max-w-2xl mx-auto mt-10 z-30">
              <div className="relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={e => {
                    setSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder={esimT.searchPlaceholder}
                  className="w-full pl-16 pr-14 py-5 bg-white border-2 border-transparent rounded-full shadow-2xl focus:border-blue-500 focus:ring-0 outline-none text-lg transition-all placeholder-gray-400"
                />
                {search.length > 0 && (
                  <button
                    onClick={() => { setSearch(''); setShowSuggestions(false); }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-2">
                    {suggestions.map((pkg, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          navigate(`/${pkg.countryCode.toLowerCase()}`);
                          setShowSuggestions(false);
                        }}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <FlagImage flag={pkg.flag} countryCode={pkg.countryCode} size="md" className="rounded-full" />
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {pkg.countryName} eSIM Plans
                            </span>
                            <span className="text-xs text-gray-400">Instant delivery via WhatsApp</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center justify-center gap-2 mt-12">
              {[
                { id: 'countries', label: esimT.tabCountries, count: liveCountryGroups.length },
                { id: 'regional', label: esimT.tabRegional, count: liveRegionalPackages.length },
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

          {liveLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Regional Grid */}
              {tab === 'regional' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredRegional.map((pkg, i) => (
                    <LiveRegionalCard key={i} pkg={pkg} />
                  ))}
                  {filteredRegional.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-400">
                      {esimT.noResults}
                    </div>
                  )}
                </div>
              )}

              {/* Global Card - For now just using the old global logic since we only have one or we can fetch a specific global package */}
              {tab === 'global' && (
                <div className="max-w-sm">
                  {showGlobal ? (
                    <div className="py-10 text-center text-gray-400">Global package integration in progress...</div>
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
                  {filteredCountries.map((group, i) => (
                    <LiveCountryCard key={i} group={group} />
                  ))}
                  {filteredCountries.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-400">
                      {esimT.noResults}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
