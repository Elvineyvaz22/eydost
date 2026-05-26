import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import Seo from '../components/Seo';
import { useLanguage } from '../contexts/LanguageContext';

const LAST_UPDATED = 'May 8, 2026';
const COMPANY = 'NURTEL ELEKTRİK MMC';
const EMAIL = 'info@eydost.com';

type Section = { title: string; body: string[]; list?: string[] };

const content: Record<'en' | 'az' | 'ru', {
  title: string;
  updated: string;
  sections: Section[];
}> = {
  en: {
    title: 'Terms of Service',
    updated: `Last updated: ${LAST_UPDATED}`,
    sections: [
      {
        title: '1. Agreement',
        body: [
          `By accessing or using Ey Dost services (including eydost.com and our WhatsApp channel), you agree to be bound by these Terms of Service. These terms are provided by ${COMPANY}, the operator of Ey Dost. If you do not agree, please discontinue use immediately.`,
        ],
      },
      {
        title: '2. Services',
        body: ['Ey Dost provides:'],
        list: [
          'eSIM data packages — digital mobile data plans for 150+ countries, delivered via WhatsApp as a QR code.',
          'Taxi booking — ride facilitation service in 850+ cities across 50+ countries, coordinated through WhatsApp with third-party local fleet partners.',
        ],
      },
      {
        title: '3. eSIM Terms',
        body: [],
        list: [
          'eSIM plans are data-only and do not include a phone number.',
          'Validity periods begin upon first network connection in the destination country.',
          'Device compatibility is the customer\'s responsibility. Most modern smartphones (iPhone XS+, Samsung S20+, Pixel 3+) support eSIM.',
          'QR codes are personal and must not be shared or resold.',
          'Data speeds may vary based on local network conditions.',
        ],
      },
      {
        title: '4. Taxi Booking Terms',
        body: [],
        list: [
          'Ey Dost acts as an intermediary connecting customers with independent local taxi operators.',
          'Prices shown are estimates. Final fare may vary due to traffic, tolls, or airport fees.',
          'Ey Dost is not liable for driver conduct, vehicle condition, or delays caused by third-party operators.',
          'Taxi service is currently available in 850+ cities across 50+ countries. Availability may vary by location.',
          'For safety, driver details (name, vehicle, plate) are provided via WhatsApp upon booking confirmation.',
        ],
      },
      {
        title: '5. Payments',
        body: [
          'Payment links are sent via WhatsApp. By completing payment, you confirm acceptance of these terms. Prices are listed in USD unless otherwise stated. All transactions are processed through secure third-party payment providers.',
        ],
      },
      {
        title: '6. Prohibited Use',
        body: ['You may not use Ey Dost services to:'],
        list: [
          'Resell or redistribute eSIM QR codes.',
          'Abuse, harass, or threaten our support team.',
          'Use services for unlawful purposes.',
        ],
      },
      {
        title: '7. Limitation of Liability',
        body: [
          `To the maximum extent permitted by law, ${COMPANY} shall not be liable for any indirect, incidental, or consequential damages arising from use of our services, including but not limited to network outages, third-party driver actions, or device incompatibility.`,
        ],
      },
      {
        title: '8. Governing Law',
        body: [
          'These terms are governed by the laws of the Republic of Azerbaijan. Any disputes shall be resolved in the courts of Sumqayıt, Azerbaijan.',
        ],
      },
      {
        title: '9. Contact',
        body: [`For any questions regarding these Terms, contact us at: ${EMAIL}`],
      },
    ],
  },
  az: {
    title: 'İstifadə Şərtləri',
    updated: `Son yenilənmə: ${LAST_UPDATED}`,
    sections: [
      {
        title: '1. Razılaşma',
        body: [
          `Ey Dost xidmətlərindən (eydost.com və WhatsApp kanalımız daxil olmaqla) istifadə etməklə bu İstifadə Şərtlərinə razı olursunuz. Bu şərtlər Ey Dost-un operatoru olan ${COMPANY} tərəfindən təqdim olunur. Razı deyilsinizsə, istifadəni dərhal dayandırın.`,
        ],
      },
      {
        title: '2. Xidmətlər',
        body: ['Ey Dost aşağıdakı xidmətləri təqdim edir:'],
        list: [
          'eSIM internet paketləri — 150+ ölkədə WhatsApp-da QR kod kimi çatdırılan rəqəmsal mobil internet paketləri.',
          'Taksi sifarişi — 50+ ölkədə və 850+ şəhərdə yerli sürücü tərəfdaşları ilə WhatsApp üzərindən əlaqələndirilən sürət xidməti.',
        ],
      },
      {
        title: '3. eSIM Şərtləri',
        body: [],
        list: [
          'eSIM paketləri yalnız mobil internet üçündür və telefon nömrəsi daxil deyil.',
          'Müddət, eSIM gedilən ölkədə şəbəkəyə qoşulan andan başlayır.',
          'Cihazın uyğunluğu müştərinin məsuliyyətindədir. Müasir smartfonların əksəriyyəti (iPhone XS+, Samsung S20+, Pixel 3+) eSIM-i dəstəkləyir.',
          'QR kodlar şəxsidir, paylaşılmamalı və ya yenidən satılmamalıdır.',
          'İnternet sürəti yerli şəbəkə şərtlərinə görə dəyişə bilər.',
        ],
      },
      {
        title: '4. Taksi Sifariş Şərtləri',
        body: [],
        list: [
          'Ey Dost müştəriləri müstəqil yerli taksi operatorları ilə birləşdirən vasitəçi rolunu oynayır.',
          'Göstərilən qiymətlər təxminidir. Yekun qiymət tıxac, yol və ya aeroport rüsumuna görə dəyişə bilər.',
          'Ey Dost üçüncü tərəf operatorlarının səbəb olduğu sürücü davranışı, avtomobil vəziyyəti və ya gecikmələrə görə məsuliyyət daşımır.',
          'Taksi xidməti hazırda 50+ ölkə və 850+ şəhərdə mövcuddur. Əlçatanlıq yerə görə dəyişə bilər.',
          'Təhlükəsizlik üçün sürücü məlumatları (ad, avtomobil, nömrə) sifariş təsdiqlənən kimi WhatsApp-da göndərilir.',
        ],
      },
      {
        title: '5. Ödənişlər',
        body: [
          'Ödəniş linkləri WhatsApp-da göndərilir. Ödənişi tamamlamaqla bu şərtləri qəbul etdiyinizi təsdiqləyirsiniz. Qiymətlər ayrıca qeyd olunmadıqca USD ilə göstərilir. Bütün əməliyyatlar təhlükəsiz üçüncü tərəf ödəniş provayderləri vasitəsilə işlənilir.',
        ],
      },
      {
        title: '6. Qadağan olunmuş istifadə',
        body: ['Ey Dost xidmətlərindən aşağıdakılar üçün istifadə edə bilməzsiniz:'],
        list: [
          'eSIM QR kodlarını satmaq və ya paylaşmaq.',
          'Dəstək komandamıza qarşı təhqir, təhdid və ya təzyiq.',
          'Xidmətləri qanunsuz məqsədlər üçün istifadə etmək.',
        ],
      },
      {
        title: '7. Məsuliyyət məhdudiyyəti',
        body: [
          `Qanunla icazə verilən maksimum həddə, ${COMPANY} xidmətlərimizin istifadəsindən yaranan dolayı, təsadüfi və ya nəticə zərərinə görə (şəbəkə kəsilmələri, üçüncü tərəf sürücü hərəkətləri, cihaz uyğunsuzluğu daxil) məsuliyyət daşımır.`,
        ],
      },
      {
        title: '8. Hüquqi tənzimləmə',
        body: [
          'Bu şərtlər Azərbaycan Respublikasının qanunları ilə tənzimlənir. Bütün mübahisələr Sumqayıt, Azərbaycan məhkəmələrində həll edilir.',
        ],
      },
      {
        title: '9. Əlaqə',
        body: [`Bu şərtlərlə bağlı suallar üçün bizimlə əlaqə saxlayın: ${EMAIL}`],
      },
    ],
  },
  ru: {
    title: 'Условия использования',
    updated: `Последнее обновление: ${LAST_UPDATED}`,
    sections: [
      {
        title: '1. Соглашение',
        body: [
          `Используя сервисы Ey Dost (включая eydost.com и наш канал WhatsApp), вы соглашаетесь с настоящими Условиями использования. Эти условия предоставлены ${COMPANY}, оператором Ey Dost. Если вы не согласны, прекратите использование сервиса.`,
        ],
      },
      {
        title: '2. Услуги',
        body: ['Ey Dost предоставляет:'],
        list: [
          'Пакеты данных eSIM — цифровые тарифы мобильного интернета для 150+ стран, доставляемые через WhatsApp в виде QR-кода.',
          'Заказ такси — услуга подбора поездок в 850+ городах в 50+ странах, координируемая через WhatsApp с местными партнёрами.',
        ],
      },
      {
        title: '3. Условия eSIM',
        body: [],
        list: [
          'Пакеты eSIM только для данных и не включают телефонный номер.',
          'Срок действия начинается с первого подключения eSIM к сети в стране назначения.',
          'Совместимость устройства — ответственность клиента. Большинство современных смартфонов (iPhone XS+, Samsung S20+, Pixel 3+) поддерживают eSIM.',
          'QR-коды являются персональными и не должны передаваться или перепродаваться.',
          'Скорость передачи данных может варьироваться в зависимости от условий местной сети.',
        ],
      },
      {
        title: '4. Условия заказа такси',
        body: [],
        list: [
          'Ey Dost выступает посредником, связывающим клиентов с независимыми местными операторами такси.',
          'Указанные цены являются ориентировочными. Финальная стоимость может меняться из-за пробок, дорожных или аэропортовых сборов.',
          'Ey Dost не несёт ответственности за поведение водителя, состояние автомобиля или задержки, вызванные третьими сторонами.',
          'Услуга такси доступна в 850+ городах в 50+ странах. Доступность может различаться по локации.',
          'Для безопасности данные водителя (имя, машина, номер) отправляются в WhatsApp после подтверждения заказа.',
        ],
      },
      {
        title: '5. Оплата',
        body: [
          'Ссылки для оплаты отправляются через WhatsApp. Завершая оплату, вы подтверждаете согласие с условиями. Цены указаны в USD, если не указано иное. Все транзакции обрабатываются через защищённых сторонних провайдеров.',
        ],
      },
      {
        title: '6. Запрещённое использование',
        body: ['Вы не можете использовать сервисы Ey Dost для:'],
        list: [
          'Перепродажи или распространения QR-кодов eSIM.',
          'Оскорблений, преследования или угроз нашей службе поддержки.',
          'Использования сервисов в незаконных целях.',
        ],
      },
      {
        title: '7. Ограничение ответственности',
        body: [
          `В максимальной степени, разрешённой законом, ${COMPANY} не несёт ответственности за любые косвенные, случайные или последующие убытки, возникшие в результате использования наших сервисов, включая, но не ограничиваясь сбоями сети, действиями сторонних водителей или несовместимостью устройств.`,
        ],
      },
      {
        title: '8. Применимое право',
        body: [
          'Настоящие условия регулируются законами Азербайджанской Республики. Все споры разрешаются в судах города Сумгайыт, Азербайджан.',
        ],
      },
      {
        title: '9. Контакты',
        body: [`По всем вопросам, связанным с настоящими Условиями, обращайтесь: ${EMAIL}`],
      },
    ],
  },
};

export default function Terms() {
  const { language } = useLanguage();
  const lang: 'en' | 'az' | 'ru' = language === 'az' || language === 'ru' ? language : 'en';
  const c = content[lang];

  return (
    <div className="min-h-screen bg-white">
      <Seo title={c.title} description="Ey Dost Terms of Service — eSIM and taxi booking conditions." canonicalPath="/terms" noIndex={false} />
      <Header />
      <main className="pt-24 pb-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{c.title}</h1>
        <p className="text-sm text-gray-400 mb-10">{c.updated}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">
          {c.sections.map((section, idx) => (
            <section key={idx}>
              <h2 className="text-lg font-bold text-gray-900 mb-3">{section.title}</h2>
              {section.body.map((paragraph, pIdx) => (
                <p key={pIdx} className={pIdx > 0 ? 'mt-2' : ''}>
                  {paragraph.includes(EMAIL) ? (
                    <>
                      {paragraph.split(EMAIL)[0]}
                      <a href={`mailto:${EMAIL}`} className="text-blue-600 hover:underline">{EMAIL}</a>
                      {paragraph.split(EMAIL)[1]}
                    </>
                  ) : (
                    paragraph
                  )}
                </p>
              ))}
              {section.list && (
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  {section.list.map((item, lIdx) => (
                    <li key={lIdx}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
