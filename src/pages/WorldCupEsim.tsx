import { useMemo, useState } from 'react';
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
  cost: number;
  normalPrice?: number;
  type: PlanType;
  network: string;
  featured?: boolean;
}

const MARKUP = 1.75;

const COUNTRIES: HostCountry[] = ['United States', 'Canada', 'Mexico'];

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

const US_PLANS: WorldCupPlan[] = [
  { country: 'United States', name: 'United States 1GB 7Days', data: '1GB', days: '7', cost: 0.9, normalPrice: 2.9, type: 'standard', network: '3G/4G/5G' },
  { country: 'United States', name: 'United States 3GB 15Days', data: '3GB', days: '15', cost: 2.2, normalPrice: 7.3, type: 'standard', network: '3G/4G/5G' },
  { country: 'United States', name: 'United States 5GB 30Days', data: '5GB', days: '30', cost: 3.4, normalPrice: 10.9, type: 'standard', network: '3G/4G/5G' },
  { country: 'United States', name: 'United States 10GB 30Days', data: '10GB', days: '30', cost: 6.63, normalPrice: 18.9, type: 'standard', network: '3G/4G/5G', featured: true },
  { country: 'United States', name: 'United States 20GB 30Days', data: '20GB', days: '30', cost: 12.43, normalPrice: 33.9, type: 'standard', network: '3G/4G/5G', featured: true },
  { country: 'United States', name: 'United States 50GB 30Days', data: '50GB', days: '30', cost: 28, normalPrice: 74.9, type: 'standard', network: '3G/4G/5G', featured: true },
  { country: 'United States', name: 'United States 100GB 10Days (USIP-FIFA)', data: '100GB', days: '10', cost: 69.9, normalPrice: 119, type: 'standard', network: '3G/4G/5G', featured: true },
  { country: 'United States', name: 'United States 1GB/Day', data: '1GB/Day', days: '1-365', cost: 1.3, type: 'daily', network: '3G/4G/5G' },
  { country: 'United States', name: 'United States 2GB/Day', data: '2GB/Day', days: '1-365', cost: 1.59, type: 'daily', network: '3G/4G/5G' },
  { country: 'United States', name: 'United States 3GB/Day', data: '3GB/Day', days: '1-365', cost: 3.8, type: 'daily', network: '3G/4G/5G' },
  { country: 'United States', name: 'United States 5GB/Day (USIP)', data: '5GB/Day', days: '1-365', cost: 3.21, type: 'daily', network: '3G/4G/5G' },
  { country: 'United States', name: 'United States 10GB/Day', data: '10GB/Day', days: '1-365', cost: 4.95, type: 'daily', network: '3G/4G/5G', featured: true },
];

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function salePrice(plan: WorldCupPlan): number {
  return Number((plan.cost * MARKUP).toFixed(2));
}

function comparePrice(plan: WorldCupPlan): number {
  return plan.normalPrice ?? Number((plan.cost * 2).toFixed(2));
}

function discountPercent(plan: WorldCupPlan): number {
  const compare = comparePrice(plan);
  const sale = salePrice(plan);
  return Math.round(((compare - sale) / compare) * 100);
}

function footballPattern(index: number): string {
  const patterns = ['rotate-6', '-rotate-3', 'rotate-12', '-rotate-6'];
  return patterns[index % patterns.length];
}

export default function WorldCupEsim() {
  const [country, setCountry] = useState<HostCountry>('United States');
  const [type, setType] = useState<PlanType>('standard');

  const plans = useMemo(() => {
    if (country !== 'United States') return [];
    return US_PLANS
      .filter((plan) => plan.type === type)
      .sort((a, b) => Number(b.featured || false) - Number(a.featured || false) || salePrice(a) - salePrice(b));
  }, [country, type]);

  const openWhatsApp = async (plan: WorldCupPlan) => {
    await trackAgentLead({
      productType: 'esim',
      packageName: plan.name,
      viewedPackage: `World Cup 2026 ${plan.country} ${plan.data} ${plan.days} days`,
      page: '/world-cup-2026-esim',
    });

    const message = appendReferralToMessage(
      [
        'Salam, World Cup 2026 ucun eSIM almaq isteyirem.',
        `Olke: ${plan.country}`,
        `Paket: ${plan.data} / ${plan.days} gun`,
        `Qiymet: ${money(salePrice(plan))}`,
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

          {plans.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-gray-300 bg-white p-8 text-center">
              <Globe2 className="mx-auto h-10 w-10 text-[#0f7a3b]" />
              <p className="mt-4 text-xl font-black">{country} paketleri hazirlanir</p>
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
                        <span className="text-lg font-black line-through">{money(comparePrice(plan))}</span>
                        <BadgePercent className="h-4 w-4" />
                      </div>
                      <p className="text-3xl font-black text-gray-950">{money(salePrice(plan))}</p>
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
