import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import { Shield, Lock, Eye, Server } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Seo from '../components/Seo';

export default function Privacy() {
  const { language } = useLanguage();

  const content = {
    az: {
      title: 'Gizlilik Siyasəti (Privacy Policy)',
      lastUpdated: 'Son yenilənmə: 27 Aprel 2026',
      intro: 'Ey Dost olaraq müştərilərimizin məxfiliyi və məlumatlarının təhlükəsizliyi bizim üçün prioritetdir. Bu sənəd məlumatlarınızın necə toplandığını və işlənildiyini izah edir.',
      sections: [
        {
          title: 'Biz Kimik?',
          icon: Shield,
          text: 'Ey Dost WhatsApp vasitəsilə qlobal eSIM paketləri və beynəlxalq taksi sifarişi xidmətlərini təqdim edən bir platformadır.'
        },
        {
          title: 'Məlumatların Analizi və AI',
          icon: Server,
          text: 'Xidmət keyfiyyətini artırmaq, istəklərinizi daha dəqiq anlamaq və sizə ən uyğun paketləri təklif etmək üçün WhatsApp üzərindən göndərdiyiniz mesajlar Süni İntellekt (AI) sistemləri tərəfindən analiz edilir.'
        },
        {
          title: 'Toplanan Məlumatlar',
          icon: Eye,
          text: 'Biz yalnız sifarişin yerinə yetirilməsi üçün lazım olan məlumatları (təyinat ölkəsi, seçilmiş paket, əlaqə nömrəsi) toplayırıq. Şəxsi mesajlarınız yalnız xidmət məqsədilə işlənilir.'
        },
        {
          title: 'Təhlükəsizlik və Paylaşım',
          icon: Lock,
          text: 'Məlumatlarınız üçüncü tərəflərə reklam məqsədilə satılmır. Yalnız ödəniş sistemləri və eSIM təminatçıları ilə sifarişin tamamlanması üçün zəruri olan texniki məlumatlar paylaşılır.'
        }
      ],
      consent: 'Xidmətimizdən istifadə etməklə siz mesajlarınızın AI tərəfindən analiz edilməsinə və bu gizlilik şərtlərinə razılıq vermiş olursunuz.'
    },
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated: April 27, 2026',
      intro: 'At Ey Dost, the privacy and security of our customers information is our priority. This document explains how your data is collected and processed.',
      sections: [
        {
          title: 'Who We Are',
          icon: Shield,
          text: 'Ey Dost is a platform providing global eSIM packages and international taxi bookings via WhatsApp.'
        },
        {
          title: 'Data Analysis and AI',
          icon: Server,
          text: 'To improve service quality, understand your requests accurately, and offer the most suitable packages, the messages you send via WhatsApp are analyzed by Artificial Intelligence (AI) systems.'
        },
        {
          title: 'Collected Data',
          icon: Eye,
          text: 'We only collect data necessary for order fulfillment (destination country, selected package, contact number). Your personal messages are processed only for service purposes.'
        },
        {
          title: 'Security and Sharing',
          icon: Lock,
          text: 'Your data is not sold to third parties for advertising purposes. Only necessary technical data is shared with payment systems and eSIM providers to complete the order.'
        }
      ],
      consent: 'By using our service, you agree to the analysis of your messages by AI and these privacy terms.'
    },
    ru: {
      title: 'Политика конфиденциальности',
      lastUpdated: 'Последнее обновление: 27 апреля 2026 г.',
      intro: 'В Ey Dost конфиденциальность и безопасность информации наших клиентов являются нашим приоритетом. В этом документе объясняется, как собираются и обрабатываются ваши данные.',
      sections: [
        {
          title: 'Кто мы',
          icon: Shield,
          text: 'Ey Dost — это платформа, предоставляющая глобальные пакеты eSIM и международные заказы такси через WhatsApp.'
        },
        {
          title: 'Анализ данных и ИИ',
          icon: Server,
          text: 'Для улучшения качества обслуживания, точного понимания ваших запросов и предложения наиболее подходящих пакетов сообщения, которые вы отправляете через WhatsApp, анализируются системами искусственного интеллекта (ИИ).'
        },
        {
          title: 'Собранные данные',
          icon: Eye,
          text: 'Мы собираем только данные, необходимые для выполнения заказа (страна назначения, выбранный пакет, контактный номер). Ваши личные сообщения обрабатываются только в служебных целях.'
        },
        {
          title: 'Безопасность и обмен данными',
          icon: Lock,
          text: 'Ваши данные не продаются третьим лицам в рекламных целях. Для завершения заказа платежным системам и поставщикам eSIM передаются только необходимые технические данные.'
        }
      ],
      consent: 'Используя наш сервис, вы соглашаетесь на анализ ваших сообщений ИИ и эти условия конфиденциальности.'
    }
  };

  const t = content[language as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen bg-white">
      <Seo title={t.title} canonicalPath="/privacy" />
      <Header />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">{t.title}</h1>
            <p className="text-gray-500 font-medium">{t.lastUpdated}</p>
          </div>

          <div className="bg-gray-50 rounded-3xl p-8 md:p-12 mb-12 border border-gray-100">
            <p className="text-lg text-gray-700 leading-relaxed italic">
              "{t.intro}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {t.sections.map((section, i) => (
              <div key={i} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 mb-6">
                  <section.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {section.text}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-cyan-600 rounded-3xl p-8 md:p-12 text-white text-center shadow-xl shadow-cyan-100">
            <h2 className="text-2xl font-bold mb-4">Razılıq</h2>
            <p className="text-cyan-50 opacity-90 leading-relaxed">
              {t.consent}
            </p>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
