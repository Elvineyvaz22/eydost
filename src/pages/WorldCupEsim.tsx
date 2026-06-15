import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgePercent, CalendarDays, Check, Globe2, MessageCircle, ShieldCheck, Sparkles, Trophy, Wifi } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Seo from '../components/Seo';
import { appendReferralToMessage, getWhatsAppLink, trackAgentLead } from '../utils/whatsapp';

type HostCountry = 'United States' | 'Canada' | 'Mexico';
type PlanType = 'standard' | 'daily';

interface WorldCupPlan {
  country: HostCountry;
  name: string;
  data: string;
  days: string;
  price: number;
  comparePrice: number;
  packageCode: string;
  slug: string;
  dataType: number;
  periodNum: number;
  type: PlanType;
  network: string;
  featured?: boolean;
}

const COUNTRIES: HostCountry[] = ['United States', 'Canada', 'Mexico'];
const COUNTRY_CODES: Record<HostCountry, string> = {
  'United States': 'US',
  Canada: 'CA',
  Mexico: 'MX',
};

const COUNTRY_COPY: Record<HostCountry, { city: string; flag: string; note: string }> = {
  'United States': {
    city: 'New York, Miami, Dallas, Los Angeles, Seattle ve diger seherler',
    flag: '🇺🇸',
    note: 'ABŞ paketleri World Cup ucun ayrica secilib.',
  },
  Canada: {
    city: 'Toronto ve Vancouver',
    flag: '🇨🇦',
    note: 'Kanada paketleri elave edilecek.',
  },
  Mexico: {
    city: 'Mexico City, Guadalajara ve Monterrey',
    flag: '🇲🇽',
    note: 'Meksika paketleri elave edilecek.',
  },
};

interface ApiPackage {
  package_code: string;
  slug: string;
  name: string;
  country_code: string;
  data_type: number;
  unlimited: boolean;
  currency: string;
  sell_price: string;
  sell_price_minor: number;
  volume: string;
  duration: number;
}

const USD_TO_AZN_RATE = 1.7;

function money(value: number): string {
  return `$${(value / USD_TO_AZN_RATE).toFixed(2)}`;
}

function bytesToGb(value: string | number): number {
  const bytes = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(bytes) || bytes <= 0) return 0;
  return bytes / (1024 * 1024 * 1024);
}

function dataLabel(pkg: ApiPackage): string {
  const gb = bytesToGb(pkg.volume);
  const rounded = Math.round(gb * 10) / 10;
  const label = Number.isInteger(rounded) ? `${rounded.toFixed(0)}GB` : `${rounded}GB`;
  return pkg.data_type === 2 || pkg.unlimited ? `${label}/Day` : label;
}

function discountPercent(plan: WorldCupPlan): number {
  const compare = plan.comparePrice;
  const sale = plan.price;
  return Math.round(((compare - sale) / compare) * 100);
}

function standardRank(plan: WorldCupPlan): number {
  const preferred = ['1GB-7', '3GB-15', '3GB-30', '5GB-30', '10GB-30', '20GB-30', '50GB-30', '100GB-10'];
  const rank = preferred.indexOf(`${plan.data}-${plan.days}`);
  return rank === -1 ? 1000 + Number(plan.days) : rank;
}

function normalizeApiPackages(country: HostCountry, packages: ApiPackage[], type: PlanType): WorldCupPlan[] {
  const best = new Map<string, WorldCupPlan>();

  for (const pkg of packages) {
    const gb = bytesToGb(pkg.volume);
    if (gb < 1) continue;

    const isDaily = pkg.data_type === 2 || pkg.unlimited || /\/Day/i.test(pkg.name);
    if ((type === 'daily') !== isDaily) continue;

    const price = Number(pkg.sell_price);
    if (!Number.isFinite(price) || price <= 0) continue;

    const plan: WorldCupPlan = {
      country,
      name: pkg.name,
      data: dataLabel(pkg),
      days: isDaily ? '1-365' : String(pkg.duration),
      price,
      comparePrice: Number((price * 1.35).toFixed(2)),
      packageCode: pkg.package_code,
      slug: pkg.slug,
      dataType: pkg.data_type,
      periodNum: pkg.duration || 1,
      type,
      network: '3G/4G/5G',
      featured: gb >= 10 || /FIFA/i.test(pkg.name),
    };

    const key = `${plan.data}-${plan.days}`;
    const current = best.get(key);
    if (!current || plan.price < current.price || /FIFA/i.test(plan.name)) {
      best.set(key, plan);
    }
  }

  return Array.from(best.values())
    .sort((a, b) => Number(b.featured || false) - Number(a.featured || false) || standardRank(a) - standardRank(b) || a.price - b.price)
    .slice(0, type === 'standard' ? 8 : 6);
}

function footballPattern(index: number): string {
  const patterns = ['rotate-6', '-rotate-3', 'rotate-12', '-rotate-6'];
  return patterns[index % patterns.length];
}

export default function WorldCupEsim() {
  const [country, setCountry] = useState<HostCountry>('United States');
  const [type, setType] = useState<PlanType>('standard');
  const [apiPackages, setApiPackages] = useState<ApiPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadPackages() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(
          `/api/public-api-proxy?path=/api/public/packages&country_code=${COUNTRY_CODES[country]}`,
          { signal: controller.signal }
        );
        const json = await response.json();
        if (!response.ok || !json?.success) {
          throw new Error(json?.error || 'Paketler yuklenmedi');
        }
        if (!cancelled) setApiPackages(Array.isArray(json.data) ? json.data : []);
      } catch (err: any) {
        if (!cancelled && err?.name !== 'AbortError') {
          setApiPackages([]);
          setError(err?.message || 'Paketler yuklenmedi');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPackages();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [country]);

  const plans = useMemo(() => {
    return normalizeApiPackages(country, apiPackages, type);
  }, [apiPackages, country, type]);

  const openWhatsApp = async (plan: WorldCupPlan) => {
    await trackAgentLead({
      productType: 'esim',
      eventType: 'whatsapp_click',
      packageName: plan.name,
      packageCode: plan.packageCode,
      viewedPackage: `World Cup 2026 ${plan.country} ${plan.data} ${plan.days} days ${money(plan.price)}`,
      page: '/world-cup-2026-esim',
    });

    const message = appendReferralToMessage(
      [
        'Salam, World Cup 2026 ucun eSIM almaq isteyirem.',
        `Olke: ${plan.country}`,
        `Paket: ${plan.data} / ${plan.days} gun`,
        `Qiymet: ${money(plan.price)}`,
        `Paket kodu: ${plan.packageCode}`,
      ].join('\n'),
      'az'
    );

    window.open(getWhatsAppLink('esim', message), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#f7fbf5] text-gray-950">
      <Seo
        title="World Cup 2026 eSIM Paketleri | Ey Dost"
        description="World Cup 2026 ucun ABŞ, Kanada ve Meksika eSIM paketleri. Futbol seferiniz ucun interneti WhatsApp ile alin."
        canonicalPath="/world-cup-2026-esim"
      />
      <Header />

      <main>
        <section className="relative overflow-hidden bg-[#0f7a3b] text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -left-20 top-10 h-64 w-64 rounded-full border-[28px] border-white" />
            <div className="absolute right-[-70px] top-24 h-56 w-56 rounded-full border-[24px] border-white" />
            <div className="absolute bottom-[-90px] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full border-[32px] border-white" />
          </div>
          <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-10 pt-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-16 lg:pt-28">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black ring-1 ring-white/25">
                <Trophy className="h-4 w-4" />
                FIFA World Cup 2026
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Futbol seferi ucun eSIM paketleri
              </h1>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/88 sm:text-lg">
                ABŞ, Kanada ve Meksikada oyun gunu bilet, xerite, WhatsApp ve taksi ucun internetiniz hazir olsun.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#packages" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#0f7a3b] shadow-xl">
                  Paketlere bax <ArrowRight className="h-4 w-4" />
                </a>
                <a href="https://wa.me/994992010117" className="inline-flex items-center gap-2 rounded-2xl bg-black/20 px-5 py-3 text-sm font-black text-white ring-1 ring-white/25">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div className="aspect-square rounded-full bg-white p-5 shadow-2xl">
                <div className="grid h-full grid-cols-3 grid-rows-3 gap-3 rounded-full bg-gray-950 p-5">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <div
                      key={index}
                      className={`rounded-[28%] ${index % 2 === 0 ? 'bg-white' : 'bg-[#111827]'} ${footballPattern(index)}`}
                    />
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-3 left-5 right-5 rounded-3xl bg-white px-5 py-4 text-gray-950 shadow-2xl">
                <p className="text-xs font-black uppercase text-gray-500">World Cup internet</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-2xl font-black">3G/4G/5G</span>
                  <Wifi className="h-7 w-7 text-[#0f7a3b]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6" id="packages">
          <div className="grid gap-3 sm:grid-cols-3">
            {COUNTRIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCountry(item)}
                className={`rounded-3xl border p-4 text-left transition ${
                  country === item
                    ? 'border-[#0f7a3b] bg-white shadow-lg'
                    : 'border-gray-200 bg-white/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{COUNTRY_COPY[item].flag}</span>
                  {country === item && <Check className="h-5 w-5 text-[#0f7a3b]" />}
                </div>
                <p className="mt-3 text-lg font-black">{item}</p>
                <p className="mt-1 min-h-[44px] text-sm font-semibold text-gray-600">{COUNTRY_COPY[item].city}</p>
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-[2rem] bg-white p-3 shadow-sm ring-1 ring-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('standard')}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${type === 'standard' ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Standart paketler
              </button>
              <button
                type="button"
                onClick={() => setType('daily')}
                className={`rounded-2xl px-4 py-3 text-sm font-black transition ${type === 'daily' ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Gunluk paketler
              </button>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-72 animate-pulse rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-200">
                  <div className="h-full rounded-[2rem] bg-gradient-to-br from-gray-100 via-white to-gray-100" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="mt-6 rounded-[2rem] border border-red-200 bg-red-50 p-8 text-center">
              <Globe2 className="mx-auto h-10 w-10 text-red-600" />
              <p className="mt-4 text-xl font-black">Paketler yuklenmedi</p>
              <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-gray-300 bg-white p-8 text-center">
              <Globe2 className="mx-auto h-10 w-10 text-[#0f7a3b]" />
              <p className="mt-4 text-xl font-black">{country} paketleri tapilmadi</p>
              <p className="mt-2 text-sm font-semibold text-gray-600">{COUNTRY_COPY[country].note}</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`relative overflow-hidden rounded-[2rem] bg-white p-5 shadow-sm ring-1 transition hover:-translate-y-1 hover:shadow-xl ${
                    plan.featured ? 'ring-[#0f7a3b]/35' : 'ring-gray-200'
                  }`}
                >
                  <div className="absolute right-[-26px] top-[-26px] h-24 w-24 rounded-full bg-[#0f7a3b]/10" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase text-gray-500">{plan.country}</p>
                      <h2 className="mt-1 text-2xl font-black">{plan.data}</h2>
                    </div>
                    <div className="rounded-2xl bg-[#0f7a3b] px-3 py-2 text-sm font-black text-white">
                      -{discountPercent(plan)}%
                    </div>
                  </div>

                  <div className="relative mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-gray-50 p-3">
                      <CalendarDays className="h-4 w-4 text-[#0f7a3b]" />
                      <p className="mt-2 text-xs font-bold text-gray-500">Gun</p>
                      <p className="text-base font-black">{plan.days}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-3">
                      <ShieldCheck className="h-4 w-4 text-[#0f7a3b]" />
                      <p className="mt-2 text-xs font-bold text-gray-500">Sebeke</p>
                      <p className="text-base font-black">{plan.network}</p>
                    </div>
                  </div>

                  <div className="relative mt-5 flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-lg font-black line-through">{money(plan.comparePrice)}</span>
                        <BadgePercent className="h-4 w-4" />
                      </div>
                      <p className="text-3xl font-black text-gray-950">{money(plan.price)}</p>
                    </div>
                    {plan.featured && (
                      <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                        <Sparkles className="h-3.5 w-3.5" /> Secilir
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => openWhatsApp(plan)}
                    className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 px-4 py-3 text-sm font-black text-white transition hover:bg-[#0f7a3b]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp ile al
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
