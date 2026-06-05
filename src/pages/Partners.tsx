import { FormEvent, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Car,
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

const partnerTypes = [
  { value: 'agency', label: 'Tur agentliyi' },
  { value: 'umrah', label: 'Həcc / Ümrə qrupu' },
  { value: 'education', label: 'Təhsil / viza şirkəti' },
  { value: 'creator', label: 'Travel blogger' },
  { value: 'corporate', label: 'Korporativ travel' },
  { value: 'other', label: 'Digər' },
];

const gettingStarted = [
  {
    icon: ClipboardList,
    title: 'Qeydiyyatdan keçin',
    text: 'Formu doldurun, komanda müraciətinizi yoxlasın və sizə uyğun əməkdaşlıq modelini təsdiqləsin.',
  },
  {
    icon: Megaphone,
    title: 'Tövsiyə edin',
    text: 'Sizə verilən şəxsi linki və endirim kodunu müştərilərinizə, izləyicilərinizə və satış kanallarınıza paylaşın.',
  },
  {
    icon: Wallet,
    title: 'Komissiya qazanın',
    text: 'Müştəri alış etdikdə satış agent kodunuza yazılır, komissiya paneldə görünür və hesabata düşür.',
  },
];

const partnerSegments = [
  {
    icon: Plane,
    title: 'Tur agentlikləri',
    text: 'Xaricə gedən müştərilərə eSIM internet və transferi əlavə xidmət kimi təklif edin.',
  },
  {
    icon: Users,
    title: 'Qrup rəhbərləri',
    text: 'Ümrə, Həcc, təhsil və qrup turlarında iştirakçılar üçün internet bağlantısını əvvəlcədən həll edin.',
  },
  {
    icon: GraduationCap,
    title: 'Təhsil və viza şirkətləri',
    text: 'Xaricə gedən tələbələrə ilk gündən internet və hava limanı transfer dəstəyi təqdim edin.',
  },
  {
    icon: Building2,
    title: 'Korporativ travel',
    text: 'Ezamiyyətə gedən əməkdaşlar üçün eSIM, transfer və WhatsApp dəstəyini bir yerdə təqdim edin.',
  },
];

const trackingPoints = [
  'Agent linkinə daxil olan müştərinin kodu 30 gün yadda saxlanılır.',
  'WhatsApp mesajında endirim kodu avtomatik görünür.',
  'Ödəniş təsdiqlənəndə satış agent panelinə yazılır.',
  'Eyni sifariş nömrəsi təkrar gəlsə, sistem köhnə sətri yeniləyir.',
];

const benefits = [
  {
    icon: BarChart3,
    title: 'Agent paneli',
    text: 'Satışlar, lead-lər, təsdiqlənmiş sifarişlər və komissiya məbləği ayrıca paneldə görünür.',
  },
  {
    icon: Gift,
    title: 'Endirim kodu',
    text: 'Hər agent üçün yadda qalan xüsusi kod yaradırıq. Müştəri WhatsApp-da həmin kodla gəlir.',
  },
  {
    icon: Headphones,
    title: 'Müştəri dəstəyi',
    text: 'eSIM aktivasiya, QR, paket seçimi və transfer suallarında müştəri ilə Ey Dost komandası işləyir.',
  },
  {
    icon: Link2,
    title: 'Şəxsi link',
    text: 'Agent linki kampaniya, sosial media, email və WhatsApp paylaşımı üçün istifadə oluna bilər.',
  },
  {
    icon: Copy,
    title: 'Hazır satış mətnləri',
    text: 'Agentlər üçün qısa təqdimat, WhatsApp mesajı və paylaşım mətni hazırlamaq mümkündür.',
  },
  {
    icon: ShieldCheck,
    title: 'Şəffaf izləmə',
    text: 'Satışlar referral kod və ödəniş təsdiqi əsasında yazılır, komissiya ayrıca hesablanır.',
  },
];

const faqs = [
  {
    q: 'Ey Dost affiliate proqramı necə işləyir?',
    a: 'Agentə xüsusi link və endirim kodu verilir. Müştəri həmin link və ya kodla eSIM aldıqda satış agent hesabına yazılır və komissiya hesablanır.',
  },
  {
    q: 'Kimlər qoşula bilər?',
    a: 'Tur agentlikləri, travel bloggerlər, qrup rəhbərləri, viza və təhsil şirkətləri, korporativ travel komandaları və səyahət auditoriyası olan partnyorlar qoşula bilər.',
  },
  {
    q: 'Satışlar necə izlənir?',
    a: 'Agent linki brauzerdə 30 gün saxlanılır. Müştəri WhatsApp-a keçəndə mesajda endirim kodu görünür. Ödəniş təsdiqindən sonra satış agent panelində qeyd olunur.',
  },
  {
    q: 'Komissiya nə qədərdir?',
    a: 'Başlanğıc komissiya agent tipinə və satış modelinə görə razılaşdırılır. Test mərhələsində sadə faiz modeli ilə başlamaq, satış həcmi artdıqca şərtləri yeniləmək daha düzgündür.',
  },
  {
    q: 'Qeydiyyat və aylıq ödəniş varmı?',
    a: 'Xeyr. Partner olmaq üçün setup fee və aylıq ödəniş yoxdur. Komissiya yalnız tamamlanmış satışlara görə hesablanır.',
  },
  {
    q: 'Müştəri dəstəyini kim verir?',
    a: 'Müştəriyə eSIM, aktivasiya, paket seçimi və transfer üzrə əsas dəstəyi Ey Dost komandası verir. Agent sadəcə müştərini düzgün link və kodla yönləndirir.',
  },
  {
    q: 'Promo kod yalnız yeni müştəri üçün olacaq?',
    a: 'İlk mərhələdə promo kodu əsasən yeni müştərilər üçün istifadə etmək daha düzgündür. Bu qayda kampaniyaya görə dəyişdirilə bilər.',
  },
  {
    q: 'Qadağan olunan trafik varmı?',
    a: 'Saxta klik, bot trafik, spam, aldadıcı reklam və brend adına icazəsiz reklam qəbul edilmir. Şəffaf və real satış kanalları ilə işləyirik.',
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
      setErrorMessage(err instanceof Error ? err.message : 'Müraciət göndərilmədi');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title="Affiliate və Partner Proqramı"
        description="Ey Dost affiliate proqramına qoşulun. Müştərilərinizə eSIM və transfer təklif edin, şəxsi link və endirim kodu ilə təsdiqlənmiş satışlardan komissiya qazanın."
        canonicalPath="/partners"
      />
      <Header />

      <main className="pt-20">
        <section className="bg-slate-950 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-2 text-sm font-semibold text-cyan-100 mb-6">
                <Handshake className="w-4 h-4" />
                Ey Dost Affiliate Program
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Səyahət müştərilərinizdən əlavə gəlir qazanın
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mb-8">
                eSIM internet paketləri və transfer sifarişlərini auditoriyanıza tövsiyə edin. Ey Dost sizə
                şəxsi link, endirim kodu və agent paneli verir, təsdiqlənmiş satışlardan komissiya hesablayır.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#apply"
                  className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
                >
                  Partner olmaq istəyirəm <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/agent/login"
                  className="inline-flex items-center gap-2 bg-white text-slate-950 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                >
                  Agent panelinə giriş
                </a>
              </div>
            </div>

            <div className="bg-white text-slate-900 rounded-3xl p-6 lg:p-8 shadow-2xl">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { icon: Globe2, value: '150+', label: 'eSIM istiqaməti' },
                  { icon: Car, value: '50+', label: 'transfer ölkəsi' },
                  { icon: Smartphone, value: '30 gün', label: 'referral yaddaşı' },
                  { icon: TrendingUp, value: '0 AZN', label: 'qoşulma haqqı' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                      <Icon className="w-5 h-5 text-orange-500 mb-3" />
                      <div className="text-2xl font-extrabold">{item.value}</div>
                      <div className="text-xs text-slate-500 font-semibold">{item.label}</div>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl bg-orange-50 border border-orange-100 p-5">
                <p className="text-sm text-orange-900 font-semibold leading-relaxed">
                  Hər agentə xüsusi referral link və endirim kodu verilir. Müştəri həmin kodla gəldikdə satış
                  panelə yazılır və komissiya hesablanır.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Auditoriyanızı necə gəlirə çevirirsiniz?</h2>
              <p className="text-slate-600 leading-relaxed">
                Səyahət edən müştərinin internetə və transferə real ehtiyacı var. Siz tövsiyə edirsiniz, Ey Dost
                xidmət və dəstəyi idarə edir, satış təsdiqlənəndə komissiya sizə yazılır.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {gettingStarted.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="border border-slate-100 rounded-2xl p-6 bg-slate-50">
                    <Icon className="w-9 h-9 text-blue-600 mb-4" />
                    <h3 className="font-extrabold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Satışlar necə izlənir?</h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Sistem agent linkini və endirim kodunu birlikdə istifadə edir. Müştəri bir dəfə agent linkindən
                gəlibsə, kod 30 gün ərzində WhatsApp mesajına əlavə olunur.
              </p>
              <div className="space-y-3">
                {trackingPoints.map((item) => (
                  <div key={item} className="flex gap-3 bg-white border border-slate-100 rounded-2xl p-4">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold text-slate-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 text-white rounded-3xl p-6 lg:p-8">
              <BadgeCheck className="w-9 h-9 text-orange-400 mb-5" />
              <h3 className="text-2xl font-extrabold mb-3">Şəffaf komissiya modeli</h3>
              <p className="text-slate-300 leading-relaxed mb-6">
                Komissiya yalnız təsdiqlənmiş sifarişlərdən hesablanır. Hər satışda sifariş nömrəsi, məbləğ,
                status və komissiya agent panelində görünür.
              </p>
              <a href="/agent/login" className="inline-flex items-center gap-2 bg-white text-slate-950 px-5 py-3 rounded-xl font-bold">
                Agent panelinə bax <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Kimlər üçün uyğundur?</h2>
              <p className="text-slate-600">
                Xaricə müştəri göndərən və ya səyahət auditoriyası olan hər komanda Ey Dost xidmətlərini əlavə dəyər kimi təqdim edə bilər.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {partnerSegments.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="border border-slate-100 rounded-2xl p-6 bg-slate-50">
                    <Icon className="w-8 h-8 text-blue-600 mb-4" />
                    <h3 className="font-extrabold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Partnerlərə nə veririk?</h2>
              <p className="text-slate-600">
                Məqsəd agentin texniki işini azaltmaqdır: siz müştərini gətirirsiniz, izləmə və xidmət tərəfini sistem idarə edir.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {benefits.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="bg-white border border-slate-100 rounded-2xl p-6">
                    <Icon className="w-8 h-8 text-orange-500 mb-4" />
                    <h3 className="font-extrabold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="apply" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[0.8fr_1.2fr] gap-10">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Partner olmaq istəyirsiniz?</h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Formu göndərin, komanda sizinlə əlaqə saxlayıb uyğun komissiya, kod və satış modelini müzakirə edəcək.
              </p>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                <p className="text-sm text-slate-600">
                  Daha sürətli cavab üçün WhatsApp-la da yaza bilərsiniz:
                </p>
                <a href="https://wa.me/994992000444" className="mt-2 inline-flex font-bold text-blue-600">
                  +994 99 200 04 44
                </a>
              </div>
            </div>

            <form onSubmit={submit} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Ad Soyad</span>
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                    className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Şirkət adı</span>
                  <input
                    required
                    value={form.companyName}
                    onChange={(e) => update('companyName', e.target.value)}
                    className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
                  />
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Email</span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">WhatsApp</span>
                  <input
                    value={form.whatsapp}
                    onChange={(e) => update('whatsapp', e.target.value)}
                    placeholder="+994..."
                    className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
                  />
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Partner tipi</span>
                  <select
                    value={form.partnerType}
                    onChange={(e) => update('partnerType', e.target.value)}
                    className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400 bg-white"
                  >
                    {partnerTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">Aylıq təxmini müştəri sayı</span>
                  <input
                    value={form.monthlyClients}
                    onChange={(e) => update('monthlyClients', e.target.value)}
                    placeholder="Məs: 20-50"
                    className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Mesaj</span>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  placeholder="Hansı istiqamətlərə müştəri göndərirsiniz?"
                  className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400 resize-y"
                />
              </label>

              {status === 'success' && (
                <div className="rounded-2xl bg-green-50 text-green-700 p-4 text-sm font-semibold">
                  Müraciət göndərildi. Tezliklə sizinlə əlaqə saxlayacağıq.
                </div>
              )}
              {status === 'error' && (
                <div className="rounded-2xl bg-red-50 text-red-700 p-4 text-sm font-semibold">
                  {errorMessage || 'Müraciət göndərilmədi. Bir az sonra yenidən yoxlayın.'}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full inline-flex items-center justify-center gap-2 bg-orange-600 text-white px-6 py-3.5 rounded-2xl font-bold hover:bg-orange-700 disabled:opacity-60 transition-colors"
              >
                {status === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Müraciəti göndər
              </button>
            </form>
          </div>
        </section>

        <section className="py-16 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-10">Tez-tez verilən suallar</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {faqs.map((item) => (
                <div key={item.q} className="border border-slate-100 bg-white rounded-2xl p-5">
                  <h3 className="font-extrabold text-slate-900 mb-2">{item.q}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
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
