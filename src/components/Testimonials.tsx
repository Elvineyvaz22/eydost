import { Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const testimonials = [
  {
    name: 'Aynur M.',
    location: 'Bakı, Azərbaycan',
    flag: '🇦🇿',
    rating: 5,
    text: {
      en: "Bought a Turkey eSIM for my vacation. Got the QR code on WhatsApp in under 2 minutes. No app, no ID — just instant internet. Absolutely love it!",
      az: "Tətil üçün Türkiyə eSIM aldım. WhatsApp-da QR kodu 2 dəqiqədən az müddətdə gəldi. Heç bir proqram, şəxsiyyət sənədi lazım olmadı — sadəcə ani internet. Çox bəyəndim!",
      ru: "Купила eSIM для Турции к отпуску. QR-код пришёл в WhatsApp менее чем за 2 минуты. Никаких приложений, никакого удостоверения — просто мгновенный интернет. Очень доволен!",
    }
  },
  {
    name: 'Rauf H.',
    location: 'Dubai, UAE',
    flag: '🇦🇪',
    rating: 5,
    text: {
      en: "Used Ey Dost for a taxi in Istanbul. The driver was on time, car was clean, price was fair. Booked everything through WhatsApp in 3 messages. Game changer.",
      az: "İstanbulda taksi üçün Ey Dost-dan istifadə etdim. Sürücü vaxtında gəldi, avtomobil təmiz idi, qiymət ədalətli idi. Hər şeyi WhatsApp-da 3 mesajla sifariş etdim. Əla xidmət.",
      ru: "Воспользовался Ey Dost для такси в Стамбуле. Водитель приехал вовремя, машина чистая, цена справедливая. Всё заказал через WhatsApp в 3 сообщения. Отлично.",
    }
  },
  {
    name: 'Leyla K.',
    location: 'London, UK',
    flag: '🇬🇧',
    rating: 5,
    text: {
      en: "I travel for work every month. Ey Dost has become my go-to for eSIMs. Europe package works perfectly across 35 countries. 24/7 support is a lifesaver.",
      az: "Hər ay iş üçün səfər edirəm. Ey Dost eSIM üçün əvəzolunmaz oldu. Avropa paketi 35 ölkədə mükəmməl işləyir. 24/7 dəstək həyat xilastedicidir.",
      ru: "Я путешествую по работе каждый месяц. Ey Dost стал моим выбором для eSIM. Европейский пакет отлично работает в 35 странах. Поддержка 24/7 — это спасение.",
    }
  },
  {
    name: 'Tural A.',
    location: 'Berlin, Germany',
    flag: '🇩🇪',
    rating: 5,
    text: {
      en: "Skeptical at first about WhatsApp-based service, but wow. eSIM arrived instantly, worked perfectly in Germany. Will use for every trip from now on.",
      az: "Əvvəlcə WhatsApp əsaslı xidmətə şübhə ilə yanaşdım, amma əla. eSIM dərhal gəldi, Almaniyada mükəmməl işlədi. Bundan sonra hər səfərdə istifadə edəcəm.",
      ru: "Сначала скептически отнёсся к сервису через WhatsApp, но wow. eSIM пришёл мгновенно, отлично работал в Германии. Буду использовать в каждой поездке.",
    }
  },
  {
    name: 'Nigar R.',
    location: 'Paris, France',
    flag: '🇫🇷',
    rating: 5,
    text: {
      en: "Got a taxi through Ey Dost at Charles de Gaulle airport at midnight. Driver was waiting with a sign. Stress-free arrival. Highly recommend!",
      az: "Gecə yarısı Şarl de Qol hava limanında Ey Dost vasitəsilə taksi sifariş etdim. Sürücü lövhəciklə gözləyirdi. Stresssiz gəliş. Tövsiyə edirəm!",
      ru: "Вызвал такси через Ey Dost в аэропорту Шарль-де-Голль в полночь. Водитель ждал с табличкой. Приезд без стресса. Очень рекомендую!",
    }
  },
  {
    name: 'Kamran B.',
    location: 'İstanbul, Turkey',
    flag: '🇹🇷',
    rating: 5,
    text: {
      en: "Best eSIM service I've tried. Cheaper than airport SIMs, faster to activate, and support actually replies. What more do you need?",
      az: "İndiyə qədər istifadə etdiyim ən yaxşı eSIM xidməti. Hava limanı SIM-lərindən ucuz, aktivləşdirməsi daha sürətli, dəstək həqiqətən cavab verir. Başqa nə lazımdır?",
      ru: "Лучший eSIM-сервис, который я пробовал. Дешевле аэропортовых SIM, быстрее активируется, поддержка действительно отвечает. Что ещё нужно?",
    }
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const { language } = useLanguage();
  const lang = (language as 'en' | 'az' | 'ru') in { en: 1, az: 1, ru: 1 } ? language as 'en' | 'az' | 'ru' : 'en';

  const title = { en: 'What Our Customers Say', az: 'Müştərilərimiz Nə Deyir', ru: 'Что говорят наши клиенты' }[lang];
  const subtitle = {
    en: 'Thousands of travelers trust Ey Dost for eSIM and taxi worldwide.',
    az: 'Minlərlə səyahətçi dünya üzrə eSIM və taksi üçün Ey Dost-a etibar edir.',
    ru: 'Тысячи путешественников доверяют Ey Dost для eSIM и такси по всему миру.',
  }[lang];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">{title}</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">{subtitle}</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            </div>
            <span className="text-sm font-semibold text-gray-700">4.9/5</span>
            <span className="text-sm text-gray-400">· 2,400+ {lang === 'az' ? 'rəy' : lang === 'ru' ? 'отзывов' : 'reviews'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <StarRating count={t.rating} />
                <span className="text-2xl">{t.flag}</span>
              </div>

              <p className="text-gray-700 text-sm leading-relaxed flex-1 mb-5">
                "{t.text[lang]}"
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
