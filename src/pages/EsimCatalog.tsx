/**
 * EsimCatalog (wa_id-aware)
 * =========================
 * "Yeni paket al" axını üçün sadə skeleton:
 *   1. İstifadəçi ölkə kodunu daxil edir/seçir (məs. TR, US, GE).
 *   2. Sayt `GET /api/public/packages?country_code=...` çağırır.
 *   3. İstifadəçi paket seçir → "Pay in bot" düyməsi.
 *   4. Sayt `POST /api/public/orders` çağırır, `order_id` alır.
 *   5. `https://wa.me/994992010117?text=PAY%20{order_id}` linkinə yönləndirir.
 *
 * Qeyd: bu, MVP skeleton-dur. Sonradan mövcud `/esim` kataloqu və ya regional/global
 * səhifələrlə birləşdirilə bilər.
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Search, AlertTriangle, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import {
  listPackages,
  createDraftOrder,
  buildPayInBotUrl,
  type PackageResponse,
} from '../services/esimAccountApi';

// Top country codes — istifadəçi daxil etmədən sürətli giriş üçün.
const QUICK_COUNTRIES: Array<{ code: string; name: string; flag: string }> = [
  { code: 'TR', name: 'Türkiyə', flag: '🇹🇷' },
  { code: 'GE', name: 'Gürcüstan', flag: '🇬🇪' },
  { code: 'RU', name: 'Rusiya', flag: '🇷🇺' },
  { code: 'AE', name: 'BƏƏ', flag: '🇦🇪' },
  { code: 'DE', name: 'Almaniya', flag: '🇩🇪' },
  { code: 'GB', name: 'Böyük Britaniya', flag: '🇬🇧' },
  { code: 'US', name: 'ABŞ', flag: '🇺🇸' },
  { code: 'FR', name: 'Fransa', flag: '🇫🇷' },
];

function CountryPicker({
  onPick,
  current,
}: {
  onPick: (code: string) => void;
  current?: string;
}) {
  const [input, setInput] = useState(current ?? '');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Country code (ISO 2-letter)
      </label>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = input.trim().toUpperCase();
          if (v.length >= 2) onPick(v);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase().slice(0, 2))}
            placeholder="TR, US, GE…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={2}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Search
        </button>
      </form>

      <div className="mt-4">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Popular</div>
        <div className="flex flex-wrap gap-2">
          {QUICK_COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => onPick(c.code)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                current === c.code
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-100 text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{c.flag}</span>
              <span>{c.code}</span>
              <span className="text-xs text-gray-400">· {c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PackageRow({
  pkg,
  onSelect,
  busy,
}: {
  pkg: PackageResponse;
  onSelect: (pkg: PackageResponse) => void;
  busy: boolean;
}) {
  return (
    <button
      onClick={() => onSelect(pkg)}
      disabled={busy}
      className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 hover:border-blue-200 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 truncate">{pkg.name}</div>
          <div className="text-xs text-gray-500 mt-0.5 flex gap-3">
            {pkg.volume && <span>{pkg.volume}</span>}
            {pkg.duration && <span>{pkg.duration} days</span>}
            <span className="font-mono text-gray-400">{pkg.package_code}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <div className="text-lg font-extrabold text-green-600">
              {pkg.sell_price}
            </div>
            <div className="text-[10px] text-gray-400 uppercase">{pkg.currency}</div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}

export default function EsimCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();

  const waId = searchParams.get('wa_id') || '';
  const country = (searchParams.get('country') || '').toUpperCase();

  const [packages, setPackages] = useState<PackageResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyPackageCode, setBusyPackageCode] = useState<string | null>(null);

  useEffect(() => {
    if (!country) {
      setPackages(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    listPackages(country)
      .then((list) => {
        if (cancelled) return;
        setPackages(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load packages');
        setPackages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  const handlePickCountry = (code: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('country', code);
    setSearchParams(next, { replace: true });
  };

  const handleBuy = async (pkg: PackageResponse) => {
    if (!waId) {
      setError('Missing wa_id — please open this page from the WhatsApp bot link.');
      return;
    }
    setBusyPackageCode(pkg.package_code);
    setError(null);
    try {
      const order = await createDraftOrder({
        waId,
        countryCode: country,
        packageCode: pkg.package_code,
      });
      window.location.href = buildPayInBotUrl(order.id);
    } catch (err: any) {
      setError(err?.message || 'Could not create order');
      setBusyPackageCode(null);
    }
  };

  const heading = useMemo(() => {
    if (!country) return 'Pick a country';
    return `Packages for ${country}`;
  }, [country]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Seo
        title="Buy eSIM"
        description="Pick an eSIM data package and pay in the WhatsApp bot."
        noIndex
        canonicalPath="/esim/catalog"
      />
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <div className="mb-4">
          <Link
            to={waId ? `/esim?wa_id=${encodeURIComponent(waId)}` : '/esim'}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to my eSIMs
          </Link>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          {heading}
        </h1>
        {waId && (
          <p className="text-sm text-gray-500 mb-6">
            Logged in as <span className="font-mono">{waId}</span>
          </p>
        )}
        {!waId && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              No <code>wa_id</code> in URL. To purchase, open this page from your WhatsApp
              bot link. You can still browse packages below.
            </div>
          </div>
        )}

        <div className="mb-6">
          <CountryPicker current={country || undefined} onPick={handlePickCountry} />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {country && loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}

        {country && !loading && packages && packages.length === 0 && !error && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500 text-sm">
            No packages available for {country}.
          </div>
        )}

        {country && !loading && packages && packages.length > 0 && (
          <div className="space-y-3">
            {packages.map((p) => (
              <PackageRow
                key={p.package_code}
                pkg={p}
                onSelect={handleBuy}
                busy={busyPackageCode !== null && busyPackageCode !== p.package_code}
              />
            ))}
          </div>
        )}

        <div className="mt-8 text-xs text-gray-400 text-center">
          Payment is finalized inside the WhatsApp bot. After tapping a package, you will
          be redirected to <span className="font-mono">wa.me/994992010117</span>.
        </div>
      </main>

      <Footer />
    </div>
  );
}
