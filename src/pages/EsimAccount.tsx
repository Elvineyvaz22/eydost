/**
 * EsimAccount
 * ===========
 * Bot linki ilə (`/esim?wa_id=...`) açılan istifadəçi profili:
 *  - Aktiv eSIM-lər (status, qalan trafik)
 *  - Keçmiş sifarişlər
 *  - "Yeni paket al" → mövcud kataloqa wa_id ilə yönləndirmə
 *
 * Bütün backend müraciətləri `/api/esim-proxy` (Vercel function) üzərindəndir.
 * Ödəniş saytda DEYİL — istifadəçi `https://wa.me/994992010117?text=PAY%20{order_id}`
 * vasitəsilə bota qaytarılır.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, Clock, AlertTriangle, Loader2, ChevronRight, ShoppingCart } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import {
  getCustomerEsims,
  getCustomerOrders,
  getEsimUsage,
  type EsimResponse,
  type OrderResponse,
  type UsageResponse,
} from '../services/esimAccountApi';

interface EsimAccountProps {
  waId: string;
}

interface EsimWithUsage extends EsimResponse {
  usage?: UsageResponse;
  usageError?: string;
}

const ACTIVE_STATUSES = new Set(['active', 'in_use', 'ENABLED', 'IN_USE']);

function isActive(status?: string | null): boolean {
  if (!status) return false;
  return ACTIVE_STATUSES.has(status) || ACTIVE_STATUSES.has(status.toLowerCase());
}

function formatVolume(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  if (n >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
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

function StatusPill({ status }: { status?: string | null }) {
  const active = isActive(status);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {status || 'unknown'}
    </span>
  );
}

function ActiveEsimCard({ esim }: { esim: EsimWithUsage }) {
  const remaining = esim.usage?.remain_volume;
  const days = daysLeft(esim.usage?.expired_time);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <Wifi className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              eSIM #{esim.id}
            </div>
            {esim.iccid && (
              <div className="text-xs text-gray-400 font-mono">{esim.iccid}</div>
            )}
          </div>
        </div>
        <StatusPill status={esim.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-50">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Remaining</div>
          <div className="font-semibold text-gray-900">
            {esim.usageError ? '—' : formatVolume(remaining)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Days left</div>
          <div className="font-semibold text-gray-900 flex items-center gap-1">
            <Clock className="w-4 h-4 text-gray-400" />
            {days === null ? '—' : `${days}d`}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order }: { order: OrderResponse }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <div className="font-medium text-gray-900 text-sm">
          #{order.id} · {order.country_code} · {order.package_code}
        </div>
        <div className="text-xs text-gray-400">
          {order.transaction_id}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-gray-900">
          {order.sell_price ?? '—'} {order.currency ?? ''}
        </div>
        <StatusPill status={order.status} />
      </div>
    </div>
  );
}

export default function EsimAccount({ waId }: EsimAccountProps) {
  const [esims, setEsims] = useState<EsimWithUsage[] | null>(null);
  const [orders, setOrders] = useState<OrderResponse[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.allSettled([getCustomerEsims(waId), getCustomerOrders(waId)])
      .then(async ([esimsRes, ordersRes]) => {
        if (cancelled) return;

        if (esimsRes.status === 'fulfilled') {
          const list = esimsRes.value;
          setEsims(list);
          // Fetch usage for active eSIMs in parallel
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
          if (!error) setError((prev) => prev || ordersRes.reason?.message || null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waId]);

  const activeEsims = useMemo(
    () => (esims ?? []).filter((e) => isActive(e.status)),
    [esims],
  );
  const pastEsims = useMemo(
    () => (esims ?? []).filter((e) => !isActive(e.status)),
    [esims],
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Seo
        title="My eSIMs"
        description="Your active eSIM packages and order history at Ey Dost."
        noIndex
        canonicalPath="/esim"
      />
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My eSIMs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back · WhatsApp ID <span className="font-mono">{waId}</span>
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}

        {!loading && error && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <div className="font-semibold mb-1">Profile data unavailable</div>
              <div className="text-amber-700">
                {error}
              </div>
              <div className="text-xs text-amber-600 mt-2">
                Backend endpoints <code>/customers/by-wa/&#123;wa_id&#125;/esims</code> and
                <code> /customers/by-wa/&#123;wa_id&#125;/orders</code> may not be deployed yet.
                You can still browse packages below.
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <>
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Active packages
                  {activeEsims.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      ({activeEsims.length})
                    </span>
                  )}
                </h2>
              </div>
              {activeEsims.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500 text-sm">
                  No active eSIM packages yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeEsims.map((e) => (
                    <ActiveEsimCard key={e.id} esim={e} />
                  ))}
                </div>
              )}
            </section>

            <section className="mb-8">
              <Link
                to={`/esim/catalog?wa_id=${encodeURIComponent(waId)}`}
                className="block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold">Buy a new package</div>
                      <div className="text-xs text-blue-100">
                        Pick a country → choose a plan → finish payment in WhatsApp
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Order history
                {orders && orders.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    ({orders.length})
                  </span>
                )}
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                {!orders || orders.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-400">
                    No orders yet.
                  </div>
                ) : (
                  <div>
                    {orders.map((o) => (
                      <OrderRow key={o.id} order={o} />
                    ))}
                  </div>
                )}
              </div>
              {pastEsims.length > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                  Includes {pastEsims.length} expired/inactive eSIM
                  {pastEsims.length === 1 ? '' : 's'}.
                </p>
              )}
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
