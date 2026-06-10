import { FormEvent, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Copy,
  Gift,
  Globe2,
  GraduationCap,
  Handshake,
  Headphones,
  Link2,
  Loader2,
  Megaphone,
  Plane,
  Send,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import Seo from '../components/Seo';
import { supabase } from '../lib/supabase';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const CUSTOMER_DISCOUNT_PERCENT = 10;
const AGENT_COMMISSION_PERCENT = 15;

const partnerTypes = [
  { value: 'agency', label: 'Tur agentliyi' },
  { value: 'umrah', label: 'Hacc / Umre qrupu' },
  { value: 'education', label: 'Tehsil / viza sirketi' },
  { value: 'creator', label: 'Travel blogger' },
  { value: 'corporate', label: 'Korporativ travel' },
  { value: 'other', label: 'Diger' },
];

const gettingStarted = [
  {
    icon: ClipboardList,
    title: 'Qeydiyyatdan kecin',
    text: 'Formu doldurun, komanda muracietinizi yoxlayir ve uygun emekdasliq modelini tesdiqleyir.',
  },
  {
    icon: Megaphone,
    title: 'eSIM teklif edin',
    text: 'Sexsi linki ve endirim kodunu musterilerinize, izləyicilerinize ve satis kanallariniza paylasin.',
  },
  {
    icon: Wallet,
    title: 'Komissiya qazanin',
    text: 'Musteri eSIM aldıqda satis agent kodunuza yazilir, komissiya panelde gorunur ve hesabata dusur.',
  },
];

const partnerSegments = [
  {
    icon: Plane,
    title: 'Tur agentlikleri',
    text: 'Xarice geden musterilere eSIM internet paketlerini elave xidmet kimi teklif edin.',
  },
  {
    icon: Users,
    title: 'Qrup rehberleri',
    text: 'Umre, Hacc, tehsil ve qrup turlarinda istirakcilarin internet baglantisini evvelceden hell edin.',
  },
  {
    icon: GraduationCap,
    title: 'Tehsil ve viza sirketleri',
    text: 'Xarice geden telebelere ilk gunden internet baglantisini evvelceden teqdim edin.',
  },
  {
    icon: Building2,
    title: 'Korporativ travel',
    text: 'Ezamiyyete geden emekdaslar ucun eSIM internet ve WhatsApp desteyini bir yerde teqdim edin.',
  },
];

const trackingPoints = [
  'Agent linkine daxil olan musterinin kodu 30 gun yadda saxlanilir.',
  'WhatsApp mesajinda endirim kodu avtomatik gorunur.',
  'Odenis tesdiqlenende eSIM satisi agent paneline yazilir.',
  'Eyni sifaris nomresi tekrar gelse, sistem kohne setri yenileyir.',
];

const benefits = [
  {
    icon: BarChart3,
    title: 'Agent paneli',
    text: 'Leadler, tesdiqlenmis eSIM satislari ve komissiya meblegi ayrica panelde gorunur.',
  },
  {
    icon: Gift,
    title: '10% musteri endirimi',
    text: 'Musteri agent kodu ile eSIM alanda 10% endirim alir. Bu endirim satisi daha rahat baglamaq ucundur.',
  },
  {
    icon: Wallet,
    title: '15% agent komissiyasi',
    text: 'Agent komissiyasi endirim olunmus yekun eSIM satis qiymetinin 15%-i kimi hesablanir.',
  },
  {
    icon: Headphones,
    title: 'Musteri desteyi',
    text: 'eSIM aktivasiya, QR ve paket secimi suallarinda musteri ile Ey Dost komandasi isleyir.',
  },
  {
    icon: Link2,
    title: 'Sexsi link',
    text: 'Agent linki kampaniya, sosial media, email ve WhatsApp paylasimi ucun istifade oluna biler.',
  },
  {
    icon: Copy,
    title: 'Hazir satis metnleri',
    text: 'Agentler ucun qisa teqdimat, WhatsApp mesaji ve paylasim metni hazirlamaq mumkundur.',
  },
  {
    icon: ShieldCheck,
    title: 'Seffaf izleme',
    text: 'Satislar referral kod ve odenis tesdiqi esasinda yazilir, komissiya ayrica hesablanir.',
  },
];

const faqs = [
  {
    q: 'Ey Dost affiliate proqrami nece isleyir?',
    a: 'Agente xususi link ve endirim kodu verilir. Musteri hemin link ve ya kodla eSIM aldıqda satis agent hesabina yazilir ve komissiya hesablanir.',
  },
  {
    q: 'Kimler qosula biler?',
    a: 'Tur agentlikleri, travel bloggerler, qrup rehberleri, viza ve tehsil sirketleri, korporativ travel komandaları ve seyahet auditoriyasi olan partnyorlar qosula biler.',
  },
  {
    q: 'Satislar nece izlenir?',
    a: 'Agent linki brauzerde 30 gun saxlanilir. Musteri WhatsApp-a kecende mesajda endirim kodu gorunur. Odenis tesdiqinden sonra satis agent panelinde qeyd olunur.',
  },
  {
    q: 'Komissiya ne qederdir?',
    a: `Musteri ${CUSTOMER_DISCOUNT_PERCENT}% endirim alir. Agent komissiyasi endirim olunmus yekun eSIM satis qiymetinin ${AGENT_COMMISSION_PERCENT}%-i kimi hesablanir.`,
  },
  {
    q: 'Qeydiyyat ve ayliq odenis varmi?',
    a: 'Xeyr. Partner olmaq ucun setup fee ve ayliq odenis yoxdur. Komissiya yalniz tamamlanmis eSIM satislarina gore hesablanir.',
  },
  {
    q: 'Musteri desteyini kim verir?',
    a: 'Musteriye eSIM aktivasiya, QR, paket secimi ve istifade uzre esas desteyi Ey Dost komandasi verir. Agent musterini duzgun link ve kodla yonlendirir.',
  },
  {
    q: 'Qadagan olunan trafik varmi?',
    a: 'Saxta klik, bot trafik, spam, aldadici reklam ve brend adina icazesiz reklam qebul edilmir. Seffaf ve real satis kanallari ile isleyirik.',
  },
];

export default function Partners() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    whatsapp: '',
    partnerType: 'agency',
    monthlyClients: '',
    message: '',
  });

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const { error } = await supabase.from('partner_applications').insert([
        {
          full_name: form.fullName,
          company_name: form.companyName,
          email: form.email,
          whatsapp: form.whatsapp,
          partner_type: form.partnerType,
          monthly_clients: form.monthlyClients,
          message: form.message,
        },
      ]);

      if (error) throw error;

      setStatus('success');
      setForm({
        fullName: '',
        companyName: '',
        email: '',
        whatsapp: '',
        partnerType: 'agency',
        monthlyClients: '',
        message: '',
      });
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Muraciet gonderilmedi');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title="Affiliate ve Partner Proqrami"
        description="Ey Dost affiliate proqramina qosulun. Musterilerinize eSIM paketleri teklif edin, sexsi link ve endirim kodu ile tesdiqlenmis satislardan komissiya qazanin."
        canonicalPath="/partners"
      />
      <Header />

      <main className="pt-20">
        <section className="bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                <Handshake className="h-4 w-4" />
                Ey Dost Affiliate Program
              </div>
              <h1 className="mb-6 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                eSIM satislarindan elave gelir qazanin
              </h1>
              <p className="mb-8 max-w-2xl text-lg leading-relaxed text-slate-300">
                eSIM internet paketlerini auditoriyaniza teklif edin. Ey Dost size sexsi link, endirim kodu ve agent paneli verir,
                tesdiqlenmis eSIM satislarindan komissiya hesablayir.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#apply"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition-colors hover:bg-orange-600"
                >
                  Partner olmaq isteyirem <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/agent/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-950 transition-colors hover:bg-slate-100"
                >
                  Agent paneline giris
                </a>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 text-slate-900 shadow-2xl lg:p-8">
              <div className="mb-6 grid grid-cols-2 gap-4">
                {[
                  { icon: Globe2, value: '150+', label: 'eSIM istiqameti' },
                  { icon: Gift, value: '10%', label: 'musteri endirimi' },
                  { icon: Wallet, value: '15%', label: 'agent komissiyasi' },
                  { icon: Smartphone, value: '30 gun', label: 'referral yaddasi' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <Icon className="mb-3 h-5 w-5 text-orange-500" />
                      <div className="text-2xl font-extrabold">{item.value}</div>
                      <div className="text-xs font-semibold text-slate-500">{item.label}</div>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
                <p className="text-sm font-semibold leading-relaxed text-orange-900">
                  Musteri 10% endirim alir. Agent ise endirim olunmus yekun eSIM satis qiymetinden 15% komissiya qazanir.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-3xl">
              <h2 className="mb-3 text-3xl font-extrabold text-slate-900">Auditoriyanizi nece gelire cevirirsiniz?</h2>
              <p className="leading-relaxed text-slate-600">
                Seyahet eden musterinin internete real ehtiyaci var. Siz tovsiye edirsiniz, Ey Dost xidmeti ve desteyi idare edir,
                satis tesdiqlenende komissiya size yazilir.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {gettingStarted.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                    <Icon className="mb-4 h-9 w-9 text-blue-600" />
                    <h3 className="mb-2 font-extrabold text-slate-900">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto grid max-w-7xl items-start gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 className="mb-4 text-3xl font-extrabold text-slate-900">Satislar nece izlenir?</h2>
              <p className="mb-6 leading-relaxed text-slate-600">
                Sistem agent linkini ve endirim kodunu birlikde istifade edir. Musteri bir defe agent linkinden gelibse,
                kod 30 gun erzinde WhatsApp mesajina elave olunur.
              </p>
              <div className="space-y-3">
                {trackingPoints.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    <p className="text-sm font-semibold text-slate-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-6 text-white lg:p-8">
              <BadgeCheck className="mb-5 h-9 w-9 text-orange-400" />
              <h3 className="mb-3 text-2xl font-extrabold">Seffaf komissiya modeli</h3>
              <p className="mb-6 leading-relaxed text-slate-300">
                Komissiya yalniz tesdiqlenmis eSIM satislarindan hesablanir. Musteri 10% endirim alir, agent komissiyasi
                endirimli satis mebleginin 15%-i kimi panelde gorunur.
              </p>
              <a href="/agent/login" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-slate-950">
                Agent paneline bax <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl">
              <h2 className="mb-3 text-3xl font-extrabold text-slate-900">Kimler ucun uygundur?</h2>
              <p className="text-slate-600">
                Xarice musteri gonderen ve ya seyahet auditoriyasi olan her komanda eSIM paketlerini elave deyer kimi teqdim ede biler.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {partnerSegments.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                    <Icon className="mb-4 h-8 w-8 text-blue-600" />
                    <h3 className="mb-2 font-extrabold text-slate-900">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl">
              <h2 className="mb-3 text-3xl font-extrabold text-slate-900">Partnerlere ne veririk?</h2>
              <p className="text-slate-600">
                Meqsed agentin texniki isini azaltmaqdir: siz musterini getirirsiniz, izleme ve eSIM xidmetini sistem idare edir.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-slate-100 bg-white p-6">
                    <Icon className="mb-4 h-8 w-8 text-orange-500" />
                    <h3 className="mb-2 font-extrabold text-slate-900">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="apply" className="bg-white py-16">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <h2 className="mb-4 text-3xl font-extrabold text-slate-900">Partner olmaq isteyirsiniz?</h2>
              <p className="mb-6 leading-relaxed text-slate-600">
                Formu gonderin, komanda sizinle elaqe saxlayib kod, panel ve eSIM satis modelini aktivlesdirecek.
              </p>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-sm text-slate-600">Daha suretli cavab ucun WhatsApp-la da yaza bilersiniz:</p>
                <a href="https://wa.me/994992000444" className="mt-2 inline-flex font-bold text-blue-600">
                  +994 99 200 04 44
                </a>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Ad Soyad</span>
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Sirket adi</span>
                  <input
                    required
                    value={form.companyName}
                    onChange={(e) => update('companyName', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Email</span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">WhatsApp</span>
                  <input
                    value={form.whatsapp}
                    onChange={(e) => update('whatsapp', e.target.value)}
                    placeholder="+994..."
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Partner tipi</span>
                  <select
                    value={form.partnerType}
                    onChange={(e) => update('partnerType', e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  >
                    {partnerTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Ayliq texmini musteri sayi</span>
                  <input
                    value={form.monthlyClients}
                    onChange={(e) => update('monthlyClients', e.target.value)}
                    placeholder="Mes: 20-50"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Mesaj</span>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  placeholder="Hansi istiqametlere musteri gonderirsiniz?"
                  className="mt-2 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                />
              </label>

              {status === 'success' && (
                <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
                  Muraciet gonderildi. Tezlikle sizinle elaqe saxlayacagiq.
                </div>
              )}
              {status === 'error' && (
                <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {errorMessage || 'Muraciet gonderilmedi. Bir az sonra yeniden yoxlayin.'}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-3.5 font-bold text-white transition-colors hover:bg-orange-700 disabled:opacity-60"
              >
                {status === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Muracieti gonder
              </button>
            </form>
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-10 text-center text-3xl font-extrabold text-slate-900">Tez-tez verilen suallar</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {faqs.map((item) => (
                <div key={item.q} className="rounded-2xl border border-slate-100 bg-white p-5">
                  <h3 className="mb-2 font-extrabold text-slate-900">{item.q}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
