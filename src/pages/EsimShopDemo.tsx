/**
 * EsimShopDemo
 * =============
 * Mobile-first eSIM shop demo with Airalo-style bottom tab bar.
 * Route: `/esim-shop-demo`.
 *
 * Tabs:
 *  - Shop      — country browsing + search
 *  - My eSIMs  — active subscriptions (mock for demo)
 *  - Balance   — overall data + history summary (mock for demo)
 *
 * Heç bir backend dəyişikliyi tələb etmir. Real inteqrasiya hazır olduqda
 * eSIMs/Balance view-ları `esimAccountApi.ts` çağırışları ilə dolduracaq.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  MessageCircle,
  Sparkles,
  Globe2,
  X,
  Plane,
  ShoppingBag,
  Smartphone,
  Wallet,
  Wifi,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Loader2,
  Eye,
} from 'lucide-react';
import Header from '../components/Header';
import Seo from '../components/Seo';
import FlagImage from '../components/FlagImage';
import { useLanguage } from '../contexts/LanguageContext';
import { usePackages } from '../contexts/PackagesContext';
import {
  ESIM_BOT_WHATSAPP_URL,
  getCustomerEsims,
  getCustomerOrders,
  type EsimResponse,
  type OrderResponse,
} from '../services/esimAccountApi';
import type { PackageData, RegionalPackage } from '../data/esimPackages';

// ── Static config ───────────────────────────────────────────────────────────

const POPULAR_CODES = [
  'TR', 'GE', 'AE', 'RU', 'DE', 'GB', 'US', 'FR', 'IT', 'ES',
];
const QUICK_CHIP_CODES = ['TR', 'GE', 'AE', 'RU', 'DE', 'GB'];

type Lang = 'en' | 'az' | 'ru';
type TabId = 'shop' | 'esims' | 'balance';

const tr = (lang: Lang, en: string, az: string, ru?: string) => {
  if (lang === 'az') return az;
  if (lang === 'ru' && ru) return ru;
  return en;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function priceOf(p: { price: string }) {
  return parseFloat(p.price.replace(/[^\d.]/g, '')) || Infinity;
}
function findCheapest(plans: PackageData['plans']) {
  if (!plans || plans.length === 0) return null;
  return plans.reduce((a, b) => (priceOf(a) < priceOf(b) ? a : b));
}
function formatGB(gb: number) {
  if (gb < 1) return `${Math.round(gb * 1000)} MB`;
  return `${gb} GB`;
}

// ── Mock data for eSIMs + Balance tabs ──────────────────────────────────────

interface MockEsim {
  id: string;
  country: string;
  countryCode: string;
  planName: string;
  dataUsedGB: number;
  dataTotalGB: number;
  daysLeft: number;
  totalDays: number;
  status: 'active' | 'expiring' | 'expired';
  iccid: string;
}

const MOCK_ESIMS: MockEsim[] = [
  {
    id: 'esim-1',
    country: 'Turkey',
    countryCode: 'TR',
    planName: '5 GB · 30 days',
    dataUsedGB: 1.8,
    dataTotalGB: 5,
    daysLeft: 18,
    totalDays: 30,
    status: 'active',
    iccid: '89014104272 1100 4502',
  },
  {
    id: 'esim-2',
    country: 'Georgia',
    countryCode: 'GE',
    planName: '3 GB · 15 days',
    dataUsedGB: 2.7,
    dataTotalGB: 3,
    daysLeft: 2,
    totalDays: 15,
    status: 'expiring',
    iccid: '89014104272 1100 4519',
  },
];

interface MockOrder {
  id: string;
  country: string;
  countryCode: string;
  planName: string;
  price: string;
  date: string;
  status: 'paid' | 'pending';
}
const MOCK_ORDERS: MockOrder[] = [
  {
    id: 'ord-001',
    country: 'Turkey',
    countryCode: 'TR',
    planName: '5 GB · 30 days',
    price: '$7.05',
    date: '14 May 2026',
    status: 'paid',
  },
  {
    id: 'ord-002',
    country: 'Georgia',
    countryCode: 'GE',
    planName: '3 GB · 15 days',
    price: '$3.85',
    date: '8 May 2026',
    status: 'paid',
  },
  {
    id: 'ord-003',
    country: 'UAE',
    countryCode: 'AE',
    planName: '1 GB · 7 days',
    price: '$5.95',
    date: '22 Apr 2026',
    status: 'paid',
  },
];

// ── Atom components ─────────────────────────────────────────────────────────

function QuickChip({ pkg }: { pkg: PackageData }) {
  return (
    <Link
      to={`/${pkg.slug}`}
      className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-gray-100 hover:border-blue-200 hover:shadow-sm active:scale-95 transition-all flex-shrink-0"
    >
      <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-100">
        <FlagImage countryCode={pkg.countryCode} size="full" />
      </div>
      <span className="text-sm font-semibold text-gray-900">{pkg.country}</span>
    </Link>
  );
}

function CountryCard({ pkg, lang }: { pkg: PackageData; lang: Lang }) {
  const cheapest = findCheapest(pkg.plans);
  const planCount = pkg.plans?.length ?? 0;
  return (
    <Link
      to={`/${pkg.slug}`}
      className="group flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-3 hover:border-blue-200 hover:shadow-md active:scale-[0.99] transition-all"
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 shadow-sm">
        <FlagImage countryCode={pkg.countryCode} size="full" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-gray-900 truncate text-[15px] leading-tight">
          {pkg.country}
        </div>
        <div className="text-xs text-gray-400 mt-1 truncate">
          {planCount > 0
            ? `${planCount} ${tr(lang, 'plans', 'paket')}${
                cheapest
                  ? ` · ${formatGB(cheapest.gb)} / ${cheapest.days}${tr(lang, 'd', 'g')}`
                  : ''
              }`
            : tr(lang, 'No plans', 'Paket yoxdur')}
        </div>
      </div>
      {cheapest ? (
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <div className="flex items-baseline gap-1 px-3 py-1.5 bg-green-50 rounded-full border border-green-100 group-hover:bg-green-100 transition-colors">
            <span className="text-[9px] font-semibold text-green-700 uppercase tracking-wider">
              {tr(lang, 'from', 'min.')}
            </span>
            <span className="text-base font-extrabold text-green-700 leading-none">
              {cheapest.price}
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      ) : (
        <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
      )}
    </Link>
  );
}

function RegionCard({ region, lang }: { region: RegionalPackage; lang: Lang }) {
  const cheapest = findCheapest(region.plans);
  return (
    <Link
      to={`/${region.slug}`}
      className="flex-shrink-0 w-44 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-sm hover:shadow-md active:scale-[0.97] transition-all"
    >
      <div className="flex -space-x-1.5 mb-3">
        {region.flags.slice(0, 4).map((f, i) => (
          <div
            key={i}
            className="w-7 h-7 rounded-full border-2 border-blue-700 bg-white/10 flex items-center justify-center text-sm overflow-hidden"
          >
            {f}
          </div>
        ))}
      </div>
      <div className="font-bold text-sm">{region.name}</div>
      <div className="text-[10px] text-blue-100 mt-0.5">
        {region.countryCount} {tr(lang, 'countries', 'ölkə')}
      </div>
      {cheapest && (
        <div className="mt-3 pt-3 border-t border-white/15">
          <div className="text-[10px] text-blue-200 uppercase tracking-wider">
            {tr(lang, 'from', 'başlayır')}
          </div>
          <div className="text-lg font-extrabold leading-tight">
            {cheapest.price}
          </div>
        </div>
      )}
    </Link>
  );
}

function EsimCard({ esim, lang }: { esim: MockEsim; lang: Lang }) {
  const pct = Math.min(100, (esim.dataUsedGB / esim.dataTotalGB) * 100);
  const remaining = Math.max(0, esim.dataTotalGB - esim.dataUsedGB);
  const statusMap = {
    active: {
      label: tr(lang, 'Active', 'Aktiv'),
      cls: 'bg-green-100 text-green-700 border-green-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    expiring: {
      label: tr(lang, 'Expiring soon', 'Tezliklə bitir'),
      cls: 'bg-amber-100 text-amber-700 border-amber-200',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
    expired: {
      label: tr(lang, 'Expired', 'Bitib'),
      cls: 'bg-gray-100 text-gray-500 border-gray-200',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
  } as const;
  const st = statusMap[esim.status];
  const barColor =
    esim.status === 'expiring'
      ? 'bg-amber-500'
      : esim.status === 'expired'
        ? 'bg-gray-300'
        : 'bg-green-500';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
            <FlagImage countryCode={esim.countryCode} size="full" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-gray-900 truncate">{esim.country}</div>
            <div className="text-xs text-gray-500 mt-0.5">{esim.planName}</div>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border ${st.cls} flex-shrink-0`}
        >
          {st.icon}
          <span>{st.label}</span>
        </div>
      </div>

      {/* Data bar */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xs text-gray-500">
            {tr(lang, 'Data left', 'Qalan data')}
          </span>
          <span className="text-sm font-bold text-gray-900">
            {formatGB(remaining)} / {formatGB(esim.dataTotalGB)}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all rounded-full`}
            style={{ width: `${100 - pct}%` }}
          />
        </div>
      </div>

      {/* Days */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {esim.daysLeft} {tr(lang, 'days left', 'gün qaldı')}
          </span>
        </div>
        <div className="font-mono text-[10px] text-gray-400">
          ICCID …{esim.iccid.slice(-4)}
        </div>
      </div>
    </div>
  );
}

// ── Tab views ───────────────────────────────────────────────────────────────

function ShopView({
  lang,
  packages,
  regionalPackages,
  globalPackage,
}: {
  lang: Lang;
  packages: PackageData[];
  regionalPackages: RegionalPackage[];
  globalPackage: RegionalPackage;
}) {
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const popularPackages = useMemo(() => {
    const map = new Map(packages.map((p) => [p.countryCode.toUpperCase(), p]));
    return POPULAR_CODES.map((c) => map.get(c)).filter(
      (x): x is PackageData => x !== undefined,
    );
  }, [packages]);

  const quickChips = useMemo(() => {
    const map = new Map(packages.map((p) => [p.countryCode.toUpperCase(), p]));
    return QUICK_CHIP_CODES.map((c) => map.get(c)).filter(
      (x): x is PackageData => x !== undefined,
    );
  }, [packages]);

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return packages
      .filter(
        (p) =>
          p.country.toLowerCase().includes(q) ||
          p.countryCode.toLowerCase().includes(q),
      )
      .sort((a, b) => a.country.localeCompare(b.country))
      .slice(0, 30);
  }, [packages, search]);

  const allRegions = useMemo(
    () => [...regionalPackages, globalPackage],
    [regionalPackages, globalPackage],
  );

  const showSearchResults = search.trim().length > 0;

  return (
    <>
      {/* Sticky search */}
      <div
        className={`sticky top-16 lg:top-20 z-20 bg-gradient-to-b from-gray-50 to-gray-50/95 backdrop-blur-md transition-shadow ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={tr(
                lang,
                'Search country (e.g. Turkey, US, GE)',
                'Ölkə axtar (Türkiyə, AE, GE)',
                'Поиск страны',
              )}
              className={`w-full pl-11 pr-10 py-3 bg-white border ${
                searchFocused ? 'border-blue-300' : 'border-gray-200'
              } rounded-full shadow-sm focus:border-blue-500 focus:ring-0 outline-none text-sm font-medium placeholder-gray-400 transition-colors`}
            />
            {search.length > 0 && (
              <button
                onClick={() => {
                  setSearch('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto px-4 pt-2">
        {showSearchResults ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 mb-2 px-1">
              {filteredCountries.length} {tr(lang, 'results', 'nəticə')} · "{search}"
            </h2>
            {filteredCountries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <Globe2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <div className="text-sm text-gray-500">
                  {tr(lang, 'No country matches', 'Uyğun ölkə tapılmadı')}
                </div>
              </div>
            ) : (
              filteredCountries.map((p) => (
                <CountryCard key={p.slug} pkg={p} lang={lang} />
              ))
            )}
          </section>
        ) : (
          <>
            {/* Hero */}
            <section className="pt-4 pb-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold mb-3">
                <Plane className="w-3.5 h-3.5" />
                {tr(lang, 'Stay connected worldwide', 'Səyahətdə online qal')}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                {tr(lang, 'Where are you going?', 'Hara gedirsən?')}
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                {tr(
                  lang,
                  'Pick a country → order on WhatsApp → activate by QR.',
                  'Ölkə seç → WhatsApp-da sifariş ver → QR-la aktivləşdir.',
                )}
              </p>
            </section>

            <section className="mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                {quickChips.map((p) => (
                  <QuickChip key={p.slug} pkg={p} />
                ))}
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-bold text-gray-900">
                  {tr(lang, 'Popular destinations', 'Populyar destinasiyalar')}
                </h2>
              </div>
              <div className="space-y-2">
                {popularPackages.map((p) => (
                  <CountryCard key={p.slug} pkg={p} lang={lang} />
                ))}
              </div>
            </section>

            <section className="mb-8">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Globe2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-gray-900">
                  {tr(lang, 'Travel multiple countries', 'Çox ölkə bir paketdə')}
                </h2>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                {allRegions.map((r) => (
                  <RegionCard key={r.slug} region={r} lang={lang} />
                ))}
              </div>
            </section>

            <section className="mb-8">
              <Link
                to="/esim"
                className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-200 hover:shadow-sm active:scale-[0.99] transition-all"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    {tr(lang, 'Browse all countries', 'Bütün ölkələrə bax')}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {packages.length}+{' '}
                    {tr(lang, 'destinations covered', 'destinasiya')}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </Link>
            </section>
          </>
        )}
      </div>
    </>
  );
}

// ── Identity banner ─────────────────────────────────────────────────────────

function IdentityBanner({
  lang,
  waId,
}: {
  lang: Lang;
  waId: string | null;
}) {
  if (!waId) {
    return (
      <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-full text-[11px] text-amber-800">
        <Eye className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="font-semibold">{tr(lang, 'Demo mode', 'Demo rejimi')}</span>
        <span className="opacity-75">·</span>
        <span className="opacity-75 truncate">
          {tr(
            lang,
            'sample data — log in via WhatsApp link',
            'nümunə data — WhatsApp linkindən aç',
          )}
        </span>
      </div>
    );
  }
  return (
    <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-full text-[11px] text-blue-800">
      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="font-semibold">
        {tr(lang, 'Signed in as', 'Daxil olub')}
      </span>
      <span className="font-mono">+{waId}</span>
    </div>
  );
}

// ── Data fetch hook ─────────────────────────────────────────────────────────

interface CustomerData {
  esims: EsimResponse[] | null;
  orders: OrderResponse[] | null;
  loading: boolean;
  error: string | null;
}

function useCustomerData(waId: string | null): CustomerData {
  const [state, setState] = useState<CustomerData>({
    esims: null,
    orders: null,
    loading: !!waId,
    error: null,
  });

  useEffect(() => {
    if (!waId) {
      setState({ esims: null, orders: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ esims: null, orders: null, loading: true, error: null });

    Promise.allSettled([getCustomerEsims(waId), getCustomerOrders(waId)]).then(
      ([esimsRes, ordersRes]) => {
        if (cancelled) return;
        const esims = esimsRes.status === 'fulfilled' ? esimsRes.value : [];
        const orders = ordersRes.status === 'fulfilled' ? ordersRes.value : [];
        const errMsg =
          esimsRes.status === 'rejected'
            ? (esimsRes.reason?.message ?? 'Failed to load eSIMs')
            : ordersRes.status === 'rejected'
              ? (ordersRes.reason?.message ?? 'Failed to load orders')
              : null;
        setState({ esims, orders, loading: false, error: errMsg });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [waId]);

  return state;
}

// ── Real-data card (compact) ────────────────────────────────────────────────

function RealEsimCard({ esim, lang }: { esim: EsimResponse; lang: Lang }) {
  const statusRaw = (esim.status || 'unknown').toLowerCase();
  const isActive = ['active', 'in_use', 'installed'].includes(statusRaw);
  const isExpired = ['expired', 'depleted', 'cancelled'].includes(statusRaw);
  const statusCls = isActive
    ? 'bg-green-100 text-green-700 border-green-200'
    : isExpired
      ? 'bg-gray-100 text-gray-500 border-gray-200'
      : 'bg-amber-100 text-amber-700 border-amber-200';
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Wifi className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-gray-900 truncate">
              eSIM #{esim.id}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
              {esim.iccid
                ? `ICCID …${esim.iccid.slice(-6)}`
                : tr(lang, 'No ICCID yet', 'ICCID hələ yox')}
            </div>
          </div>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${statusCls} flex-shrink-0`}
        >
          {esim.status || tr(lang, 'unknown', 'naməlum')}
        </div>
      </div>
      {esim.short_url && (
        <a
          href={esim.short_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-colors"
        >
          <QrCode className="w-3.5 h-3.5" />
          {tr(lang, 'Open activation QR', 'Aktivləşmə QR-ı aç')}
        </a>
      )}
    </div>
  );
}

// ── eSIMs tab view ──────────────────────────────────────────────────────────

function EsimsView({
  lang,
  waId,
  onShop,
}: {
  lang: Lang;
  waId: string | null;
  onShop: () => void;
}) {
  const { esims, loading, error } = useCustomerData(waId);

  // Demo path: no wa_id → mock data
  const isDemo = !waId;
  const realEsims = esims ?? [];

  return (
    <div className="max-w-2xl w-full mx-auto px-4 pt-5">
      <IdentityBanner lang={lang} waId={waId} />

      <div className="flex items-center justify-between mb-4 px-1">
        <h1 className="text-2xl font-extrabold text-gray-900">
          {tr(lang, 'My eSIMs', 'eSIMlərim')}
        </h1>
        {!loading && (
          <div className="text-xs text-gray-400 font-semibold">
            {isDemo ? MOCK_ESIMS.length : realEsims.length}{' '}
            {tr(lang, 'active', 'aktiv')}
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <Loader2 className="w-6 h-6 text-blue-500 mx-auto animate-spin mb-2" />
          <div className="text-xs text-gray-500">
            {tr(lang, 'Loading your eSIMs…', 'eSIM-lər yüklənir…')}
          </div>
        </div>
      ) : isDemo ? (
        <div className="space-y-3">
          {MOCK_ESIMS.map((e) => (
            <EsimCard key={e.id} esim={e} lang={lang} />
          ))}
        </div>
      ) : realEsims.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
          <Smartphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <div className="text-sm font-semibold text-gray-700 mb-1">
            {tr(lang, 'No active eSIMs', 'Aktiv eSIM yoxdur')}
          </div>
          <div className="text-xs text-gray-400 mb-5">
            {error
              ? error
              : tr(
                  lang,
                  'Buy your first eSIM in the Shop tab.',
                  'İlk eSIM-ni Mağaza tabından al.',
                )}
          </div>
          <button
            onClick={onShop}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {tr(lang, 'Go to Shop', 'Mağazaya keç')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {realEsims.map((e) => (
            <RealEsimCard key={e.id} esim={e} lang={lang} />
          ))}
        </div>
      )}

      <div className="mt-6 mb-4">
        <a
          href={ESIM_BOT_WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-200 hover:border-green-300 rounded-2xl text-sm font-semibold text-gray-700 active:scale-[0.99] transition-all"
        >
          <QrCode className="w-4 h-4 text-green-600" />
          {tr(lang, 'Get QR / Support on WhatsApp', 'QR / Dəstək — WhatsApp')}
        </a>
      </div>
    </div>
  );
}

function BalanceView({ lang, waId }: { lang: Lang; waId: string | null }) {
  const { esims, orders, loading } = useCustomerData(waId);
  const isDemo = !waId;

  const mockTotalRemainingGB = MOCK_ESIMS.reduce(
    (sum, e) => sum + Math.max(0, e.dataTotalGB - e.dataUsedGB),
    0,
  );
  const mockTotalSpentUSD = MOCK_ORDERS.filter((o) => o.status === 'paid').reduce(
    (sum, o) => sum + (parseFloat(o.price.replace(/[^\d.]/g, '')) || 0),
    0,
  );

  const realOrders = orders ?? [];
  const realEsims = esims ?? [];
  const realTotalSpentUSD = realOrders.reduce(
    (s, o) => s + (parseFloat((o.sell_price || '').replace(/[^\d.]/g, '')) || 0),
    0,
  );

  return (
    <div className="max-w-2xl w-full mx-auto px-4 pt-5">
      <IdentityBanner lang={lang} waId={waId} />

      <h1 className="text-2xl font-extrabold text-gray-900 mb-4 px-1">
        {tr(lang, 'Balance & history', 'Balans və tarixçə')}
      </h1>

      {/* Summary card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-sm mb-6">
        <div className="text-xs text-blue-100 uppercase tracking-wider mb-1">
          {tr(lang, 'Total data remaining', 'Ümumi qalan data')}
        </div>
        {loading ? (
          <div className="text-3xl font-extrabold leading-none mb-1 opacity-50">
            …
          </div>
        ) : isDemo ? (
          <>
            <div className="text-4xl font-extrabold leading-none mb-1">
              {mockTotalRemainingGB.toFixed(1)} <span className="text-2xl">GB</span>
            </div>
            <div className="text-xs text-blue-100">
              {tr(lang, 'across', 'ümumilikdə')} {MOCK_ESIMS.length}{' '}
              {tr(lang, 'active eSIMs', 'aktiv eSIM')}
            </div>
          </>
        ) : (
          <>
            <div className="text-4xl font-extrabold leading-none mb-1">
              — <span className="text-2xl">GB</span>
            </div>
            <div className="text-xs text-blue-100">
              {realEsims.length}{' '}
              {tr(lang, 'active eSIMs · per-eSIM usage soon', 'aktiv eSIM · istifadə tezliklə')}
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/15">
          <div>
            <div className="text-[10px] text-blue-200 uppercase tracking-wider">
              {tr(lang, 'Orders', 'Sifariş')}
            </div>
            <div className="text-xl font-bold">
              {isDemo ? MOCK_ORDERS.length : realOrders.length}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-blue-200 uppercase tracking-wider">
              {tr(lang, 'Total spent', 'Ümumi xərc')}
            </div>
            <div className="text-xl font-bold">
              ${(isDemo ? mockTotalSpentUSD : realTotalSpentUSD).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Order history */}
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-gray-900">
          {tr(lang, 'Recent orders', 'Son sifarişlər')}
        </h2>
        <span className="text-xs text-gray-400">
          {isDemo ? MOCK_ORDERS.length : realOrders.length}
        </span>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center mb-6">
          <Loader2 className="w-5 h-5 text-blue-500 mx-auto animate-spin" />
        </div>
      ) : isDemo ? (
        <div className="space-y-2 mb-6">
          {MOCK_ORDERS.map((o) => (
            <div
              key={o.id}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-3"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                <FlagImage countryCode={o.countryCode} size="full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {o.country} · {o.planName}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">{o.date}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-gray-900">{o.price}</div>
                <div className="text-[10px] text-green-600 font-semibold uppercase">
                  {tr(lang, 'Paid', 'Ödənilib')}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : realOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center mb-6">
          <Wallet className="w-9 h-9 text-gray-300 mx-auto mb-2" />
          <div className="text-sm text-gray-500">
            {tr(lang, 'No orders yet', 'Hələ sifariş yoxdur')}
          </div>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {realOrders.map((o) => (
            <div
              key={o.id}
              className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-3"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                <FlagImage countryCode={o.country_code} size="full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {o.country_code} · {o.package_code}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5 font-mono">
                  #{o.transaction_id?.slice(-8) ?? o.id}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-gray-900">
                  {o.sell_price
                    ? `${o.currency === 'USD' ? '$' : ''}${o.sell_price}`
                    : '—'}
                </div>
                <div className="text-[10px] text-gray-500 font-semibold uppercase">
                  {o.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <a
        href={ESIM_BOT_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-200 hover:border-green-300 rounded-2xl text-sm font-semibold text-gray-700 active:scale-[0.99] transition-all mb-4"
      >
        <MessageCircle className="w-4 h-4 text-green-600" />
        {tr(lang, 'Contact support on WhatsApp', 'Dəstək — WhatsApp')}
      </a>
    </div>
  );
}

// ── Bottom tab bar ──────────────────────────────────────────────────────────

function BottomTabBar({
  tab,
  setTab,
  lang,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
  lang: Lang;
}) {
  const items: Array<{ id: TabId; label: string; icon: typeof ShoppingBag }> = [
    {
      id: 'shop',
      label: tr(lang, 'Shop', 'Mağaza'),
      icon: ShoppingBag,
    },
    {
      id: 'esims',
      label: tr(lang, 'My eSIMs', 'eSIMlərim'),
      icon: Wifi,
    },
    {
      id: 'balance',
      label: tr(lang, 'Balance', 'Balansım'),
      icon: Wallet,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <div className="max-w-2xl mx-auto grid grid-cols-3">
        {items.map((it) => {
          const Icon = it.icon;
          const active = tab === it.id;
          return (
            <button
              key={it.id}
              onClick={() => {
                setTab(it.id);
                window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
              }}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <div
                className={`relative flex items-center justify-center transition-transform ${
                  active ? 'scale-110' : ''
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                {active && (
                  <span className="absolute -top-1.5 w-1 h-1 rounded-full bg-blue-600" />
                )}
              </div>
              <span
                className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}
              >
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── Page shell ──────────────────────────────────────────────────────────────

export default function EsimShopDemo() {
  const { language } = useLanguage();
  const lang = (language as Lang) ?? 'en';
  const { packages, regionalPackages, globalPackage } = usePackages();
  const [tab, setTab] = useState<TabId>('shop');
  const [searchParams] = useSearchParams();
  const waId = (searchParams.get('wa_id') || '').trim() || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col pt-16 lg:pt-20">
      <Seo
        title="eSIM packages"
        description="Buy global eSIM data plans on WhatsApp."
        noIndex
        canonicalPath="/esim-shop-demo"
      />
      <Header />

      <main className="flex-1 pb-24">
        {tab === 'shop' && (
          <ShopView
            lang={lang}
            packages={packages}
            regionalPackages={regionalPackages}
            globalPackage={globalPackage}
          />
        )}
        {tab === 'esims' && (
          <EsimsView lang={lang} waId={waId} onShop={() => setTab('shop')} />
        )}
        {tab === 'balance' && <BalanceView lang={lang} waId={waId} />}
      </main>

      <BottomTabBar tab={tab} setTab={setTab} lang={lang} />
    </div>
  );
}
