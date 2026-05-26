/**
 * EsimShopCountryDemo
 * ====================
 * Mobile-first country detail page (demo).
 * Route: `/esim-shop-demo/:slug`
 *
 * Dizayn:
 *  - Hero: bayraq + ölkə + paket sayı + min qiymət
 *  - 2 tab: Limitli / Limitsiz
 *  - Limitli: skip 1-gün, curate top 6 (hər GB pilləsi üçün ən uzun müddət)
 *  - Limitsiz: hamısı, müddətə görə artan sıra ilə
 *  - Hər kart → WhatsApp bot-a deep link
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageCircle,
  Check,
  Clock,
  Zap,
  ShieldCheck,
  Infinity as InfinityIcon,
  Loader2,
} from 'lucide-react';
import Header from '../components/Header';
import Seo from '../components/Seo';
import FlagImage from '../components/FlagImage';
import { useLanguage } from '../contexts/LanguageContext';
import { usePackages } from '../contexts/PackagesContext';
import { ESIM_BOT_WHATSAPP_NUMBER } from '../services/esimAccountApi';
import {
  fetchPublicPackagesForCountry,
  formatPrice,
  type ESIMPackageRaw,
} from '../services/esimApi';
import type { PackageData } from '../data/esimPackages';

type Lang = 'en' | 'az' | 'ru';
type TabId = 'limited' | 'unlimited';

const tr = (lang: Lang, en: string, az: string, ru?: string) => {
  if (lang === 'az') return az;
  if (lang === 'ru' && ru) return ru;
  return en;
};

// ── Slug → country code resolver ────────────────────────────────────────────

const SLUG_TO_CODE: Record<string, string> = {
  'turkey-esim': 'TR', 'united-states-esim': 'US', 'germany-esim': 'DE',
  'france-esim': 'FR', 'uk-esim': 'GB', 'italy-esim': 'IT', 'spain-esim': 'ES',
  'netherlands-esim': 'NL', 'belgium-esim': 'BE', 'switzerland-esim': 'CH',
  'austria-esim': 'AT', 'poland-esim': 'PL', 'portugal-esim': 'PT', 'sweden-esim': 'SE',
  'norway-esim': 'NO', 'denmark-esim': 'DK', 'finland-esim': 'FI', 'czech-republic-esim': 'CZ',
  'hungary-esim': 'HU', 'romania-esim': 'RO', 'bulgaria-esim': 'BG', 'greece-esim': 'GR',
  'croatia-esim': 'HR', 'slovakia-esim': 'SK', 'slovenia-esim': 'SI', 'estonia-esim': 'EE',
  'latvia-esim': 'LV', 'lithuania-esim': 'LT', 'ireland-esim': 'IE', 'luxembourg-esim': 'LU',
  'malta-esim': 'MT', 'cyprus-esim': 'CY', 'azerbaijan-esim': 'AZ', 'georgia-esim': 'GE',
  'ukraine-esim': 'UA', 'russia-esim': 'RU', 'canada-esim': 'CA', 'mexico-esim': 'MX',
  'brazil-esim': 'BR', 'argentina-esim': 'AR', 'chile-esim': 'CL', 'colombia-esim': 'CO',
  'peru-esim': 'PE', 'china-esim': 'CN', 'japan-esim': 'JP', 'south-korea-esim': 'KR',
  'hong-kong-esim': 'HK', 'taiwan-esim': 'TW', 'singapore-esim': 'SG', 'malaysia-esim': 'MY',
  'thailand-esim': 'TH', 'indonesia-esim': 'ID', 'philippines-esim': 'PH', 'vietnam-esim': 'VN',
  'india-esim': 'IN', 'pakistan-esim': 'PK', 'bangladesh-esim': 'BD', 'sri-lanka-esim': 'LK',
  'australia-esim': 'AU', 'new-zealand-esim': 'NZ', 'uae-esim': 'AE', 'saudi-arabia-esim': 'SA',
  'israel-esim': 'IL', 'jordan-esim': 'JO', 'kuwait-esim': 'KW', 'qatar-esim': 'QA',
  'bahrain-esim': 'BH', 'oman-esim': 'OM', 'lebanon-esim': 'LB', 'egypt-esim': 'EG',
  'south-africa-esim': 'ZA', 'nigeria-esim': 'NG', 'kenya-esim': 'KE', 'ghana-esim': 'GH',
  'tanzania-esim': 'TZ', 'ethiopia-esim': 'ET', 'morocco-esim': 'MA', 'tunisia-esim': 'TN',
  'algeria-esim': 'DZ', 'uganda-esim': 'UG', 'moldova-esim': 'MD', 'iceland-esim': 'IS',
  'albania-esim': 'AL', 'bosnia-esim': 'BA', 'north-macedonia-esim': 'MK', 'serbia-esim': 'RS',
  'montenegro-esim': 'ME',
};

// ── Classification helpers ──────────────────────────────────────────────────

// Skip very small packages (100/250 MB) which clutter the list and rarely sell.
const MIN_LIMITED_VOLUME_BYTES = 500 * 1024 * 1024; // 500 MB

function isUnlimitedByName(name: string): boolean {
  return /GB\/Day/i.test(name);
}
function isUnlimitedPlan(p: ESIMPackageRaw): boolean {
  return Boolean(p.is_unlimited) || isUnlimitedByName(p.name);
}
function isLimitedPlan(p: ESIMPackageRaw): boolean {
  if (isUnlimitedPlan(p)) return false;
  if (!p.volume || p.volume < MIN_LIMITED_VOLUME_BYTES) return false;
  if (!p.sell_price_minor || p.sell_price_minor <= 0) return false;
  return true;
}

function bytesToGB(bytes: number): number {
  return bytes / (1024 * 1024 * 1024);
}
function formatVolume(bytes: number): string {
  const gb = bytesToGB(bytes);
  if (gb >= 1) return `${Number.isInteger(gb) ? gb : gb.toFixed(1)} GB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/**
 * For each unique GB tier (rounded to nearest 100MB) pick the one with the
 * longest duration (best value per GB). No upper cap — all sizes shown so users
 * can pick large packages (50/100 GB) too. Lower cap handled in `isLimitedPlan`.
 */
function curateBestLimited(plans: ESIMPackageRaw[]): ESIMPackageRaw[] {
  const usable = plans.filter((p) => p.duration > 1);
  const byVolume = new Map<number, ESIMPackageRaw[]>();
  for (const p of usable) {
    const key = Math.round(p.volume / (100 * 1024 * 1024)) * 100;
    if (!byVolume.has(key)) byVolume.set(key, []);
    byVolume.get(key)!.push(p);
  }
  const best: ESIMPackageRaw[] = [];
  for (const tier of byVolume.values()) {
    tier.sort(
      (a, b) => b.duration - a.duration || a.sell_price_minor - b.sell_price_minor,
    );
    best.push(tier[0]);
  }
  best.sort((a, b) => a.volume - b.volume);
  return best;
}

function curateUnlimited(plans: ESIMPackageRaw[]): ESIMPackageRaw[] {
  return plans
    .filter(isUnlimitedPlan)
    .filter((p) => (p.sell_price_minor ?? 0) > 0)
    .sort(
      (a, b) => a.duration - b.duration || a.sell_price_minor - b.sell_price_minor,
    );
}

function extractDailyAllowance(name: string): string | null {
  const m = name.match(/(\d+(?:\.\d+)?)\s*(GB|MB)\/Day/i);
  return m ? `${m[1]} ${m[2].toUpperCase()}` : null;
}

function extractFup(name: string): string | null {
  const m = name.match(/FUP\s*(\d+(?:\.\d+)?)\s*(Mbps|Kbps)/i);
  return m ? `${m[1]} ${m[2]}` : null;
}

// ── WhatsApp deep link ──────────────────────────────────────────────────────

function buildWhatsAppLink(opts: {
  country: string;
  pkg: ESIMPackageRaw;
}) {
  const { country, pkg } = opts;
  const lines = [
    '[ESIM_ORDER]',
    'Hi! I want to buy an eSIM.',
    `Country: ${country}`,
    `Plan: ${pkg.name}`,
    `Code: ${pkg.packageCode}`,
    `ID: ${pkg.slug}`,
  ];
  return `https://wa.me/${ESIM_BOT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    lines.join('\n'),
  )}`;
}

// ── Plan card (limited) ─────────────────────────────────────────────────────

function LimitedPlanCard({
  pkg,
  lang,
  selected,
  onSelect,
}: {
  pkg: ESIMPackageRaw;
  lang: Lang;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left flex items-center gap-3 bg-white rounded-2xl border-2 p-4 active:scale-[0.99] transition-all ${
        selected
          ? 'border-blue-600 shadow-md shadow-blue-100'
          : 'border-gray-100 hover:border-blue-200'
      }`}
    >
      {/* Check icon — gray normally, blue when selected */}
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
          selected ? 'bg-blue-600' : 'bg-gray-100'
        }`}
      >
        <Check
          className={`w-5 h-5 transition-colors ${
            selected ? 'text-white' : 'text-gray-400'
          }`}
          strokeWidth={3}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-gray-900 text-[16px] leading-tight">
          {formatVolume(pkg.volume)}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {pkg.duration} {tr(lang, pkg.duration === 1 ? 'day' : 'days', 'gün')}
          </span>
          <span className="text-gray-300">·</span>
          <span>{pkg.speed || '4G'}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-lg font-extrabold text-green-600 leading-none">
          {formatPrice(pkg.sell_price_minor, pkg.currencyCode)}
        </div>
      </div>
    </button>
  );
}

// ── Plan card (unlimited) ───────────────────────────────────────────────────

function UnlimitedPlanCard({
  pkg,
  lang,
  selected,
  onSelect,
}: {
  pkg: ESIMPackageRaw;
  lang: Lang;
  selected: boolean;
  onSelect: () => void;
}) {
  const daily = extractDailyAllowance(pkg.name);
  const fup = extractFup(pkg.name);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left flex items-center gap-3 bg-white rounded-2xl border-2 p-4 active:scale-[0.99] transition-all ${
        selected
          ? 'border-blue-600 shadow-md shadow-blue-100'
          : 'border-purple-200 hover:border-purple-400'
      }`}
    >
      {/* Check icon — gray normally, blue when selected */}
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
          selected ? 'bg-blue-600' : 'bg-gray-100'
        }`}
      >
        <Check
          className={`w-5 h-5 transition-colors ${
            selected ? 'text-white' : 'text-gray-400'
          }`}
          strokeWidth={3}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold text-gray-900 text-[16px] leading-tight">
            <InfinityIcon className="inline w-4 h-4 -mt-0.5 mr-0.5 text-purple-600" />
            {tr(lang, 'Unlimited', 'Limitsiz')}
          </span>
          {daily && (
            <span className="inline-flex items-center text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              {daily}/{tr(lang, 'day', 'gün')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {pkg.duration} {tr(lang, pkg.duration === 1 ? 'day' : 'days', 'gün')}
          </span>
          <span className="text-gray-300">·</span>
          <span>{pkg.speed || '4G'}</span>
          {fup && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-amber-600 font-medium">FUP {fup}</span>
            </>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-lg font-extrabold text-purple-700 leading-none">
          {formatPrice(pkg.sell_price_minor, pkg.currencyCode)}
        </div>
      </div>
    </button>
  );
}

// ── Tab switch ──────────────────────────────────────────────────────────────

function TypeTabs({
  tab,
  setTab,
  limitedCount,
  unlimitedCount,
  lang,
}: {
  tab: TabId;
  setTab: (t: TabId) => void;
  limitedCount: number;
  unlimitedCount: number;
  lang: Lang;
}) {
  return (
    <div className="bg-white rounded-full p-1 border border-gray-200 flex gap-1 mb-4 shadow-sm">
      <button
        onClick={() => setTab('limited')}
        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-bold transition-all ${
          tab === 'limited'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Check className="w-4 h-4" strokeWidth={3} />
        <span>{tr(lang, 'Limited', 'Limitli')}</span>
        <span
          className={`text-[10px] font-bold px-1.5 rounded-full ${
            tab === 'limited' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {limitedCount}
        </span>
      </button>
      <button
        onClick={() => setTab('unlimited')}
        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-bold transition-all ${
          tab === 'unlimited'
            ? 'bg-purple-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <InfinityIcon className="w-4 h-4" />
        <span>{tr(lang, 'Unlimited', 'Limitsiz')}</span>
        <span
          className={`text-[10px] font-bold px-1.5 rounded-full ${
            tab === 'unlimited' ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {unlimitedCount}
        </span>
      </button>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function EsimShopCountryDemo() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = (language as Lang) ?? 'en';
  const { packages } = usePackages();

  const staticPkg: PackageData | undefined = useMemo(
    () => packages.find((p) => p.slug === slug),
    [packages, slug],
  );
  const countryCode =
    staticPkg?.countryCode ?? (slug ? SLUG_TO_CODE[slug] : undefined);
  const countryName = staticPkg?.country ?? countryCode ?? '';

  const [livePkgs, setLivePkgs] = useState<ESIMPackageRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryCode) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPublicPackagesForCountry(countryCode)
      .then((pkgs) => {
        if (!cancelled) {
          setLivePkgs(pkgs);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load packages');
          setLivePkgs([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  const limited = useMemo(
    () => curateBestLimited(livePkgs.filter(isLimitedPlan)),
    [livePkgs],
  );
  const unlimited = useMemo(() => curateUnlimited(livePkgs), [livePkgs]);

  // Default tab: whichever has data; prefer "limited"
  const [tab, setTab] = useState<TabId>('limited');
  useEffect(() => {
    if (!loading) {
      if (limited.length === 0 && unlimited.length > 0) setTab('unlimited');
    }
  }, [loading, limited.length, unlimited.length]);

  // Selected plan (one across both tabs)
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const selectedPkg = useMemo(
    () => livePkgs.find((p) => p.packageCode === selectedCode) ?? null,
    [livePkgs, selectedCode],
  );

  const totalCount = livePkgs.filter(
    (p) => isLimitedPlan(p) || isUnlimitedPlan(p),
  ).length;
  const cheapest = useMemo(() => {
    const all = livePkgs.filter((p) => (p.sell_price_minor ?? 0) > 0);
    if (all.length === 0) return null;
    return all.reduce((a, b) => (a.sell_price_minor < b.sell_price_minor ? a : b));
  }, [livePkgs]);

  // ── Country not found ──
  if (!countryCode) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex flex-col pt-16 lg:pt-20">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-3">
              {tr(lang, 'Country not found', 'Ölkə tapılmadı')}
            </div>
            <Link
              to="/esim-shop-demo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
              {tr(lang, 'Back to Shop', 'Mağazaya qayıt')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-gray-50 to-white flex flex-col pt-16 lg:pt-20">
      <Seo
        title={`${countryName} eSIM — demo`}
        description={`${countryName} eSIM packages — demo preview`}
        noIndex
        canonicalPath={`/esim-shop-demo/${slug}`}
      />
      <Header />

      <main className="flex-1 pb-12">
        {/* ── Back bar ──────────────────────────────────────────────────── */}
        <div className="sticky top-16 lg:top-20 z-20 bg-gray-50/95 backdrop-blur-md">
          <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
            <button
              onClick={() => navigate('/esim-shop-demo')}
              className="flex items-center gap-1.5 px-3 py-1.5 -ml-2 text-sm font-semibold text-gray-700 hover:text-blue-600 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              {tr(lang, 'Back', 'Geri')}
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              {tr(lang, 'Secure WhatsApp checkout', 'WhatsApp ilə təhlükəsiz')}
            </div>
          </div>
        </div>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="max-w-2xl w-full mx-auto px-4 pt-4 pb-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden border border-gray-100 shadow-md mb-4">
              <FlagImage countryCode={countryCode} size="full" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
              {countryName}
            </h1>
            {!loading && (
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {totalCount} {tr(lang, 'plans', 'paket')}
                  </span>
                </div>
                {cheapest && (
                  <>
                    <span className="text-gray-300">·</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-gray-400">
                        {tr(lang, 'from', 'min.')}
                      </span>
                      <span className="text-base font-extrabold text-green-600">
                        {formatPrice(cheapest.sell_price_minor, cheapest.currencyCode)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Content ──────────────────────────────────────────────────── */}
        <section className="max-w-2xl w-full mx-auto px-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <Loader2 className="w-6 h-6 text-blue-500 mx-auto animate-spin mb-2" />
              <div className="text-xs text-gray-500">
                {tr(lang, 'Loading packages…', 'Paketlər yüklənir…')}
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-dashed border-red-200 p-8 text-center">
              <div className="text-sm text-red-600 font-semibold mb-1">
                {tr(lang, 'Failed to load', 'Yükləmə alınmadı')}
              </div>
              <div className="text-xs text-gray-400">{error}</div>
            </div>
          ) : limited.length === 0 && unlimited.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <div className="text-sm text-gray-500">
                {tr(lang, 'No packages available', 'Paket mövcud deyil')}
              </div>
            </div>
          ) : (
            <>
              <TypeTabs
                tab={tab}
                setTab={setTab}
                limitedCount={limited.length}
                unlimitedCount={unlimited.length}
                lang={lang}
              />

              {tab === 'limited' ? (
                limited.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                    <div className="text-sm text-gray-500">
                      {tr(
                        lang,
                        'No limited plans for this country',
                        'Bu ölkə üçün limitli paket yoxdur',
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {limited.map((p) => (
                      <LimitedPlanCard
                        key={p.packageCode}
                        pkg={p}
                        lang={lang}
                        selected={selectedCode === p.packageCode}
                        onSelect={() => setSelectedCode(p.packageCode)}
                      />
                    ))}
                  </div>
                )
              ) : unlimited.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                  <div className="text-sm text-gray-500">
                    {tr(
                      lang,
                      'No unlimited plans for this country',
                      'Bu ölkə üçün limitsiz paket yoxdur',
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {unlimited.map((p) => (
                    <UnlimitedPlanCard
                      key={p.packageCode}
                      pkg={p}
                      lang={lang}
                      selected={selectedCode === p.packageCode}
                      onSelect={() => setSelectedCode(p.packageCode)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Trust line ──────────────────────────────────────────────── */}
        <div className={`text-center text-[11px] text-gray-400 mt-8 leading-relaxed px-4 ${selectedPkg ? 'pb-24' : ''}`}>
          {tr(
            lang,
            'Pick a plan, then order on WhatsApp.',
            'Paket seç, sonra WhatsApp-da sifariş ver.',
          )}
        </div>
      </main>

      {/* ── Sticky bottom CTA — visible when a plan is selected ───────────── */}
      {selectedPkg && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.12)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
        >
          <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                {tr(lang, 'Selected', 'Seçilmiş')}
              </div>
              <div className="text-sm font-bold text-gray-900 truncate">
                {isUnlimitedPlan(selectedPkg)
                  ? `${tr(lang, 'Unlimited', 'Limitsiz')}${
                      extractDailyAllowance(selectedPkg.name)
                        ? ` ${extractDailyAllowance(selectedPkg.name)}/${tr(lang, 'day', 'gün')}`
                        : ''
                    }`
                  : formatVolume(selectedPkg.volume)}{' '}
                · {selectedPkg.duration}{' '}
                {tr(lang, selectedPkg.duration === 1 ? 'day' : 'days', 'gün')} ·{' '}
                <span className="text-green-600">
                  {formatPrice(selectedPkg.sell_price_minor, selectedPkg.currencyCode)}
                </span>
              </div>
            </div>
            <a
              href={buildWhatsAppLink({ country: countryName, pkg: selectedPkg })}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#25D366] to-[#1ebd5b] hover:from-[#1ebd5b] hover:to-[#179c4d] active:scale-95 text-white font-bold rounded-full shadow-lg shadow-green-500/20 transition-all flex-shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{tr(lang, 'Order', 'Sifariş')}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
