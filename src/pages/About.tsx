import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import Seo from '../components/Seo';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Wifi, Car, Users, Globe, Shield, Zap } from 'lucide-react';

const content = {
  en: {
    title: 'About Ey Dost',
    subtitle: 'Your smart travel companion for eSIM and taxi — all through WhatsApp.',
    storyTitle: 'Our Story',
    story: [
      'Ey Dost was born from a simple frustration: why is getting internet abroad still so complicated in 2024? Queuing at airport SIM counters, buying expensive roaming packages, downloading yet another app — none of it made sense.',
      'We built Ey Dost to change that. By combining eSIM technology with WhatsApp — the messaging app already on 2 billion phones — we made it possible to get mobile internet in 150+ countries in under 2 minutes, with zero app downloads and zero ID required.',
      'Alongside eSIM, we expanded into taxi bookings across Europe. Same idea: no app, no hassle. Just message us on WhatsApp, share your pickup location, and we connect you with a verified local driver.',
    ],
    missionTitle: 'Our Mission',
    mission: 'To make travel connectivity as simple as sending a message — for everyone, everywhere.',
    valuesTitle: 'What We Stand For',
    values: [
      { icon: Zap, title: 'Speed', desc: 'eSIM delivered in under 2 minutes. Taxi confirmed in seconds.' },
      { icon: Globe, title: 'Global Reach', desc: '150+ countries for eSIM. 500+ European cities for taxi.' },
      { icon: Shield, title: 'Trust', desc: 'Verified drivers, real-time support, transparent pricing.' },
      { icon: Users, title: 'Simplicity', desc: 'No apps. No ID. No queues. Just WhatsApp.' },
      { icon: Wifi, title: 'Connectivity', desc: 'Stay connected wherever you travel.' },
      { icon: Car, title: 'Mobility', desc: 'Reliable rides at your fingertips across Europe.' },
    ],
    companyTitle: 'Company Information',
    companyName: 'NURTEL ELEKTRİK MMC',
    companyAddress: 'AZ5000, Sumqayıt, Nəriman Nərimanov 7/16, Azerbaijan',
    companyEmail: 'eydost@eydost.az',
    ctaTitle: 'Ready to travel smarter?',
    ctaButton: 'Get eSIM on WhatsApp',
    ctaTaxi: 'Book a Taxi',
  },
  az: {
    title: 'Haqqımızda',
    subtitle: 'eSIM və taksi üçün ağıllı səyahət yoldaşınız — hamısı WhatsApp vasitəsilə.',
    storyTitle: 'Hekayəmiz',
    story: [
      'Ey Dost sadə bir məsələdən doğdu: xaricdə internet almaq niyə bu qədər çətindir? Hava limanında SIM növbələri, bahalı roaming paketlər, yeni bir proqram yükləmək — bunların heç biri məntiqli deyildi.',
      'Ey Dost-u bunu dəyişmək üçün qurdurq. eSIM texnologiyasını artıq 2 milyard telefonda olan WhatsApp ilə birləşdirərək 150+ ölkədə 2 dəqiqə ərzində heç bir proqram yükləmədən mobil internet almağı mümkün etdik.',
      'eSIM ilə yanaşı, Avropa üzrə taksi sifarişini də əlavə etdik. Eyni ideya: proqram yoxdur, çaşqınlıq yoxdur. Sadəcə WhatsApp-da yazın, götürülmə yerini paylaşın — biz sizi yoxlanılmış yerli sürücü ilə birləşdiririk.',
    ],
    missionTitle: 'Missiyamız',
    mission: 'Səyahət əlaqəsini mesaj göndərmək qədər sadə etmək — hamı üçün, hər yerdə.',
    valuesTitle: 'Dəyərlərimiz',
    values: [
      { icon: Zap, title: 'Sürət', desc: '2 dəqiqə ərzində eSIM. Saniyələr içində taksi.' },
      { icon: Globe, title: 'Qlobal Əhatə', desc: 'eSIM üçün 150+ ölkə. Taksi üçün Avropada 500+ şəhər.' },
      { icon: Shield, title: 'Etibar', desc: 'Yoxlanılmış sürücülər, real vaxt dəstəyi, şəffaf qiymətlər.' },
      { icon: Users, title: 'Sadəlik', desc: 'Proqram yoxdur. ID yoxdur. Növbə yoxdur. Yalnız WhatsApp.' },
      { icon: Wifi, title: 'Əlaqə', desc: 'Harada səfər etsəniz bağlı qalın.' },
      { icon: Car, title: 'Mobillik', desc: 'Avropa üzrə etibarlı gəlişlər parmaklarınızın ucunda.' },
    ],
    companyTitle: 'Şirkət Məlumatları',
    companyName: 'NURTEL ELEKTRİK MMC',
    companyAddress: 'AZ5000, Sumqayıt, Nəriman Nərimanov 7/16, Azərbaycan',
    companyEmail: 'eydost@eydost.az',
    ctaTitle: 'Daha ağıllı səfərə hazırsınız?',
    ctaButton: 'WhatsApp-da eSIM Al',
    ctaTaxi: 'Taksi Sifariş Et',
  },
  ru: {
    title: 'О нас',
    subtitle: 'Ваш умный спутник в путешествиях — eSIM и такси через WhatsApp.',
    storyTitle: 'Наша история',
    story: [
      'Ey Dost родился из простого разочарования: почему получить интернет за рубежом всё ещё так сложно? Очереди за SIM-картами в аэропорту, дорогой роуминг, очередное приложение — всё это не имело смысла.',
      'Мы создали Ey Dost, чтобы это изменить. Объединив технологию eSIM с WhatsApp — приложением, уже установленным на 2 миллиардах телефонов — мы сделали возможным получить мобильный интернет в 150+ странах за 2 минуты без загрузок и без удостоверения.',
      'Помимо eSIM, мы добавили заказ такси по всей Европе. Та же идея: никаких приложений, никаких хлопот. Просто напишите в WhatsApp, поделитесь местом посадки — и мы соединим вас с проверенным местным водителем.',
    ],
    missionTitle: 'Наша миссия',
    mission: 'Сделать связь в путешествиях такой же простой, как отправка сообщения — для всех, везде.',
    valuesTitle: 'Наши ценности',
    values: [
      { icon: Zap, title: 'Скорость', desc: 'eSIM за 2 минуты. Такси за секунды.' },
      { icon: Globe, title: 'Глобальный охват', desc: '150+ стран для eSIM. 500+ городов Европы для такси.' },
      { icon: Shield, title: 'Доверие', desc: 'Проверенные водители, поддержка в реальном времени, прозрачные цены.' },
      { icon: Users, title: 'Простота', desc: 'Никаких приложений. Никакого ID. Никаких очередей. Только WhatsApp.' },
      { icon: Wifi, title: 'Связь', desc: 'Оставайтесь на связи, куда бы вы ни отправились.' },
      { icon: Car, title: 'Мобильность', desc: 'Надёжные поездки по всей Европе у вас под рукой.' },
    ],
    companyTitle: 'Информация о компании',
    companyName: 'NURTEL ELEKTRİK MMC',
    companyAddress: 'AZ5000, Сумгайыт, Нариман Нариманов 7/16, Азербайджан',
    companyEmail: 'eydost@eydost.az',
    ctaTitle: 'Готовы путешествовать умнее?',
    ctaButton: 'Получить eSIM в WhatsApp',
    ctaTaxi: 'Заказать такси',
  },
};

export default function About() {
  const { language } = useLanguage();
  const lang = (language as keyof typeof content) in content ? language as keyof typeof content : 'en';
  const c = content[lang];

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title={c.title}
        description={c.subtitle}
        canonicalPath="/about"
      />
      <Header />

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="bg-gradient-to-br from-gray-900 via-[#0A0F1C] to-gray-900 text-white py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">{c.title}</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">{c.subtitle}</p>
          </div>
        </section>

        {/* Story */}
        <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">{c.storyTitle}</h2>
          <div className="space-y-4">
            {c.story.map((p, i) => (
              <p key={i} className="text-gray-600 leading-relaxed">{p}</p>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="py-12 bg-blue-600 text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-extrabold mb-4">{c.missionTitle}</h2>
            <p className="text-xl text-blue-100 leading-relaxed">"{c.mission}"</p>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">{c.valuesTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {c.values.map((v, i) => {
                const Icon = v.icon;
                return (
                  <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{v.title}</h3>
                    <p className="text-sm text-gray-500">{v.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Company Info */}
        <section className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">{c.companyTitle}</h2>
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-2 text-sm text-gray-600">
            <p><span className="font-semibold text-gray-800">Company:</span> {c.companyName}</p>
            <p><span className="font-semibold text-gray-800">Address:</span> {c.companyAddress}</p>
            <p><span className="font-semibold text-gray-800">Email:</span>{' '}
              <a href={`mailto:${c.companyEmail}`} className="text-blue-600 hover:underline">{c.companyEmail}</a>
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">{c.ctaTitle}</h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://wa.me/994992000444"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#20bd5a] transition-colors"
            >
              <Wifi className="w-5 h-5" /> {c.ctaButton}
            </a>
            <Link
              to="/taxi"
              className="inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              <Car className="w-5 h-5" /> {c.ctaTaxi}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
