import { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, X, Loader2, RefreshCw, Wifi } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePackages } from '../contexts/PackagesContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import { countryCodeToFlag, formatPrice, formatGB, type ESIMCountryGroup, type ESIMPackageRaw } from '../services/esimApi';

// ── Live Country Card ─────────────────────────────────────────────────────────
function LiveCountryCard({ group }: { group: ESIMCountryGroup }) {
  const cheapest = group.packages[0];
  const slug = group.countryCode.toLowerCase();

  return (
    <Link
      to={`/${slug}`}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{group.flag}</span>
          <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">
            {group.countryName}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1 duration-300" />
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
          {group.packages.length} plan
        </span>
        {cheapest?.speed && (
          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
            {cheapest.speed}
          </span>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">From</span>
        <span className="text-lg font-extrabold text-green-600">
          {cheapest ? formatPrice(cheapest.price) : '—'}
        </span>
      </div>
    </Link>
  );
}

// ── Live Regional Card ────────────────────────────────────────────────────────
function LiveRegionalCard({ pkg }: { pkg: ESIMPackageRaw }) {
  const locs = pkg.location.split(',').slice(0, 4);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {locs.map((code, i) => (
          <span key={i} className="text-xl leading-none">{countryCodeToFlag(code.trim())}</span>
        ))}
        {pkg.location.split(',').length > 4 && (
          <span className="text-xs text-gray-400">+{pkg.location.split(',').length - 4}</span>
        )}
      </div>
      <p className="font-bold text-gray-900 text-sm mb-1 group-hover:text-blue-600 transition-colors">
        {pkg.name}
      </p>
      <p className="text-xs text-gray-400 mb-4">
        {pkg.location.split(',').length} countries • {formatGB(pkg.volume)} • {pkg.duration} {pkg.durationUnit}
      </p>
      <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">{pkg.speed}</span>
        <span className="text-lg font-extrabold text-green-600">{formatPrice(pkg.price)}</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AllPackages() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { liveCountryGroups, liveRegionalPackages, liveLoading, liveError, refreshLivePackages } = usePackages();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'countries' | 'regional'>('countries');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const esimT = t.esimPackages as Record<string, string>;

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries
  const filteredCountries = liveCountryGroups.filter(g =>
    g.countryName.toLowerCase().includes(search.toLowerCase()) ||
    g.countryCode.toLowerCase().includes(search.toLowerCase())
  );

  // Filter regional
  const filteredRegional = liveRegionalPackages.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Autocomplete suggestions
  const suggestions = search.length > 0
    ? filteredCountries.slice(0, 5)
    : [];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <div className="bg-gradient-to-br from-gray-900 to-[#0A0F1C] pt-32 pb-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full mb-6">
              <Wifi className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm font-medium">
                {liveLoading ? 'Loading...' : `${liveCountryGroups.length}+ destinations`}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              {esimT.destinationsTitle}
            </h1>
            <p className="text-gray-400 text-lg mb-10">Instant delivery via WhatsApp. No app required.</p>

            {/* Search */}
            <div ref={searchRef} className="relative max-w-2xl mx-auto z-30">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
                  placeholder={esimT.searchPlaceholder || 'Search country...'}
                  className="w-full pl-14 pr-14 py-4 bg-white rounded-full shadow-2xl outline-none text-lg placeholder-gray-400 text-gray-900"
                />
                {search && (
                  <button onClick={() => { setSearch(''); setShowSuggestions(false); }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-left z-50">
                  {suggestions.map((g, i) => (
                    <button key={i}
                      onClick={() => { navigate(`/${g.countryCode.toLowerCase()}`); setShowSuggestions(false); }}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{g.flag}</span>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-blue-600">{g.countryName} eSIM</p>
                          <p className="text-xs text-gray-400">{g.packages.length} plans from {formatPrice(g.packages[0]?.price)}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-center gap-3 mt-10">
              {[
                { id: 'countries', label: esimT.tabCountries, count: liveCountryGroups.length },
                { id: 'regional', label: esimT.tabRegional, count: liveRegionalPackages.length },
              ].map(item => (
                <button key={item.id} onClick={() => setTab(item.id as any)}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                    tab === item.id
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}>
                  {item.label}
                  {!liveLoading && (
                    <span className={`ml-2 text-xs font-normal ${tab === item.id ? 'text-gray-500' : 'text-white/50'}`}>
                      ({item.count})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* Loading */}
          {liveLoading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-gray-500 font-medium">Loading {2738}+ packages from eSIM Access...</p>
            </div>
          )}

          {/* Error */}
          {!liveLoading && liveError && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="text-red-500 font-medium">Could not load live packages: {liveError}</p>
              <button onClick={refreshLivePackages}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          )}

          {/* Countries Grid */}
          {!liveLoading && !liveError && tab === 'countries' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredCountries.length} {esimT.tabCountries}
                  {search && <span className="text-blue-600 ml-2">"{search}"</span>}
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredCountries.map((g, i) => (
                  <LiveCountryCard key={i} group={g} />
                ))}
              </div>
              {filteredCountries.length === 0 && (
                <div className="py-20 text-center text-gray-400">{esimT.noResults}</div>
              )}
            </>
          )}

          {/* Regional Grid */}
          {!liveLoading && !liveError && tab === 'regional' && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredRegional.length} {esimT.tabRegional} Plans
                </h2>
                <p className="text-gray-500 text-sm mt-1">Multi-country packages for seamless travel</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredRegional.map((pkg, i) => (
                  <LiveRegionalCard key={i} pkg={pkg} />
                ))}
              </div>
              {filteredRegional.length === 0 && (
                <div className="py-20 text-center text-gray-400">{esimT.noResults}</div>
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
