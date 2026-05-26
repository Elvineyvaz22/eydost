/**
 * EsimShopDemo
 * =============
 * Mobile-first eSIM shop demo. Route: `/esim-shop-demo`.
 *
 * Məqsəd: WhatsApp daxili brauzerdə açılarkən sürətli, təmiz, telefon-uyğun
 * paket seçim ekranı. Hazırkı `/esim` (AllPackages) — masaüstü-yönəli, çox
 * dolu. Bu demo onun yerinə yeni dizayn təklif edir.
 *
 * Real data: `usePackages()` (Supabase + static fallback).
 * Heç bir backend dəyişikliyi tələb olunmur — istifadəçi paket kartına
 * basanda mövcud `/<slug>` səhifəsinə yönlənir.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  MessageCircle,
  Sparkles,
  Globe2,
  X,
  Plane,
} from 'lucide-react';
import Header from '../components/Header';
import Seo from '../components/Seo';
import FlagImage from '../components/FlagImage';
import { useLanguage } from '../contexts/LanguageContext';
import { usePackages } from '../contexts/PackagesContext';
import { ESIM_BOT_WHATSAPP_URL } from '../services/esimAccountApi';
import type { PackageData, RegionalPackage } from '../data/esimPackages';

// Top destinations — bot trafikinin əksəriyyəti bunlardandır.
const POPULAR_CODES = [
  'TR', 'GE', 'AE', 'RU', 'DE', 'GB', 'US', 'FR', 'IT', 'ES',
];

const QUICK_CHIP_CODES = ['TR', 'GE', 'AE', 'RU', 'DE', 'GB'];

type Lang = 'en' | 'az' | 'ru';

const tr = (lang: Lang, en: string, az: string, ru?: string) => {
  if (lang === 'az') return az;
  if (lang === 'ru' && ru) return ru;
  return en;
};

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

// ── Atom components ──────────────────────────────────────────────────────────

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
      {/* Flag */}
      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 shadow-sm">
        <FlagImage countryCode={pkg.countryCode} size="full" />
      </div>

      {/* Name + meta */}
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

      {/* Price chip */}
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

function RegionCard({
  region,
  lang,
}: {
  region: RegionalPackage;
  lang: Lang;
}) {
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

// ── Page ────────────────────────────────────────────────────────────────────

export default function EsimShopDemo() {
  const { language } = useLanguage();
  const lang = (language as Lang) ?? 'en';
  const { packages, regionalPackages, globalPackage } = usePackages();

  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sticky search shadow when scrolled
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col pt-16 lg:pt-20">
      <Seo
        title="eSIM packages"
        description="Buy global eSIM data plans on WhatsApp."
        noIndex
        canonicalPath="/esim-shop-demo"
      />
      <Header />

      {/* Sticky search header — sits below the fixed Header (h-16 lg:h-20) */}
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

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pb-32 pt-2">
        {/* ── Search results (replaces everything when typing) ─────────── */}
        {showSearchResults ? (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 mb-2 px-1">
              {filteredCountries.length}{' '}
              {tr(lang, 'results', 'nəticə')} · "{search}"
            </h2>
            {filteredCountries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <Globe2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <div className="text-sm text-gray-500">
                  {tr(
                    lang,
                    'No country matches',
                    'Uyğun ölkə tapılmadı',
                  )}
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
            {/* ── Hero ─────────────────────────────────────────────────── */}
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

            {/* ── Quick chips ──────────────────────────────────────────── */}
            <section className="mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                {quickChips.map((p) => (
                  <QuickChip key={p.slug} pkg={p} />
                ))}
              </div>
            </section>

            {/* ── Popular destinations ──────────────────────────────────── */}
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

            {/* ── Regional ──────────────────────────────────────────────── */}
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

            {/* ── Browse all countries (linked, not inlined to keep mobile light) */}
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

        {/* Trust footer line */}
        <div className="text-center text-[11px] text-gray-400 mt-8 leading-relaxed">
          {tr(
            lang,
            'Payment and activation happen on WhatsApp +994 99 201 01 17.',
            'Ödəniş və aktivləşmə WhatsApp +994 99 201 01 17-də.',
          )}
        </div>
      </main>

      {/* ── Sticky bottom WhatsApp CTA ────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-white via-white to-white/0 pt-6 pb-3 px-4 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <a
            href={ESIM_BOT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#25D366] to-[#1ebd5b] hover:from-[#1ebd5b] hover:to-[#179c4d] active:scale-[0.98] text-white font-bold rounded-full py-4 px-6 shadow-lg shadow-green-500/20 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            <span>
              {tr(lang, 'Order on WhatsApp', 'WhatsApp-da sifariş ver')}
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
