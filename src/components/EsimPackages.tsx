import { useState, useMemo, useEffect } from 'react';
import { Search, Rocket, MapPin, Globe2, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { usePackages } from '../contexts/PackagesContext';
import type { PackageData, RegionalPackage } from '../data/esimPackages';
import FlagImage from './FlagImage';
import { trackEvent, EVENTS } from '../utils/analytics';
import { fetchAllCountriesPackages, fetchPublicPackagesForCountry, mergeLiveCountriesWithStaticMeta, mergeStaticWithLive, getCountryNameLocalized, type ESIMPackageRaw } from '../services/esimApi';

/* ─── Country row card (Airalo style) ─── */
function CountryCard({ pkg }: { pkg: PackageData }) {
  const { language } = useLanguage();
  const countryName = getCountryNameLocalized(pkg.countryCode, language);
  return (
    <Link
      to={`/${pkg.slug}`}
      className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex-shrink-0">
        <FlagImage flag={pkg.flag} countryCode={pkg.countryCode} size="md" className="rounded-md" />
      </div>
      <span className="flex-1 text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
        {countryName || pkg.country}
      </span>
      <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
        {pkg.plans[0]?.price || '—'}
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
        {pkg.plans[0]?.price || '—'}
      </span>
    </Link>
  );
}

/* ─── Main component ─── */
type Tab = 'popular' | 'countries' | 'regional' | 'global';

export default function EsimPackages() {
  const { t, language } = useLanguage();
  const {
    packages: staticPackages,
    regionalPackages: staticRegional,
    globalPackage: staticGlobal,
  } = usePackages();
  const [tab, setTab] = useState<Tab>('popular');
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [allPkgs, setAllPkgs] = useState<Record<string, ESIMPackageRaw[]>>({});
  const [liveSearchStatus, setLiveSearchStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const esimT = t.esimPackages as Record<string, string>;

  useEffect(() => {
    setLoading(true);
    fetchAllCountriesPackages()
      .then(pkgs => { setAllPkgs(pkgs); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const liveActivePackages = useMemo(
    () => mergeLiveCountriesWithStaticMeta(staticPackages, allPkgs),
    [staticPackages, allPkgs]
  );
  const activePackages = useMemo(
    () => liveActivePackages.length > 0 ? liveActivePackages : mergeStaticWithLive(staticPackages, allPkgs),
    [staticPackages, allPkgs, liveActivePackages]
  );

  const featured = useMemo(() => {
    const marked = activePackages.filter(p => p.featured);
    return (marked.length > 0 ? marked : activePackages).slice(0, 4);
  }, [activePackages]);
  const allSorted = [...activePackages].sort((a, b) =>
    getCountryNameLocalized(a.countryCode, language).localeCompare(getCountryNameLocalized(b.countryCode, language))
  );

  const isSearching = search.trim().length > 0;
  const searchCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query || !isSearching) return [];

    return activePackages
      .filter((p) => {
        const terms = [
          getCountryNameLocalized(p.countryCode, language),
          getCountryNameLocalized(p.countryCode, 'en'),
          p.country,
          p.countryCode,
          p.slug,
        ];
        return terms.some((term) => (term || '').toLowerCase().includes(query));
      })
      .slice(0, 8);
  }, [activePackages, isSearching, language, search]);

  useEffect(() => {
    if (!isSearching || searchCandidates.length === 0) return;
    let cancelled = false;

    searchCandidates
      .filter((pkg) => liveSearchStatus[pkg.countryCode.toUpperCase()] === undefined)
      .forEach((pkg) => {
        const cc = pkg.countryCode.toUpperCase();
        fetchPublicPackagesForCountry(cc)
          .then((pkgs) => {
            if (cancelled) return;
            setLiveSearchStatus((prev) => ({
              ...prev,
              [cc]: pkgs.some((item) => (item.sell_price_minor ?? 0) > 0),
            }));
          })
          .catch(() => {
            if (cancelled) return;
            setLiveSearchStatus((prev) => ({ ...prev, [cc]: true }));
          });
      });

    return () => {
      cancelled = true;
    };
  }, [isSearching, searchCandidates, liveSearchStatus]);

  const searchResults = searchCandidates
    .filter((p) => liveSearchStatus[p.countryCode.toUpperCase()] === true)
    .slice(0, 4);
  const searchChecksPending = searchCandidates.some(
    (p) => liveSearchStatus[p.countryCode.toUpperCase()] === undefined
  );

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
              className="w-full pl-12 pr-5 py-4 border-2 border-blue-200 bg-white rounded-full focus:border-blue-500 focus:ring-4 focus:ring-blue-100/70 outline-none text-base font-semibold text-gray-900 shadow-md shadow-blue-100/70 transition-all placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Search results — shown when searching */}
        {isSearching ? (
          searchResults.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              {searchChecksPending ? (esimT.loading || 'Loading...') : esimT.noResults}
            </div>
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
                to="/esim"
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
                  to="/esim"
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
            {staticRegional.slice(0, 4).map((pkg, i) => (
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
