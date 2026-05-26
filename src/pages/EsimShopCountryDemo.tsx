/**
 * EsimShopCountryDemo
 * ====================
 * Mobile-first country detail page (demo).
 * Route: `/esim-shop-demo/:slug`
 *
 * Dizayn:
 *  - Hero: bayraq + ölkə + paket sayı + min qiymət
 *  - Müddət filteri (sticky chips)
 *  - Plan kartları (lineer siyahı, qiymətə görə sıralı)
 *  - Hər kart → WhatsApp bot-a deep link (`[ESIM_ORDER]` formatı)
 *
 * Statik `usePackages()` data ilə işləyir. Heç bir backend dəyişikliyi yox.
 */

import { useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageCircle,
  Wifi,
  Clock,
  ChevronRight,
  Zap,
  ShieldCheck,
  Infinity as InfinityIcon,
} from 'lucide-react';
import Header from '../components/Header';
import Seo from '../components/Seo';
import FlagImage from '../components/FlagImage';
import { useLanguage } from '../contexts/LanguageContext';
import { usePackages } from '../contexts/PackagesContext';
import { ESIM_BOT_WHATSAPP_NUMBER } from '../services/esimAccountApi';
import type { PackageData, Plan } from '../data/esimPackages';

type Lang = 'en' | 'az' | 'ru';

const tr = (lang: Lang, en: string, az: string, ru?: string) => {
  if (lang === 'az') return az;
  if (lang === 'ru' && ru) return ru;
  return en;
};

function priceOf(p: Plan) {
  return parseFloat(p.price.replace(/[^\d.]/g, '')) || Infinity;
}
function formatGB(gb: number) {
  if (gb < 1) return `${Math.round(gb * 1000)} MB`;
  return `${gb} GB`;
}

function buildWhatsAppLink(opts: {
  country: string;
  plan: Plan;
}) {
  const { country, plan } = opts;
  const lines = [
    '[ESIM_ORDER]',
    `Hi! I want to buy an eSIM.`,
    `Country: ${country}`,
    `Plan: ${formatGB(plan.gb)} · ${plan.days} days`,
    plan.code ? `Code: ${plan.code}` : '',
    plan.id ? `ID: ${plan.id}` : '',
  ].filter(Boolean);
  return `https://wa.me/${ESIM_BOT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    lines.join('\n'),
  )}`;
}

// ── Plan card ───────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  country,
  lang,
}: {
  plan: Plan;
  country: string;
  lang: Lang;
}) {
  // Static data doesn't distinguish unlimited; placeholder for future API integration.
  const unlimited = false;
  const href = buildWhatsAppLink({ country, plan });
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-300 hover:shadow-md active:scale-[0.99] transition-all"
    >
      {/* Left icon */}
      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
        {unlimited ? (
          <InfinityIcon className="w-5 h-5 text-purple-600" />
        ) : (
          <Wifi className="w-5 h-5 text-blue-600" />
        )}
      </div>

      {/* Plan info */}
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-gray-900 text-[16px] leading-tight">
          {formatGB(plan.gb)}
          {unlimited && (
            <span className="ml-1.5 inline-flex items-center text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              {tr(lang, 'unltd', 'limitsiz')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {plan.days} {tr(lang, plan.days === 1 ? 'day' : 'days', 'gün')}
          </span>
          <span className="text-gray-300">·</span>
          <span>4G / 5G</span>
        </div>
      </div>

      {/* Price + CTA */}
      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <div className="text-lg font-extrabold text-green-600 leading-none">
          {plan.price}
        </div>
        <div className="flex items-center gap-0.5 text-[11px] text-green-600 font-bold uppercase tracking-wider mt-1.5 group-hover:text-blue-600 transition-colors">
          <MessageCircle className="w-3.5 h-3.5" />
          {tr(lang, 'Order', 'Sifariş')}
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </a>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function EsimShopCountryDemo() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const lang = (language as Lang) ?? 'en';
  const { packages } = usePackages();

  const pkg: PackageData | undefined = useMemo(
    () => packages.find((p) => p.slug === slug),
    [packages, slug],
  );

  const allPlans = useMemo(
    () => (pkg?.plans ?? []).slice().sort((a, b) => priceOf(a) - priceOf(b)),
    [pkg],
  );

  const availableDays = useMemo(() => {
    const set = new Set<number>();
    allPlans.forEach((p) => set.add(p.days));
    return Array.from(set).sort((a, b) => a - b);
  }, [allPlans]);

  const [daysFilter, setDaysFilter] = useState<number | 'all'>('all');

  const visiblePlans = useMemo(() => {
    if (daysFilter === 'all') return allPlans;
    return allPlans.filter((p) => p.days === daysFilter);
  }, [allPlans, daysFilter]);

  const cheapest = allPlans[0];

  // ── Not found ──
  if (!pkg) {
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
        title={`${pkg.country} eSIM — demo`}
        description={`${pkg.country} eSIM packages — demo preview`}
        noIndex
        canonicalPath={`/esim-shop-demo/${slug}`}
      />
      <Header />

      <main className="flex-1 pb-12">
        {/* ── Sticky back bar (sits under fixed Header) ──────────────────── */}
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

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="max-w-2xl w-full mx-auto px-4 pt-4 pb-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden border border-gray-100 shadow-md mb-4">
              <FlagImage countryCode={pkg.countryCode} size="full" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
              {pkg.country}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {allPlans.length} {tr(lang, 'plans', 'paket')}
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
                      {cheapest.price}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Duration filter chips ──────────────────────────────────────── */}
        {availableDays.length > 1 && (
          <section className="max-w-2xl w-full mx-auto px-4 mb-4">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
              {tr(lang, 'Filter by duration', 'Müddətə görə filter')}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
              <FilterChip
                active={daysFilter === 'all'}
                onClick={() => setDaysFilter('all')}
                label={tr(lang, 'All', 'Hamısı')}
                count={allPlans.length}
              />
              {availableDays.map((d) => (
                <FilterChip
                  key={d}
                  active={daysFilter === d}
                  onClick={() => setDaysFilter(d)}
                  label={`${d} ${tr(lang, d === 1 ? 'day' : 'days', 'gün')}`}
                  count={allPlans.filter((p) => p.days === d).length}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Plan list ──────────────────────────────────────────────────── */}
        <section className="max-w-2xl w-full mx-auto px-4">
          {visiblePlans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <div className="text-sm text-gray-500">
                {tr(lang, 'No plans for this duration', 'Bu müddət üçün paket yoxdur')}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {visiblePlans.map((plan, idx) => (
                <PlanCard
                  key={`${plan.id ?? plan.code ?? idx}`}
                  plan={plan}
                  country={pkg.country}
                  lang={lang}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Trust line ─────────────────────────────────────────────────── */}
        <div className="text-center text-[11px] text-gray-400 mt-8 leading-relaxed px-4">
          {tr(
            lang,
            'Tap a plan → opens WhatsApp with order details pre-filled.',
            'Paketi seç → WhatsApp avtomatik açılır, mətn hazır.',
          )}
        </div>
      </main>
    </div>
  );
}

// ── Filter chip ─────────────────────────────────────────────────────────────

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-semibold flex-shrink-0 transition-all active:scale-95 ${
        active
          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
          : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
      }`}
    >
      <span>{label}</span>
      <span
        className={`text-[10px] font-bold px-1.5 rounded-full ${
          active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {count}
      </span>
    </button>
  );
}
