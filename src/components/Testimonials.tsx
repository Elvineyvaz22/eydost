import { Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const testimonials = [
  {
    name: 'Sophie W.',
    location: 'London, UK',
    flag: '🇬🇧',
    rating: 5,
    text: {
      en: "Bought a Europe eSIM before my trip. QR code arrived on WhatsApp in under 2 minutes. Worked perfectly in 8 countries. No app, no queues — just instant internet!",
      az: "Səfərdən əvvəl Avropa eSIM aldım. QR kodu WhatsApp-da 2 dəqiqəyə gəldi. 8 ölkədə mükəmməl işlədi. Heç bir proqram, növbə yoxdur — sadəcə ani internet!",
      ru: "Купила европейский eSIM перед поездкой. QR-код пришёл в WhatsApp за 2 минуты. Работал отлично в 8 странах. Никаких приложений, никаких очередей — просто мгновенный интернет!",
    }
  },
  {
    name: 'Marc D.',
    location: 'Paris, France',
    flag: '🇫🇷',
    rating: 5,
    text: {
      en: "Booked a taxi from Charles de Gaulle airport at midnight through Ey Dost. Driver was waiting with a name sign. Clean car, fair price. Absolute lifesaver.",
      az: "Gecə yarısı Şarl de Qol hava limanından Ey Dost vasitəsilə taksi sifariş etdim. Sürücü adım yazılmış lövhəciklə gözləyirdi. Təmiz avtomobil, ədalətli qiymət. Əvəzedilməz!",
      ru: "Заказал такси из аэропорта Шарль-де-Голль в полночь через Ey Dost. Водитель ждал с табличкой с моим именем. Чистая машина, честная цена. Просто незаменимо.",
    }
  },
  {
    name: 'Anna K.',
    location: 'Berlin, Germany',
    flag: '🇩🇪',
    rating: 5,
    text: {
      en: "I travel for work every month across Europe. Ey Dost is my go-to for both eSIM and taxi. The Europe package saves me so much — works in every country I visit.",
      az: "Hər ay iş üçün Avropa üzrə səfər edirəm. eSIM və taksi üçün Ey Dost əvəzolunmaz oldu. Avropa paketi hər getdiyim ölkədə işləyir — qənaət böyükdür.",
      ru: "Каждый месяц езжу по работе по Европе. Ey Dost — мой выбор и для eSIM, и для такси. Европейский пакет работает в каждой стране — экономия огромная.",
    }
  },
  {
    name: 'James O.',
    location: 'Amsterdam, Netherlands',
    flag: '🇳🇱',
    rating: 5,
    text: {
      en: "Skeptical about a WhatsApp-based taxi service, but it genuinely impressed me. Booked a ride from Schiphol, driver was professional, no surge pricing. Brilliant.",
      az: "WhatsApp əsaslı taksi xidmətinə şübhə ilə yanaşdım, amma həqiqətən təəccübləndim. Schiphol-dan sifariş etdim, sürücü peşəkar idi, qiymət artımı yox idi. Əla.",
      ru: "Скептически относился к такси через WhatsApp, но сервис реально впечатлил. Заказал из Схипхола — водитель профессиональный, никаких наценок. Отлично.",
    }
  },
  {
    name: 'Clara R.',
    location: 'Barcelona, Spain',
    flag: '🇪🇸',
    rating: 5,
    text: {
      en: "Used the Europe eSIM for a 3-week road trip across Spain, France and Italy. Never lost signal, support answered in seconds. Genuinely the best travel tool I've found.",
      az: "İspaniya, Fransa və İtaliyada 3 həftəlik yol səfəri üçün Avropa eSIM istifadə etdim. Əlaqəni heç vaxt itirmədim, dəstək saniyələr içində cavab verdi. Ən yaxşı səyahət alətidir.",
      ru: "Использовала европейский eSIM в 3-недельном роуд-трипе по Испании, Франции и Италии. Ни разу не потеряла сигнал, поддержка отвечала за секунды. Лучший travel-инструмент.",
    }
  },
  {
    name: 'Thomas H.',
    location: 'Vienna, Austria',
    flag: '🇦🇹',
    rating: 5,
    text: {
      en: "Pre-booked an early morning airport transfer in Vienna via WhatsApp. Got a confirmation instantly. Driver was there 10 minutes early. Will never use a regular taxi app again.",
      az: "Vyanada erkən səhər aeroport transferini WhatsApp-da əvvəlcədən sifariş etdim. Dərhal təsdiq gəldi. Sürücü 10 dəqiqə əvvəl gəldi. Artıq adi taksi proqramından istifadə etməyəcəm.",
      ru: "Заранее забронировал ранний трансфер в аэропорт Вены через WhatsApp. Подтверждение пришло мгновенно. Водитель был за 10 минут до времени. Больше никаких обычных такси-приложений.",
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
