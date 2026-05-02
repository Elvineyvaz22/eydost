import { useState, useMemo } from 'react';
import { Search, Rocket, MapPin, Globe2, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePackages } from '../contexts/PackagesContext';
import type { PackageData, RegionalPackage } from '../data/esimPackages';
import FlagImage from './FlagImage';
import { trackEvent, EVENTS } from '../utils/analytics';

/* ─── Country row card (Airalo style) ─── */
function CountryCard({ pkg }: { pkg: PackageData }) {
  const { t } = useLanguage();
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

/* ─── Regional row card ─── */
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

/* ─── Main component ─── */
type Tab = 'popular' | 'countries' | 'regional' | 'global';

export default function EsimPackages() {
  const { t } = useLanguage();
  const { 
    packages: staticPackages, 
    regionalPackages: staticRegional, 
    globalPackage: staticGlobal,
    liveCountryGroups,
    liveRegionalPackages
  } = usePackages();
  const [tab, setTab] = useState<Tab>('popular');
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const esimT = t.esimPackages as Record<string, string>;

  // Use live data if available
  const activePackages = useMemo(() => {
    if (liveCountryGroups && liveCountryGroups.length > 0) {
      return liveCountryGroups.map(group => ({
        country: group.countryName,
        countryCode: group.countryCode,
        flag: group.flag,
        slug: `${group.countryName.toLowerCase().replace(/\s+/g, '-')}-esim`,
        featured: group.packages[0]?.favorite || false,
        plans: group.packages.map(p => ({
          price: `$${((p.price / 10000) * 1.75).toFixed(2)}`,
        }))
      })) as any[];
    }
    return staticPackages;
  }, [liveCountryGroups, staticPackages]);

  const activeRegional = useMemo(() => {
    if (liveRegionalPackages && liveRegionalPackages.length > 0) {
      return liveRegionalPackages.map(p => ({
        name: p.name,
        slug: `${p.name.toLowerCase().replace(/\s+/g, '-')}-esim`,
        flags: p.location.split(',').slice(0, 4).map(code => code.trim().toUpperCase()),
        countryCount: p.location.split(',').length,
        plans: [{ price: `$${((p.price / 10000) * 1.75).toFixed(2)}` }]
      })) as any[];
    }
    return staticRegional;
  }, [liveRegionalPackages, staticRegional]);

  const featured = activePackages.filter(p => p.featured || true).slice(0, 4); // Show first 4 if none marked featured
  const allSorted = [...activePackages].sort((a, b) => a.country.localeCompare(b.country));

  const searchResults = search.length > 0
    ? activePackages.filter(p => p.country.toLowerCase().includes(search.toLowerCase())).slice(0, 4)
    : [];
  const isSearching = search.length > 0;

  // Qalan ölkələri sadəcə 4 dənə göstəririk
  const displayList = isSearching ? searchResults : (showAll ? allSorted : allSorted.slice(0, 4));

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'popular',   label: esimT.tabPopular,   icon: <Rocket className="w-4 h-4" /> },
    { key: 'countries', label: esimT.tabCountries,  icon: <MapPin className="w-4 h-4" /> },
    { key: 'regional',  label: esimT.tabRegional,   icon: <Globe2 className="w-4 h-4" /> },
    { key: 'global',    label: esimT.tabGlobal,     icon: <Globe className="w-4 h-4" /> },
  ];

  return (
    <section id="esim-packages" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{esimT.title}</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">{esimT.subtitle}</p>
        </div>

        {/* Search — always visible */}
        <div className="max-w-md mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                if (e.target.value.length > 2) {
                  trackEvent(EVENTS.ESIM_SEARCH, { query: e.target.value });
                }
              }}
              placeholder={esimT.searchPlaceholder}
              className="w-full pl-12 pr-5 py-3.5 border-transparent bg-gray-100 rounded-full focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 outline-none text-sm shadow-sm transition-all placeholder-gray-400"
            />
          </div>
        </div>

        {/* Search results — shown when searching */}
        {isSearching ? (
          searchResults.length === 0 ? (
            <div className="text-center py-16 text-gray-400">{esimT.noResults}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {searchResults.map((pkg, i) => (
                <CountryCard key={i} pkg={pkg} />
              ))}
            </div>
          )
        ) : (
        <>
        {/* Tabs — shown when NOT searching */}
        <div className="flex items-center justify-center gap-1 mb-8 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit mx-auto">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setShowAll(false); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                tab === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── POPULAR TAB ── */}
        {tab === 'popular' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {featured.map((pkg, i) => (
                <CountryCard key={i} pkg={pkg} />
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                to="/packages"
                className="inline-flex items-center gap-2 border border-gray-200 bg-white rounded-full px-6 py-2.5 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all"
              >
                {esimT.viewAllCountries} →
              </Link>
            </div>
          </div>
        )}

        {/* ── COUNTRIES TAB ── */}
        {tab === 'countries' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayList.map((pkg, i) => (
                <CountryCard key={i} pkg={pkg} />
              ))}
            </div>
            {allSorted.length > 4 && (
              <div className="text-center mt-8">
                <Link
                  to="/packages"
                  className="inline-flex items-center gap-2 border border-gray-200 bg-white rounded-full px-6 py-2.5 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-all"
                >
                  {esimT.viewAllCountries} →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── REGIONAL TAB ── */}
        {tab === 'regional' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeRegional.slice(0, 4).map((pkg, i) => (
              <RegionalCard key={i} pkg={pkg} />
            ))}
          </div>
        )}

        {/* ── GLOBAL TAB ── */}
        {tab === 'global' && (
          <div className="max-w-md mx-auto">
            <Link
              to={`/${staticGlobal.slug}`}
              className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-6 py-5 hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="text-3xl leading-none">🌍</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {staticGlobal.name} eSIM
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {staticGlobal.countryCount} {esimT.countriesLabel}
                </p>
              </div>
              <span className="text-sm font-bold text-gray-900">
                {staticGlobal.plans[0]?.price}
              </span>
            </Link>
          </div>
        )}
        </>
        )}

      </div>
    </section>
  );
}
