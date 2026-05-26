import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import Seo from '../components/Seo';
import { useLanguage } from '../contexts/LanguageContext';

const LAST_UPDATED = 'May 8, 2026';
const EMAIL = 'info@eydost.com';
const WA_LINK = 'https://wa.me/994992000444';

type Box = { tone: 'green' | 'amber' | 'red'; title: string; items: string[] };

const content: Record<'en' | 'az' | 'ru', {
  title: string;
  updated: string;
  esimTitle: string;
  taxiTitle: string;
  howTitle: string;
  howSteps: string[];
  questionsHtml: { before: string; whatsapp: string; mid: string; email: string; after: string };
  esimBoxes: Box[];
  taxiBoxes: Box[];
}> = {
  en: {
    title: 'Refund Policy',
    updated: `Last updated: ${LAST_UPDATED}`,
    esimTitle: 'eSIM Refund Policy',
    taxiTitle: 'Taxi Refund Policy',
    howTitle: 'How to Request a Refund',
    howSteps: [
      'Message us on WhatsApp or email us.',
      'Include your order reference, purchase date, and reason for refund.',
      'Our team will review and respond within 48 hours.',
      'Approved refunds are processed within 5–10 business days to the original payment method.',
    ],
    questionsHtml: {
      before: 'Questions? Contact us at ',
      whatsapp: 'WhatsApp',
      mid: ' or email ',
      email: EMAIL,
      after: ". We're available 24/7.",
    },
    esimBoxes: [
      {
        tone: 'green',
        title: '✅ Full Refund Eligible',
        items: [
          'eSIM QR code has not been scanned and data has not been used.',
          'Request made within 24 hours of purchase.',
          'Technical issue on our side preventing eSIM activation.',
        ],
      },
      {
        tone: 'amber',
        title: '⚠️ Partial Refund or Credit',
        items: [
          'eSIM activated but less than 10% of data used — case-by-case review.',
          'Network issues in specific regions that are beyond our control — credit may be offered.',
        ],
      },
      {
        tone: 'red',
        title: '❌ Non-Refundable',
        items: [
          'eSIM QR code has been scanned and data usage has begun.',
          'Device incompatibility (please verify eSIM support before purchase).',
          'Customer changed travel plans.',
          'Refund requested more than 7 days after purchase.',
        ],
      },
    ],
    taxiBoxes: [
      {
        tone: 'green',
        title: '✅ Full Refund Eligible',
        items: [
          'Cancellation made more than 30 minutes before scheduled pickup time.',
          'Driver did not arrive within 15 minutes of confirmed pickup time.',
          'Double charge occurred due to technical error.',
        ],
      },
      {
        tone: 'red',
        title: '❌ Non-Refundable',
        items: [
          'Cancellation within 30 minutes of pickup — cancellation fee applies.',
          'No-show by customer.',
          'Ride completed successfully.',
        ],
      },
    ],
  },
  az: {
    title: 'Geri Qaytarma Siyasəti',
    updated: `Son yenilənmə: ${LAST_UPDATED}`,
    esimTitle: 'eSIM Geri Qaytarma Siyasəti',
    taxiTitle: 'Taksi Geri Qaytarma Siyasəti',
    howTitle: 'Geri qaytarma necə tələb olunur?',
    howSteps: [
      'Bizə WhatsApp-da yazın və ya e-poçt göndərin.',
      'Sifariş nömrəsi, alış tarixi və geri qaytarma səbəbini qeyd edin.',
      'Komandamız 48 saat ərzində baxıb cavab verir.',
      'Təsdiqlənmiş geri qaytarmalar 5–10 iş günü ərzində orijinal ödəniş üsuluna qaytarılır.',
    ],
    questionsHtml: {
      before: 'Suallarınız var? Bizə yazın: ',
      whatsapp: 'WhatsApp',
      mid: ' və ya e-poçt: ',
      email: EMAIL,
      after: '. 24/7 onlayn xidmətdəyik.',
    },
    esimBoxes: [
      {
        tone: 'green',
        title: '✅ Tam geri qaytarma',
        items: [
          'eSIM QR kod skan edilməyib və internetdən istifadə edilməyib.',
          'Alışdan 24 saat ərzində tələb verilib.',
          'eSIM-in aktivləşməsinə mane olan texniki problem bizim tərəfdədir.',
        ],
      },
      {
        tone: 'amber',
        title: '⚠️ Qismən geri qaytarma və ya kredit',
        items: [
          'eSIM aktivləşib, lakin 10%-dən az internet istifadə olunub — fərdi qaydada baxılır.',
          'Bizim nəzarətimizdən kənar olan regional şəbəkə problemləri — kredit təklif oluna bilər.',
        ],
      },
      {
        tone: 'red',
        title: '❌ Geri qaytarılmır',
        items: [
          'eSIM QR kod skan edilib və internet istifadəsi başlayıb.',
          'Cihaz uyğunsuzluğu (alışdan əvvəl eSIM dəstəyini yoxlayın).',
          'Müştəri səfər planını dəyişib.',
          'Geri qaytarma alışdan 7 gündən sonra tələb olunub.',
        ],
      },
    ],
    taxiBoxes: [
      {
        tone: 'green',
        title: '✅ Tam geri qaytarma',
        items: [
          'Götürülmə vaxtından 30 dəqiqə əvvəl ləğv edilib.',
          'Sürücü təsdiqlənmiş götürülmə vaxtından 15 dəqiqə sonra gəlməyib.',
          'Texniki səhv səbəbi ilə ikiqat ödəniş olub.',
        ],
      },
      {
        tone: 'red',
        title: '❌ Geri qaytarılmır',
        items: [
          'Götürülmədən 30 dəqiqə ərzində ləğv edilib — ləğvetmə haqqı tutulur.',
          'Müştəri görünməyib.',
          'Səfər uğurla tamamlanıb.',
        ],
      },
    ],
  },
  ru: {
    title: 'Политика возврата',
    updated: `Последнее обновление: ${LAST_UPDATED}`,
    esimTitle: 'Политика возврата для eSIM',
    taxiTitle: 'Политика возврата для такси',
    howTitle: 'Как запросить возврат',
    howSteps: [
      'Напишите нам в WhatsApp или на электронную почту.',
      'Укажите номер заказа, дату покупки и причину возврата.',
      'Наша команда рассмотрит запрос и ответит в течение 48 часов.',
      'Одобренные возвраты обрабатываются в течение 5–10 рабочих дней на исходный способ оплаты.',
    ],
    questionsHtml: {
      before: 'Остались вопросы? Свяжитесь с нами: ',
      whatsapp: 'WhatsApp',
      mid: ' или эл. почта ',
      email: EMAIL,
      after: '. Мы доступны 24/7.',
    },
    esimBoxes: [
      {
        tone: 'green',
        title: '✅ Полный возврат',
        items: [
          'QR-код eSIM не отсканирован, данные не использовались.',
          'Запрос подан в течение 24 часов после покупки.',
          'Технический сбой с нашей стороны, препятствующий активации.',
        ],
      },
      {
        tone: 'amber',
        title: '⚠️ Частичный возврат или кредит',
        items: [
          'eSIM активирована, но использовано менее 10% данных — рассматривается индивидуально.',
          'Региональные сетевые проблемы вне нашего контроля — может быть предложен кредит.',
        ],
      },
      {
        tone: 'red',
        title: '❌ Возврат невозможен',
        items: [
          'QR-код eSIM отсканирован и началось использование данных.',
          'Несовместимость устройства (проверьте поддержку eSIM перед покупкой).',
          'Клиент изменил планы поездки.',
          'Возврат запрошен спустя более 7 дней после покупки.',
        ],
      },
    ],
    taxiBoxes: [
      {
        tone: 'green',
        title: '✅ Полный возврат',
        items: [
          'Отмена сделана более чем за 30 минут до запланированного времени посадки.',
          'Водитель не прибыл в течение 15 минут после подтверждённого времени.',
          'Двойное списание из-за технической ошибки.',
        ],
      },
      {
        tone: 'red',
        title: '❌ Возврат невозможен',
        items: [
          'Отмена менее чем за 30 минут до подачи — удерживается плата за отмену.',
          'Клиент не явился.',
          'Поездка успешно завершена.',
        ],
      },
    ],
  },
};

const TONE_STYLES = {
  green: 'bg-green-50 border-green-200 text-green-800 [&_li]:text-green-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-800 [&_li]:text-amber-700',
  red: 'bg-red-50 border-red-200 text-red-800 [&_li]:text-red-700',
} as const;

function RefundBox({ box }: { box: Box }) {
  return (
    <div className={`rounded-xl p-4 border ${TONE_STYLES[box.tone]}`}>
      <p className="font-semibold mb-1">{box.title}</p>
      <ul className="list-disc pl-5 space-y-1">
        {box.items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

export default function Refund() {
  const { language } = useLanguage();
  const lang: 'en' | 'az' | 'ru' = language === 'az' || language === 'ru' ? language : 'en';
  const c = content[lang];

  return (
    <div className="min-h-screen bg-white">
      <Seo title={c.title} description="Ey Dost Refund Policy — eSIM and taxi refund conditions." canonicalPath="/refund" noIndex={false} />
      <Header />
      <main className="pt-24 pb-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{c.title}</h1>
        <p className="text-sm text-gray-400 mb-10">{c.updated}</p>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">{c.esimTitle}</h2>
            <div className="space-y-4">
              {c.esimBoxes.map((box, i) => (
                <RefundBox key={i} box={box} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">{c.taxiTitle}</h2>
            <div className="space-y-4">
              {c.taxiBoxes.map((box, i) => (
                <RefundBox key={i} box={box} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">{c.howTitle}</h2>
            <ol className="list-decimal pl-5 space-y-2">
              {c.howSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <p className="text-gray-600">
              {c.questionsHtml.before}
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                {c.questionsHtml.whatsapp}
              </a>
              {c.questionsHtml.mid}
              <a href={`mailto:${EMAIL}`} className="text-blue-600 hover:underline font-medium">
                {c.questionsHtml.email}
              </a>
              {c.questionsHtml.after}
            </p>
          </section>
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
