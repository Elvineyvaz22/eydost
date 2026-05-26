/**
 * EsimAccount (read-only profil)
 * ===============================
 * Bot linki ilə (`/esim?wa_id=...`) açılan istifadəçi balans/sifariş ekranı:
 *  - Aktiv eSIM-lər (status, qalan trafik, qalan günlər, istifadə barı)
 *  - Keçmiş sifariş tarixçəsi
 *  - "Yeni eSIM al" düyməsi → WhatsApp botu (`wa.me/994992010117`)
 *
 * Sayt heç bir order yaratmır, heç bir mesaj formatı göndərmir.
 *
 * `demoData` prop verilərsə, API çağırışları edilmir — sırf dizayn önizləməsi
 * üçün (məsələn `/esim-demo` route-undan istifadə olunur).
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Wifi,
  Clock,
  AlertTriangle,
  Loader2,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Hourglass,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import FlagImage from '../components/FlagImage';
import { useLanguage } from '../contexts/LanguageContext';
import {
  ESIM_BOT_WHATSAPP_URL,
  getCustomerEsims,
  getCustomerOrders,
  getEsimUsage,
  type EsimResponse,
  type OrderResponse,
  type UsageResponse,
} from '../services/esimAccountApi';

type Lang = 'en' | 'az' | 'ru';

function pickLang(language: string): Lang {
  return language === 'az' || language === 'ru' ? (language as Lang) : 'en';
}

const STRINGS: Record<Lang, {
  myEsims: string;
  demoTag: string;
  profileUnavailable: string;
  backendNote: string;
  totalRemaining: string;
  acrossPackages: (n: number) => string;
  activePackages: string;
  noActive: string;
  orderHint: string;
  orderNewTitle: string;
  orderNewSub: string;
  orderHistory: string;
  noOrders: string;
  noPrevious: string;
  alsoExpired: (n: number) => string;
  footerHelp: string;
  chatOnWa: string;
  remaining: string;
  daysLeft: string;
  used: string;
  ofLabel: string;
  pctRemaining: string;
  usageUnavailable: string;
  unknown: string;
}> = {
  en: {
    myEsims: 'My eSIMs',
    demoTag: 'Demo',
    profileUnavailable: 'Profile data unavailable',
    backendNote: 'Backend endpoints are not deployed yet.',
    totalRemaining: 'Total remaining',
    acrossPackages: (n) => `Across ${n} active package${n === 1 ? '' : 's'}`,
    activePackages: 'Active packages',
    noActive: 'No active eSIM packages yet.',
    orderHint: 'Order one on WhatsApp and it will appear here.',
    orderNewTitle: 'Order a new eSIM on WhatsApp',
    orderNewSub: 'Chat with the bot — payment and QR delivered there.',
    orderHistory: 'Order history',
    noOrders: 'No orders yet.',
    noPrevious: 'No previous orders.',
    alsoExpired: (n) => `Also ${n} expired eSIM${n === 1 ? '' : 's'} in your account.`,
    footerHelp: 'Need help with installation, top-ups, or refunds?',
    chatOnWa: 'Chat with us on WhatsApp',
    remaining: 'Remaining',
    daysLeft: 'Days left',
    used: 'Used',
    ofLabel: 'of',
    pctRemaining: 'remaining',
    usageUnavailable: 'Usage temporarily unavailable',
    unknown: 'unknown',
  },
  az: {
    myEsims: 'eSIMlərim',
    demoTag: 'Demo',
    profileUnavailable: 'Profil məlumatı əlçatan deyil',
    backendNote: 'Backend endpointləri hələ aktiv deyil.',
    totalRemaining: 'Ümumi qalıq',
    acrossPackages: (n) => `${n} aktiv paketdə`,
    activePackages: 'Aktiv paketlər',
    noActive: 'Aktiv eSIM paketi yoxdur.',
    orderHint: 'WhatsApp-da sifariş verin — burada görünəcək.',
    orderNewTitle: 'WhatsApp-da yeni eSIM sifariş et',
    orderNewSub: 'Botla yazışın — ödəniş və QR oradan gəlir.',
    orderHistory: 'Sifariş tarixçəsi',
    noOrders: 'Hələ sifariş yoxdur.',
    noPrevious: 'Əvvəlki sifariş yoxdur.',
    alsoExpired: (n) => `Hesabda həmçinin ${n} keçmiş eSIM var.`,
    footerHelp: 'Quraşdırma, doldurma və ya geri qaytarmada kömək lazımdır?',
    chatOnWa: 'WhatsApp-da bizimlə yazışın',
    remaining: 'Qalıq',
    daysLeft: 'Qalan gün',
    used: 'İstifadə',
    ofLabel: '/',
    pctRemaining: 'qalıb',
    usageUnavailable: 'İstifadə məlumatı müvəqqəti əlçatan deyil',
    unknown: 'naməlum',
  },
  ru: {
    myEsims: 'Мои eSIM',
    demoTag: 'Demo',
    profileUnavailable: 'Данные профиля недоступны',
    backendNote: 'Бэкенд-эндпойнты пока не развёрнуты.',
    totalRemaining: 'Всего осталось',
    acrossPackages: (n) => `В ${n} активн. пакет${n === 1 ? 'е' : 'ах'}`,
    activePackages: 'Активные пакеты',
    noActive: 'Активных eSIM пока нет.',
    orderHint: 'Закажите в WhatsApp — пакет появится здесь.',
    orderNewTitle: 'Заказать новый eSIM в WhatsApp',
    orderNewSub: 'Напишите боту — оплата и QR придут туда.',
    orderHistory: 'История заказов',
    noOrders: 'Заказов пока нет.',
    noPrevious: 'Предыдущих заказов нет.',
    alsoExpired: (n) => `Также ${n} истёкших eSIM в аккаунте.`,
    footerHelp: 'Нужна помощь с установкой, пополнением или возвратом?',
    chatOnWa: 'Напишите нам в WhatsApp',
    remaining: 'Осталось',
    daysLeft: 'Дней',
    used: 'Использовано',
    ofLabel: 'из',
    pctRemaining: 'осталось',
    usageUnavailable: 'Статистика временно недоступна',
    unknown: 'неизв.',
  },
};

// ── Enrichment ────────────────────────────────────────────────────────────────
// Real backend (`/customers/by-wa/{wa_id}/esims`) hələ paket/ölkə adlarını
// qaytarmır. Biz orderlərlə cross-reference etməyə cəhd edirik və/və ya
// demo data-da bu sahələri açıq verə bilirik.

export interface EnrichedEsim extends EsimResponse {
  usage?: UsageResponse;
  usageError?: string;
  country_code?: string;
  country_name?: string;
  package_name?: string;
  package_volume_bytes?: number;
  package_duration_days?: number;
}

export interface EnrichedOrder extends OrderResponse {
  country_name?: string;
  package_name?: string;
  created_at?: string;
}

export interface EsimAccountDemoData {
  esims: EnrichedEsim[];
  orders: EnrichedOrder[];
}

interface EsimAccountProps {
  waId: string;
  demoData?: EsimAccountDemoData;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set(['active', 'in_use', 'enabled', 'iu']);

function isActive(status?: string | null): boolean {
  if (!status) return false;
  return ACTIVE_STATUSES.has(status.toLowerCase());
}

const COMPLETED_STATUSES = new Set([
  'completed',
  'delivered',
  'paid',
  'success',
  'fulfilled',
]);
const PENDING_STATUSES = new Set(['pending', 'processing', 'awaiting_payment']);
const FAILED_STATUSES = new Set([
  'failed',
  'cancelled',
  'canceled',
  'refunded',
  'declined',
  'expired',
]);

function toBytes(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

function formatVolume(value: string | number | null | undefined): string {
  const n = toBytes(value);
  if (n === null) return '—';
  if (n >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(0)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

function daysLeft(expiredTime?: string | null): number | null {
  if (!expiredTime) return null;
  const exp = new Date(expiredTime).getTime();
  if (!Number.isFinite(exp)) return null;
  const ms = exp - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ── Atom components ──────────────────────────────────────────────────────────

function StatusBadge({
  status,
  flavour,
  unknownLabel = 'unknown',
}: {
  status?: string | null;
  flavour: 'order' | 'esim';
  unknownLabel?: string;
}) {
  const lower = (status || '').toLowerCase();
  const isOk =
    flavour === 'order'
      ? COMPLETED_STATUSES.has(lower)
      : ACTIVE_STATUSES.has(lower);
  const isPending = PENDING_STATUSES.has(lower);
  const isFail = FAILED_STATUSES.has(lower);

  const cls = isOk
    ? 'bg-green-100 text-green-700'
    : isPending
    ? 'bg-amber-100 text-amber-700'
    : isFail
    ? 'bg-red-50 text-red-600'
    : 'bg-gray-100 text-gray-600';

  const Icon = isOk
    ? CheckCircle2
    : isPending
    ? Hourglass
    : isFail
    ? XCircle
    : null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {status || unknownLabel}
    </span>
  );
}

function UsageBar({
  remainingBytes,
  totalBytes,
  remainingLabel = 'remaining',
}: {
  remainingBytes: number | null;
  totalBytes: number | null;
  remainingLabel?: string;
}) {
  let pct: number | null = null;
  if (remainingBytes !== null && totalBytes && totalBytes > 0) {
    pct = Math.max(0, Math.min(100, (remainingBytes / totalBytes) * 100));
  }
  const colour =
    pct === null
      ? 'bg-gray-300'
      : pct > 50
      ? 'bg-green-500'
      : pct > 20
      ? 'bg-amber-500'
      : 'bg-red-500';
  return (
    <div className="w-full">
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colour} transition-all duration-500`}
          style={{ width: pct === null ? '0%' : `${pct}%` }}
        />
      </div>
      {pct !== null && (
        <div className="mt-1 text-[10px] text-gray-400 text-right">
          {pct.toFixed(0)}% {remainingLabel}
        </div>
      )}
    </div>
  );
}

function ActiveEsimCard({ esim, s }: { esim: EnrichedEsim; s: typeof STRINGS['en'] }) {
  const remaining = toBytes(esim.usage?.remain_volume);
  const total =
    toBytes(esim.usage?.total_volume) ?? esim.package_volume_bytes ?? null;
  const used = toBytes(esim.usage?.used_volume);
  const days = daysLeft(esim.usage?.expired_time);

  const title =
    esim.package_name ||
    (esim.country_name
      ? `${esim.country_name} eSIM`
      : `eSIM #${esim.id}`);
  const subtitle =
    esim.country_name && esim.package_name
      ? esim.country_name
      : esim.iccid
      ? esim.iccid
      : `ID ${esim.id}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {esim.country_code ? (
            <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm border border-gray-100 flex-shrink-0">
              <FlagImage countryCode={esim.country_code} size="full" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Wifi className="w-5 h-5 text-blue-600" />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">{title}</div>
            <div className="text-xs text-gray-400 truncate">{subtitle}</div>
          </div>
        </div>
        <StatusBadge status={esim.status} flavour="esim" unknownLabel={s.unknown} />
      </div>

      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">
              {s.remaining}
            </div>
            <div className="text-2xl font-extrabold text-gray-900 leading-tight">
              {esim.usageError ? '—' : formatVolume(remaining)}
            </div>
          </div>
          {total !== null && (
            <div className="text-xs text-gray-400">
              {s.ofLabel} {formatVolume(total)}
            </div>
          )}
        </div>
        <UsageBar remainingBytes={remaining} totalBytes={total} remainingLabel={s.pctRemaining} />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-50 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">
              {s.daysLeft}
            </div>
            <div className="font-semibold text-gray-900">
              {days === null ? '—' : `${days}`}
            </div>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">
            {s.used}
          </div>
          <div className="font-semibold text-gray-900">
            {used === null ? '—' : formatVolume(used)}
          </div>
        </div>
      </div>

      {esim.usageError && (
        <div className="mt-3 text-xs text-amber-600">
          {s.usageUnavailable}: {esim.usageError}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, unknownLabel }: { order: EnrichedOrder; unknownLabel: string }) {
  const title =
    order.package_name ||
    `${order.country_code} · ${order.package_code}`;
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {order.country_code && (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 flex-shrink-0">
            <FlagImage countryCode={order.country_code} size="full" />
          </div>
        )}
        <div className="min-w-0">
          <div className="font-medium text-gray-900 text-sm truncate">
            {title}
          </div>
          <div className="text-xs text-gray-400 truncate">
            #{order.id}
            {order.created_at && ` · ${formatDate(order.created_at)}`}
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-semibold text-gray-900">
          {order.sell_price ?? '—'} {order.currency ?? ''}
        </div>
        <StatusBadge status={order.status} flavour="order" unknownLabel={unknownLabel} />
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function EsimAccount({ waId, demoData }: EsimAccountProps) {
  const { language } = useLanguage();
  const s = STRINGS[pickLang(language)];
  const [esims, setEsims] = useState<EnrichedEsim[] | null>(
    demoData ? demoData.esims : null,
  );
  const [orders, setOrders] = useState<EnrichedOrder[] | null>(
    demoData ? demoData.orders : null,
  );
  const [loading, setLoading] = useState(!demoData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demoData) return; // skip API calls in demo mode
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.allSettled([getCustomerEsims(waId), getCustomerOrders(waId)])
      .then(async ([esimsRes, ordersRes]) => {
        if (cancelled) return;

        if (esimsRes.status === 'fulfilled') {
          const list: EnrichedEsim[] = esimsRes.value.map((e) => ({ ...e }));
          setEsims(list);
          const activeList = list.filter((e) => isActive(e.status));
          const usageResults = await Promise.allSettled(
            activeList.map((e) => getEsimUsage(e.id, waId)),
          );
          if (cancelled) return;
          setEsims((prev) => {
            if (!prev) return prev;
            const usageMap = new Map<number, UsageResponse | string>();
            activeList.forEach((e, idx) => {
              const r = usageResults[idx];
              if (r.status === 'fulfilled') usageMap.set(e.id, r.value);
              else usageMap.set(e.id, r.reason?.message || 'Usage unavailable');
            });
            return prev.map((e) => {
              const u = usageMap.get(e.id);
              if (!u) return e;
              return typeof u === 'string'
                ? { ...e, usageError: u }
                : { ...e, usage: u };
            });
          });
        } else {
          setEsims([]);
          setError(esimsRes.reason?.message || 'Failed to load eSIMs');
        }

        if (ordersRes.status === 'fulfilled') {
          setOrders(ordersRes.value);
        } else {
          setOrders([]);
          setError((prev) => prev || ordersRes.reason?.message || null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waId, demoData]);

  const activeEsims = useMemo(
    () => (esims ?? []).filter((e) => isActive(e.status)),
    [esims],
  );
  const pastEsims = useMemo(
    () => (esims ?? []).filter((e) => !isActive(e.status)),
    [esims],
  );

  const totalRemainingBytes = useMemo(() => {
    return activeEsims.reduce((sum, e) => {
      const r = toBytes(e.usage?.remain_volume);
      return r === null ? sum : sum + r;
    }, 0);
  }, [activeEsims]);

  const hasAnyData =
    (esims && esims.length > 0) || (orders && orders.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      <Seo
        title={s.myEsims}
        description="Your active eSIM packages and order history at Ey Dost."
        noIndex
        canonicalPath="/esim"
      />
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 md:py-10">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {s.myEsims}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            WhatsApp ID <span className="font-mono">{waId}</span>
            {demoData && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-purple-100 text-purple-700">
                {s.demoTag}
              </span>
            )}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <div className="font-semibold mb-1">{s.profileUnavailable}</div>
              <div className="text-amber-700">{error}</div>
              <div className="text-xs text-amber-600 mt-2">{s.backendNote}</div>
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Summary stat (only when we have at least one active esim) */}
            {activeEsims.length > 0 && (
              <div className="mb-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-blue-200">
                      {s.totalRemaining}
                    </div>
                    <div className="text-3xl font-extrabold mt-1">
                      {formatVolume(totalRemainingBytes)}
                    </div>
                    <div className="text-xs text-blue-100 mt-1">
                      {s.acrossPackages(activeEsims.length)}
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                    <Wifi className="w-7 h-7" />
                  </div>
                </div>
              </div>
            )}

            {/* Active eSIMs */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {s.activePackages}
                  {activeEsims.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      ({activeEsims.length})
                    </span>
                  )}
                </h2>
              </div>
              {activeEsims.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                  <Wifi className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <div className="text-sm text-gray-500">{s.noActive}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.orderHint}</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeEsims.map((e) => (
                    <ActiveEsimCard key={e.id} esim={e} s={s} />
                  ))}
                </div>
              )}
            </section>

            {/* WhatsApp CTA */}
            <section className="mb-6">
              <a
                href={ESIM_BOT_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-gradient-to-r from-[#25D366] to-[#1ebd5b] hover:from-[#1ebd5b] hover:to-[#179c4d] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-3 text-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold">{s.orderNewTitle}</div>
                      <div className="text-xs text-white/90 truncate">{s.orderNewSub}</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold tracking-wider opacity-90 flex-shrink-0">
                    →
                  </div>
                </div>
              </a>
            </section>

            {/* Order history */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {s.orderHistory}
                {orders && orders.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    ({orders.length})
                  </span>
                )}
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 px-4">
                {!orders || orders.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    {hasAnyData ? s.noPrevious : s.noOrders}
                  </div>
                ) : (
                  <div>
                    {orders.map((o) => (
                      <OrderRow key={o.id} order={o} unknownLabel={s.unknown} />
                    ))}
                  </div>
                )}
              </div>
              {pastEsims.length > 0 && (
                <p className="text-xs text-gray-400 mt-3 text-center">
                  {s.alsoExpired(pastEsims.length)}
                </p>
              )}
            </section>

            {/* Footer note */}
            <p className="text-[11px] text-gray-400 text-center mt-8 leading-relaxed">
              {s.footerHelp}
              <br />
              {s.chatOnWa}{' '}
              <a
                href={ESIM_BOT_WHATSAPP_URL}
                className="text-blue-600 hover:underline"
              >
                +994 99 201 01 17
              </a>
              .
            </p>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
