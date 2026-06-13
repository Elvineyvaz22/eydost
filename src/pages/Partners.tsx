import { FormEvent, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  Copy,
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
import { useLanguage } from '../contexts/LanguageContext';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';
type PartnerLang = 'en' | 'az' | 'ru' | 'tr' | 'ar' | 'es' | 'zh';

const fallback = {
  en: {
    seoTitle: 'Affiliate and Partner Program',
    seoDescription: 'Join the Ey Dost partner program. Offer eSIM packages to your audience and track confirmed sales from your agent panel.',
    badge: 'Ey Dost Partner Program',
    heroTitle: 'Earn extra revenue from eSIM sales',
    heroText: 'Offer eSIM internet packages to your travel audience. Ey Dost provides a personal link, referral tracking, customer support, and an agent panel.',
    applyCta: 'Become a partner',
    agentLogin: 'Agent panel login',
    stats: ['150+ eSIM destinations', 'Personal referral link', 'Agent dashboard', '30-day referral memory'],
    heroNote: 'A simple partner flow for travel teams, creators, group leaders, and agencies that want to add eSIM sales to their existing customer journey.',
    howTitle: 'How your audience becomes revenue',
    howText: 'Travelers need reliable internet abroad. You refer the customer, Ey Dost handles the eSIM service, and confirmed sales are tracked in your panel.',
    trackTitle: 'How tracking works',
    trackText: 'The system uses the agent link and referral code together. If a customer comes through your link, the referral is remembered for the configured period.',
    modelTitle: 'Transparent tracking model',
    modelText: 'Only confirmed eSIM sales are counted. Sales, viewed packages, and reporting totals are shown in the agent dashboard.',
    panelCta: 'View agent panel',
    segmentsTitle: 'Who is it for?',
    segmentsText: 'Any team that sends customers abroad or owns a travel audience can offer eSIM packages as an extra service.',
    benefitsTitle: 'What partners receive',
    benefitsText: 'The goal is to reduce technical work for the agent: you bring the customer, the system handles tracking and eSIM service.',
    formTitle: 'Want to become a partner?',
    formText: 'Send the form and our team will contact you to activate the panel, code, and eSIM sales flow.',
    fullName: 'Full name',
    companyName: 'Company name',
    email: 'Email',
    whatsapp: 'WhatsApp',
    partnerType: 'Partner type',
    monthlyClients: 'Estimated monthly customers',
    message: 'Message',
    messagePlaceholder: 'Which destinations do your customers usually travel to?',
    monthlyPlaceholder: 'Example: 20-50',
    submit: 'Send application',
    success: 'Application sent. We will contact you soon.',
    error: 'Application was not sent. Please try again later.',
    faqTitle: 'Frequently asked questions',
    loadingError: 'Application was not sent',
    partnerTypes: ['Travel agency', 'Hajj / Umrah group', 'Education / visa company', 'Travel creator', 'Corporate travel', 'Other'],
    steps: [
      ['Register', 'Fill the form. Our team reviews your application and confirms the right partnership model.'],
      ['Offer eSIM', 'Share your personal link and referral code with customers, followers, or sales channels.'],
      ['Track sales', 'When an eSIM sale is confirmed, it appears in your agent panel and reporting.'],
    ],
    tracking: [
      'A customer arriving through an agent link is remembered for the referral period.',
      'The referral code can be included automatically in the WhatsApp flow.',
      'When payment is confirmed, the eSIM sale is shown in the agent panel.',
      'If the same order reference arrives again, the system updates the existing record.',
    ],
    segments: [
      ['Travel agencies', 'Offer eSIM internet packages as an extra service to customers traveling abroad.'],
      ['Group leaders', 'Solve internet connectivity in advance for Umrah, Hajj, education, and group trips.'],
      ['Education and visa companies', 'Offer students a ready internet option before their first day abroad.'],
      ['Corporate travel', 'Provide eSIM internet and WhatsApp support for employees on business trips.'],
    ],
    benefits: [
      ['Agent panel', 'Leads, confirmed eSIM sales, viewed packages, and totals are visible in one dashboard.'],
      ['Customer support', 'Ey Dost helps customers with eSIM activation, QR delivery, and package questions.'],
      ['Personal link', 'The agent link can be used in campaigns, social media, email, and WhatsApp sharing.'],
      ['Ready sales texts', 'Short presentation and sharing text can be prepared for agents.'],
      ['Transparent tracking', 'Sales are tracked with referral codes and payment confirmation.'],
      ['eSIM-only focus', 'The partner flow currently focuses on eSIM sales only.'],
    ],
    faqs: [
      ['How does the Ey Dost partner program work?', 'The agent receives a personal link and referral code. Confirmed eSIM sales are tracked in the agent panel.'],
      ['Who can join?', 'Travel agencies, creators, group leaders, visa and education companies, corporate travel teams, and partners with a travel audience can join.'],
      ['How are sales tracked?', 'The agent link is remembered in the browser. When the customer continues to WhatsApp and payment is confirmed, the sale is recorded in the agent panel.'],
      ['Is there a registration or monthly fee?', 'No. There is no setup fee or monthly payment to become a partner.'],
      ['Who supports the customer?', 'Ey Dost provides the main support for eSIM activation, QR, package selection, and usage questions.'],
      ['Is prohibited traffic allowed?', 'No. Fake clicks, bot traffic, spam, misleading ads, and unauthorized brand advertising are not accepted.'],
    ],
  },
  az: {
    seoTitle: 'Affiliate və Partner Proqramı',
    seoDescription: 'Ey Dost partner proqramına qoşulun. Auditoriyanıza eSIM paketləri təklif edin və təsdiqlənmiş satışları agent panelindən izləyin.',
    badge: 'Ey Dost Partner Proqramı',
    heroTitle: 'eSIM satışlarından əlavə gəlir qazanın',
    heroText: 'Səyahət auditoriyanıza eSIM internet paketləri təklif edin. Ey Dost sizə şəxsi link, referral izləmə, müştəri dəstəyi və agent paneli verir.',
    applyCta: 'Partner olmaq istəyirəm',
    agentLogin: 'Agent panelinə giriş',
    stats: ['150+ eSIM istiqaməti', 'Şəxsi referral link', 'Agent paneli', '30 gün referral yaddaşı'],
    heroNote: 'eSIM satışını mövcud müştəri axınına əlavə etmək istəyən tur komandaları, kontent yaradanlar, qrup rəhbərləri və agentliklər üçün sadə partner axını.',
    howTitle: 'Auditoriyanız necə gəlirə çevrilir?',
    howText: 'Səyahət edən müştərinin xaricdə etibarlı internetə ehtiyacı var. Siz müştərini yönləndirirsiniz, Ey Dost eSIM xidmətini idarə edir və təsdiqlənmiş satışlar panelinizdə görünür.',
    trackTitle: 'Satışlar necə izlənir?',
    trackText: 'Sistem agent linkini və referral kodunu birlikdə istifadə edir. Müştəri sizin linkdən gəlibsə, referral müəyyən müddət yadda saxlanılır.',
    modelTitle: 'Şəffaf izləmə modeli',
    modelText: 'Yalnız təsdiqlənmiş eSIM satışları hesablanır. Satışlar, baxılan paketlər və hesabat yekunları agent panelində görünür.',
    panelCta: 'Agent panelinə bax',
    segmentsTitle: 'Kimlər üçün uyğundur?',
    segmentsText: 'Xaricə müştəri göndərən və ya səyahət auditoriyası olan hər komanda eSIM paketlərini əlavə xidmət kimi təqdim edə bilər.',
    benefitsTitle: 'Partnerlərə nə veririk?',
    benefitsText: 'Məqsəd agentin texniki işini azaltmaqdır: siz müştərini gətirirsiniz, izləmə və eSIM xidmətini sistem idarə edir.',
    formTitle: 'Partner olmaq istəyirsiniz?',
    formText: 'Formu göndərin, komanda sizinlə əlaqə saxlayıb panel, kod və eSIM satış axınını aktivləşdirəcək.',
    fullName: 'Ad Soyad',
    companyName: 'Şirkət adı',
    email: 'Email',
    whatsapp: 'WhatsApp',
    partnerType: 'Partner tipi',
    monthlyClients: 'Aylıq təxmini müştəri sayı',
    message: 'Mesaj',
    messagePlaceholder: 'Müştəriləriniz əsasən hansı istiqamətlərə gedir?',
    monthlyPlaceholder: 'Məs: 20-50',
    submit: 'Müraciəti göndər',
    success: 'Müraciət göndərildi. Tezliklə sizinlə əlaqə saxlayacağıq.',
    error: 'Müraciət göndərilmədi. Bir az sonra yenidən yoxlayın.',
    faqTitle: 'Tez-tez verilən suallar',
    loadingError: 'Müraciət göndərilmədi',
    partnerTypes: ['Tur agentliyi', 'Həcc / Ümrə qrupu', 'Təhsil / viza şirkəti', 'Travel blogger', 'Korporativ travel', 'Digər'],
    steps: [
      ['Qeydiyyatdan keçin', 'Formu doldurun, komanda müraciətinizi yoxlayır və uyğun əməkdaşlıq modelini təsdiqləyir.'],
      ['eSIM təklif edin', 'Şəxsi linki və referral kodunu müştərilərinizə, izləyicilərinizə və satış kanallarınıza paylaşın.'],
      ['Satışları izləyin', 'eSIM satışı təsdiqlənəndə agent panelinizdə və hesabatda görünür.'],
    ],
    tracking: [
      'Agent linkindən gələn müştəri referral müddəti ərzində yadda saxlanılır.',
      'Referral kod WhatsApp axınına avtomatik əlavə oluna bilər.',
      'Ödəniş təsdiqlənəndə eSIM satışı agent panelində görünür.',
      'Eyni sifariş nömrəsi təkrar gəlsə, sistem mövcud qeydi yeniləyir.',
    ],
    segments: [
      ['Tur agentlikləri', 'Xaricə gedən müştərilərə eSIM internet paketlərini əlavə xidmət kimi təklif edin.'],
      ['Qrup rəhbərləri', 'Ümrə, Həcc, təhsil və qrup turlarında iştirakçıların internet bağlantısını əvvəlcədən həll edin.'],
      ['Təhsil və viza şirkətləri', 'Xaricə gedən tələbələrə ilk gündən hazır internet seçimi təqdim edin.'],
      ['Korporativ travel', 'Ezamiyyətə gedən əməkdaşlar üçün eSIM internet və WhatsApp dəstəyini təqdim edin.'],
    ],
    benefits: [
      ['Agent paneli', 'Leadlər, təsdiqlənmiş eSIM satışları, baxılan paketlər və yekunlar bir paneldə görünür.'],
      ['Müştəri dəstəyi', 'eSIM aktivasiya, QR göndərilməsi və paket seçimi suallarında Ey Dost komandası kömək edir.'],
      ['Şəxsi link', 'Agent linki kampaniya, sosial media, email və WhatsApp paylaşımı üçün istifadə oluna bilər.'],
      ['Hazır satış mətnləri', 'Agentlər üçün qısa təqdimat və paylaşım mətni hazırlamaq mümkündür.'],
      ['Şəffaf izləmə', 'Satışlar referral kod və ödəniş təsdiqi əsasında izlənir.'],
      ['Yalnız eSIM fokusu', 'Partner axını hazırda yalnız eSIM satışlarına fokuslanır.'],
    ],
    faqs: [
      ['Ey Dost partner proqramı necə işləyir?', 'Agentə şəxsi link və referral kod verilir. Təsdiqlənmiş eSIM satışları agent panelində izlənir.'],
      ['Kimlər qoşula bilər?', 'Tur agentlikləri, kontent yaradanlar, qrup rəhbərləri, viza və təhsil şirkətləri, korporativ travel komandaları və səyahət auditoriyası olan partnyorlar qoşula bilər.'],
      ['Satışlar necə izlənir?', 'Agent linki brauzerdə yadda saxlanılır. Müştəri WhatsApp-a keçib ödəniş etdikdən sonra satış agent panelində qeyd olunur.'],
      ['Qeydiyyat və aylıq ödəniş varmı?', 'Xeyr. Partner olmaq üçün setup fee və aylıq ödəniş yoxdur.'],
      ['Müştəri dəstəyini kim verir?', 'Müştəriyə eSIM aktivasiya, QR, paket seçimi və istifadə üzrə əsas dəstəyi Ey Dost komandası verir.'],
      ['Qadağan olunan trafik varmı?', 'Saxta klik, bot trafik, spam, aldadıcı reklam və brend adına icazəsiz reklam qəbul edilmir.'],
    ],
  },
} as const;

const extraCopies: Partial<Record<PartnerLang, typeof fallback.en>> = {
  tr: {
    ...fallback.en,
    seoTitle: 'Affiliate ve Partner Programı',
    badge: 'Ey Dost Partner Programı',
    heroTitle: 'eSIM satışlarından ek gelir kazanın',
    heroText: 'Seyahat kitlenize eSIM internet paketleri sunun. Ey Dost kişisel link, referral takibi, müşteri desteği ve agent paneli sağlar.',
    applyCta: 'Partner olmak istiyorum',
    agentLogin: 'Agent paneline giriş',
    formTitle: 'Partner olmak ister misiniz?',
    formText: 'Formu gönderin, ekibimiz panel, kod ve eSIM satış akışını etkinleştirmek için sizinle iletişime geçsin.',
    fullName: 'Ad Soyad',
    companyName: 'Şirket adı',
    whatsapp: 'WhatsApp',
    partnerType: 'Partner tipi',
    monthlyClients: 'Aylık tahmini müşteri sayısı',
    message: 'Mesaj',
    submit: 'Başvuruyu gönder',
    success: 'Başvuru gönderildi. Yakında sizinle iletişime geçeceğiz.',
    error: 'Başvuru gönderilemedi. Lütfen daha sonra tekrar deneyin.',
    faqTitle: 'Sık sorulan sorular',
    partnerTypes: ['Tur acentesi', 'Hac / Umre grubu', 'Eğitim / vize şirketi', 'Travel creator', 'Kurumsal travel', 'Diğer'],
    steps: [
      ['Kayıt olun', 'Formu doldurun. Ekibimiz başvurunuzu inceler ve uygun partner modelini onaylar.'],
      ['eSIM sunun', 'Kişisel linkinizi ve referral kodunuzu müşterileriniz, takipçileriniz veya satış kanallarınızla paylaşın.'],
      ['Satışları izleyin', 'eSIM satışı onaylandığında agent panelinizde ve raporlarda görünür.'],
    ],
    tracking: [
      'Agent linkinden gelen müşteri referral süresi boyunca hatırlanır.',
      'Referral kod WhatsApp akışına otomatik eklenebilir.',
      'Ödeme onaylandığında eSIM satışı agent panelinde görünür.',
      'Aynı sipariş referansı tekrar gelirse sistem mevcut kaydı günceller.',
    ],
    segments: [
      ['Tur acenteleri', 'Yurt dışına giden müşterilere eSIM internet paketlerini ek hizmet olarak sunun.'],
      ['Grup liderleri', 'Umre, Hac, eğitim ve grup seyahatlerinde internet bağlantısını önceden çözün.'],
      ['Eğitim ve vize şirketleri', 'Öğrencilere yurt dışındaki ilk günlerinden önce hazır internet seçeneği sunun.'],
      ['Kurumsal travel', 'İş seyahatindeki çalışanlar için eSIM internet ve WhatsApp desteği sağlayın.'],
    ],
    benefits: [
      ['Agent paneli', 'Leadler, onaylı eSIM satışları, görüntülenen paketler ve toplamlar tek panelde görünür.'],
      ['Müşteri desteği', 'Ey Dost eSIM aktivasyonu, QR teslimi ve paket sorularında müşterilere yardımcı olur.'],
      ['Kişisel link', 'Agent linki kampanya, sosyal medya, email ve WhatsApp paylaşımında kullanılabilir.'],
      ['Hazır satış metinleri', 'Agentler için kısa tanıtım ve paylaşım metinleri hazırlanabilir.'],
      ['Şeffaf takip', 'Satışlar referral kodları ve ödeme onayı ile takip edilir.'],
      ['Yalnız eSIM odağı', 'Partner akışı şu anda yalnız eSIM satışlarına odaklanır.'],
    ],
    faqs: [
      ['Ey Dost partner programı nasıl çalışır?', 'Agent kişisel link ve referral kod alır. Onaylı eSIM satışları agent panelinde takip edilir.'],
      ['Kimler katılabilir?', 'Tur acenteleri, içerik üreticileri, grup liderleri, vize ve eğitim şirketleri, kurumsal travel ekipleri ve seyahat kitlesi olan partnerler katılabilir.'],
      ['Satışlar nasıl takip edilir?', 'Agent linki tarayıcıda hatırlanır. Müşteri WhatsApp akışına geçip ödeme onaylandığında satış agent paneline kaydedilir.'],
      ['Kayıt veya aylık ücret var mı?', 'Hayır. Partner olmak için kurulum ücreti veya aylık ödeme yoktur.'],
      ['Müşteriye kim destek verir?', 'eSIM aktivasyonu, QR, paket seçimi ve kullanım soruları için ana desteği Ey Dost sağlar.'],
      ['Yasak trafik var mı?', 'Sahte tıklamalar, bot trafiği, spam, yanıltıcı reklamlar ve izinsiz marka reklamları kabul edilmez.'],
    ],
  },
  ru: {
    ...fallback.en,
    seoTitle: 'Партнерская программа',
    badge: 'Партнерская программа Ey Dost',
    heroTitle: 'Получайте дополнительный доход от продаж eSIM',
    heroText: 'Предлагайте eSIM-пакеты вашей туристической аудитории. Ey Dost предоставляет персональную ссылку, referral-трекинг, поддержку клиентов и панель агента.',
    applyCta: 'Стать партнером',
    agentLogin: 'Вход в панель агента',
    formTitle: 'Хотите стать партнером?',
    formText: 'Отправьте форму, и команда свяжется с вами для активации панели, кода и eSIM-продаж.',
    fullName: 'Имя и фамилия',
    companyName: 'Название компании',
    whatsapp: 'WhatsApp',
    partnerType: 'Тип партнера',
    monthlyClients: 'Примерное число клиентов в месяц',
    message: 'Сообщение',
    submit: 'Отправить заявку',
    success: 'Заявка отправлена. Мы скоро свяжемся с вами.',
    error: 'Заявка не отправлена. Попробуйте позже.',
    faqTitle: 'Частые вопросы',
    partnerTypes: ['Туристическое агентство', 'Группа Хадж / Умра', 'Образование / визы', 'Travel creator', 'Корпоративные поездки', 'Другое'],
    steps: [
      ['Зарегистрируйтесь', 'Заполните форму. Наша команда проверит заявку и подтвердит подходящую модель партнерства.'],
      ['Предлагайте eSIM', 'Делитесь персональной ссылкой и referral-кодом с клиентами, подписчиками или каналами продаж.'],
      ['Отслеживайте продажи', 'Когда продажа eSIM подтверждена, она появляется в панели агента и отчетах.'],
    ],
    tracking: [
      'Клиент, пришедший по ссылке агента, запоминается на referral-период.',
      'Referral-код может автоматически добавляться в WhatsApp-сценарий.',
      'После подтверждения оплаты продажа eSIM отображается в панели агента.',
      'Если тот же номер заказа приходит повторно, система обновляет существующую запись.',
    ],
    segments: [
      ['Туристические агентства', 'Предлагайте eSIM-пакеты как дополнительную услугу клиентам, которые едут за границу.'],
      ['Руководители групп', 'Заранее решайте вопрос интернета для Умры, Хаджа, учебных и групповых поездок.'],
      ['Образовательные и визовые компании', 'Предлагайте студентам готовый вариант интернета до первого дня за рубежом.'],
      ['Корпоративные поездки', 'Предоставляйте eSIM-интернет и WhatsApp-поддержку для сотрудников в командировках.'],
    ],
    benefits: [
      ['Панель агента', 'Лиды, подтвержденные eSIM-продажи, просмотренные пакеты и итоги видны в одной панели.'],
      ['Поддержка клиентов', 'Ey Dost помогает с активацией eSIM, доставкой QR и вопросами по пакетам.'],
      ['Персональная ссылка', 'Ссылку агента можно использовать в кампаниях, соцсетях, email и WhatsApp.'],
      ['Готовые тексты продаж', 'Для агентов можно подготовить короткие презентационные и рекламные тексты.'],
      ['Прозрачное отслеживание', 'Продажи отслеживаются по referral-коду и подтверждению оплаты.'],
      ['Фокус только на eSIM', 'Партнерский поток сейчас ориентирован только на eSIM-продажи.'],
    ],
    faqs: [
      ['Как работает партнерская программа Ey Dost?', 'Агент получает персональную ссылку и referral-код. Подтвержденные eSIM-продажи отслеживаются в панели агента.'],
      ['Кто может подключиться?', 'Турагентства, создатели контента, руководители групп, визовые и образовательные компании, корпоративные travel-команды и партнеры с туристической аудиторией.'],
      ['Как отслеживаются продажи?', 'Ссылка агента запоминается в браузере. Когда клиент переходит в WhatsApp и оплата подтверждается, продажа записывается в панели агента.'],
      ['Есть регистрационный или ежемесячный платеж?', 'Нет. Для участия нет setup fee и ежемесячной оплаты.'],
      ['Кто поддерживает клиента?', 'Основную поддержку по активации eSIM, QR, выбору пакета и использованию предоставляет Ey Dost.'],
      ['Запрещенный трафик разрешен?', 'Нет. Фейковые клики, bot-трафик, spam, вводящая в заблуждение реклама и несанкционированная реклама бренда не принимаются.'],
    ],
  },
  ar: {
    ...fallback.en,
    seoTitle: 'برنامج الشركاء',
    badge: 'برنامج شركاء Ey Dost',
    heroTitle: 'اكسب دخلا إضافيا من مبيعات eSIM',
    heroText: 'قدّم باقات eSIM لجمهور السفر لديك. توفر Ey Dost رابطا شخصيا، تتبع الإحالات، دعم العملاء ولوحة وكيل.',
    applyCta: 'أريد أن أصبح شريكا',
    agentLogin: 'دخول لوحة الوكيل',
    formTitle: 'هل تريد أن تصبح شريكا؟',
    formText: 'أرسل النموذج وسيتواصل معك فريقنا لتفعيل اللوحة والكود ومسار مبيعات eSIM.',
    fullName: 'الاسم الكامل',
    companyName: 'اسم الشركة',
    whatsapp: 'WhatsApp',
    partnerType: 'نوع الشريك',
    monthlyClients: 'عدد العملاء الشهري التقريبي',
    message: 'رسالة',
    submit: 'إرسال الطلب',
    success: 'تم إرسال الطلب. سنتواصل معك قريبا.',
    error: 'لم يتم إرسال الطلب. حاول لاحقا.',
    faqTitle: 'الأسئلة الشائعة',
    partnerTypes: ['وكالة سفر', 'مجموعة حج / عمرة', 'شركة تعليم / تأشيرات', 'صانع محتوى سفر', 'سفر شركات', 'أخرى'],
    steps: [
      ['سجّل', 'املأ النموذج. يراجع فريقنا الطلب ويؤكد نموذج الشراكة المناسب.'],
      ['قدّم eSIM', 'شارك رابطك الشخصي وكود الإحالة مع العملاء أو المتابعين أو قنوات البيع.'],
      ['تابع المبيعات', 'عند تأكيد بيع eSIM يظهر في لوحة الوكيل والتقارير.'],
    ],
    tracking: [
      'يتم تذكّر العميل القادم من رابط الوكيل خلال مدة الإحالة.',
      'يمكن إضافة كود الإحالة تلقائيا إلى مسار WhatsApp.',
      'عند تأكيد الدفع يظهر بيع eSIM في لوحة الوكيل.',
      'إذا وصل نفس مرجع الطلب مرة أخرى، يقوم النظام بتحديث السجل الحالي.',
    ],
    segments: [
      ['وكالات السفر', 'قدّم باقات إنترنت eSIM كخدمة إضافية للعملاء المسافرين للخارج.'],
      ['قادة المجموعات', 'حل اتصال الإنترنت مسبقا لرحلات العمرة والحج والتعليم والمجموعات.'],
      ['شركات التعليم والتأشيرات', 'قدّم للطلاب خيار إنترنت جاهزا قبل يومهم الأول في الخارج.'],
      ['سفر الشركات', 'وفّر إنترنت eSIM ودعم WhatsApp للموظفين في رحلات العمل.'],
    ],
    benefits: [
      ['لوحة الوكيل', 'تظهر العملاء المحتملون ومبيعات eSIM المؤكدة والباقات المشاهدة والإجماليات في لوحة واحدة.'],
      ['دعم العملاء', 'يساعد Ey Dost العملاء في تفعيل eSIM وتسليم QR وأسئلة الباقات.'],
      ['رابط شخصي', 'يمكن استخدام رابط الوكيل في الحملات ووسائل التواصل والبريد وWhatsApp.'],
      ['نصوص بيع جاهزة', 'يمكن تجهيز نصوص عرض ومشاركة قصيرة للوكلاء.'],
      ['تتبع شفاف', 'يتم تتبع المبيعات عبر أكواد الإحالة وتأكيد الدفع.'],
      ['تركيز eSIM فقط', 'مسار الشراكة يركز حاليا على مبيعات eSIM فقط.'],
    ],
    faqs: [
      ['كيف يعمل برنامج شركاء Ey Dost؟', 'يحصل الوكيل على رابط شخصي وكود إحالة. تتم متابعة مبيعات eSIM المؤكدة في لوحة الوكيل.'],
      ['من يمكنه الانضمام؟', 'يمكن لوكالات السفر وصناع المحتوى وقادة المجموعات وشركات التأشيرات والتعليم وفرق سفر الشركات وأصحاب جمهور السفر الانضمام.'],
      ['كيف يتم تتبع المبيعات؟', 'يتم حفظ رابط الوكيل في المتصفح. عندما ينتقل العميل إلى WhatsApp ويتم تأكيد الدفع، يتم تسجيل البيع في لوحة الوكيل.'],
      ['هل توجد رسوم تسجيل أو رسوم شهرية؟', 'لا. لا توجد رسوم إعداد أو دفع شهري للانضمام كشريك.'],
      ['من يدعم العميل؟', 'يوفر Ey Dost الدعم الأساسي لتفعيل eSIM وQR واختيار الباقة وأسئلة الاستخدام.'],
      ['هل يسمح بالزيارات المحظورة؟', 'لا. لا نقبل النقرات الوهمية أو زيارات البوت أو الرسائل المزعجة أو الإعلانات المضللة أو الإعلان غير المصرح به للعلامة.'],
    ],
  },
  es: {
    ...fallback.en,
    seoTitle: 'Programa de Afiliados y Partners',
    badge: 'Programa de Partners Ey Dost',
    heroTitle: 'Gana ingresos extra con ventas de eSIM',
    heroText: 'Ofrece paquetes eSIM a tu audiencia viajera. Ey Dost proporciona enlace personal, seguimiento de referidos, soporte al cliente y panel de agente.',
    applyCta: 'Quiero ser partner',
    agentLogin: 'Login del panel',
    formTitle: '¿Quieres ser partner?',
    formText: 'Envía el formulario y nuestro equipo te contactará para activar el panel, código y flujo de ventas eSIM.',
    fullName: 'Nombre completo',
    companyName: 'Empresa',
    whatsapp: 'WhatsApp',
    partnerType: 'Tipo de partner',
    monthlyClients: 'Clientes mensuales estimados',
    message: 'Mensaje',
    submit: 'Enviar solicitud',
    success: 'Solicitud enviada. Te contactaremos pronto.',
    error: 'No se pudo enviar la solicitud. Inténtalo más tarde.',
    faqTitle: 'Preguntas frecuentes',
    partnerTypes: ['Agencia de viajes', 'Grupo Hajj / Umrah', 'Educación / visas', 'Creador de viajes', 'Viajes corporativos', 'Otro'],
    steps: [
      ['Regístrate', 'Completa el formulario. Nuestro equipo revisa la solicitud y confirma el modelo de colaboración adecuado.'],
      ['Ofrece eSIM', 'Comparte tu enlace personal y código de referido con clientes, seguidores o canales de venta.'],
      ['Sigue las ventas', 'Cuando una venta de eSIM se confirma, aparece en el panel del agente y en los reportes.'],
    ],
    tracking: [
      'El cliente que llega por el enlace del agente se recuerda durante el periodo de referido.',
      'El código de referido puede añadirse automáticamente al flujo de WhatsApp.',
      'Cuando el pago se confirma, la venta eSIM aparece en el panel del agente.',
      'Si llega la misma referencia de pedido otra vez, el sistema actualiza el registro existente.',
    ],
    segments: [
      ['Agencias de viajes', 'Ofrece paquetes eSIM como servicio adicional a clientes que viajan al extranjero.'],
      ['Líderes de grupo', 'Resuelve la conectividad antes de viajes de Umrah, Hajj, educación y grupos.'],
      ['Empresas de educación y visas', 'Ofrece a estudiantes una opción de internet lista antes de su primer día fuera.'],
      ['Viajes corporativos', 'Proporciona internet eSIM y soporte por WhatsApp para empleados en viajes de negocio.'],
    ],
    benefits: [
      ['Panel del agente', 'Leads, ventas eSIM confirmadas, paquetes vistos y totales aparecen en un solo panel.'],
      ['Soporte al cliente', 'Ey Dost ayuda con activación eSIM, entrega de QR y preguntas sobre paquetes.'],
      ['Enlace personal', 'El enlace del agente puede usarse en campañas, redes sociales, email y WhatsApp.'],
      ['Textos listos para vender', 'Se pueden preparar textos cortos de presentación y publicación para agentes.'],
      ['Seguimiento transparente', 'Las ventas se siguen con códigos de referido y confirmación de pago.'],
      ['Solo eSIM', 'El flujo de partners se centra actualmente solo en ventas eSIM.'],
    ],
    faqs: [
      ['¿Cómo funciona el programa de partners de Ey Dost?', 'El agente recibe un enlace personal y código de referido. Las ventas eSIM confirmadas se siguen en el panel del agente.'],
      ['¿Quién puede unirse?', 'Agencias, creadores, líderes de grupo, empresas de visas y educación, equipos de viajes corporativos y partners con audiencia viajera.'],
      ['¿Cómo se siguen las ventas?', 'El enlace del agente se recuerda en el navegador. Cuando el cliente continúa a WhatsApp y el pago se confirma, la venta se registra en el panel.'],
      ['¿Hay cuota de registro o mensual?', 'No. No hay cuota de setup ni pago mensual para ser partner.'],
      ['¿Quién da soporte al cliente?', 'Ey Dost ofrece el soporte principal para activación eSIM, QR, selección de paquete y uso.'],
      ['¿Se permite tráfico prohibido?', 'No. No se aceptan clics falsos, tráfico bot, spam, anuncios engañosos ni publicidad de marca no autorizada.'],
    ],
  },
  zh: {
    ...fallback.en,
    seoTitle: '联盟与合作伙伴计划',
    badge: 'Ey Dost 合作伙伴计划',
    heroTitle: '通过 eSIM 销售获得额外收入',
    heroText: '向您的旅行用户推荐 eSIM 套餐。Ey Dost 提供个人链接、推荐跟踪、客户支持和代理面板。',
    applyCta: '成为合作伙伴',
    agentLogin: '代理面板登录',
    formTitle: '想成为合作伙伴吗？',
    formText: '提交表单后，我们会联系您开通面板、代码和 eSIM 销售流程。',
    fullName: '姓名',
    companyName: '公司名称',
    whatsapp: 'WhatsApp',
    partnerType: '合作伙伴类型',
    monthlyClients: '预计每月客户数',
    message: '留言',
    submit: '提交申请',
    success: '申请已发送。我们会尽快联系您。',
    error: '申请未发送。请稍后重试。',
    faqTitle: '常见问题',
    partnerTypes: ['旅行社', '朝觐 / 副朝团', '教育 / 签证公司', '旅行创作者', '企业差旅', '其他'],
    steps: [
      ['注册', '填写表单。我们的团队会审核申请并确认合适的合作模式。'],
      ['推荐 eSIM', '把个人链接和推荐代码分享给客户、粉丝或销售渠道。'],
      ['跟踪销售', 'eSIM 销售确认后，会显示在代理面板和报表中。'],
    ],
    tracking: [
      '通过代理链接进入的客户会在推荐周期内被记住。',
      '推荐代码可以自动加入 WhatsApp 流程。',
      '付款确认后，eSIM 销售会显示在代理面板中。',
      '如果同一个订单参考再次到达，系统会更新现有记录。',
    ],
    segments: [
      ['旅行社', '向出国客户提供 eSIM 网络套餐作为额外服务。'],
      ['团队负责人', '提前解决副朝、朝觐、教育和团队旅行的网络连接问题。'],
      ['教育和签证公司', '为学生出国第一天前提供可直接使用的网络选择。'],
      ['企业差旅', '为商务出行员工提供 eSIM 网络和 WhatsApp 支持。'],
    ],
    benefits: [
      ['代理面板', '线索、已确认 eSIM 销售、浏览过的套餐和总计都显示在一个面板中。'],
      ['客户支持', 'Ey Dost 帮助客户处理 eSIM 激活、QR 发送和套餐问题。'],
      ['个人链接', '代理链接可用于活动、社交媒体、邮件和 WhatsApp 分享。'],
      ['现成销售文案', '可为代理准备简短介绍和分享文案。'],
      ['透明跟踪', '销售通过推荐代码和付款确认进行跟踪。'],
      ['仅专注 eSIM', '合作流程目前只专注于 eSIM 销售。'],
    ],
    faqs: [
      ['Ey Dost 合作伙伴计划如何运作？', '代理会获得个人链接和推荐代码。已确认的 eSIM 销售会在代理面板中跟踪。'],
      ['谁可以加入？', '旅行社、内容创作者、团队负责人、签证和教育公司、企业差旅团队以及拥有旅行用户的合作伙伴都可以加入。'],
      ['销售如何跟踪？', '代理链接会保存在浏览器中。客户进入 WhatsApp 并确认付款后，销售会记录到代理面板。'],
      ['有注册费或月费吗？', '没有。成为合作伙伴没有设置费或月费。'],
      ['谁支持客户？', 'Ey Dost 提供 eSIM 激活、QR、套餐选择和使用问题的主要支持。'],
      ['允许违规流量吗？', '不允许。虚假点击、机器人流量、垃圾信息、误导广告和未经授权的品牌广告都不被接受。'],
    ],
  },
};

const copy = { ...fallback, ...extraCopies } as Record<PartnerLang, typeof fallback.en>;
const partnerTypeValues = ['agency', 'umrah', 'education', 'creator', 'corporate', 'other'];
const stepIcons = [ClipboardList, Megaphone, Wallet];
const segmentIcons = [Plane, Users, GraduationCap, Building2];
const benefitIcons = [BarChart3, Headphones, Link2, Copy, ShieldCheck, TrendingUp];

export default function Partners() {
  const { language } = useLanguage();
  const lang = (copy[language as PartnerLang] ? language : 'en') as PartnerLang;
  const t = copy[lang];
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
      setForm({ fullName: '', companyName: '', email: '', whatsapp: '', partnerType: 'agency', monthlyClients: '', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : t.loadingError);
    }
  };

  return (
    <div className="min-h-screen bg-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Seo title={t.seoTitle} description={t.seoDescription} canonicalPath="/partners" />
      <Header />

      <main className="pt-20">
        <section className="bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                <Handshake className="h-4 w-4" />
                {t.badge}
              </div>
              <h1 className="mb-6 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">{t.heroTitle}</h1>
              <p className="mb-8 max-w-2xl text-lg leading-relaxed text-slate-300">{t.heroText}</p>
              <div className="flex flex-wrap gap-3">
                <a href="#apply" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition-colors hover:bg-orange-600">
                  {t.applyCta} <ArrowRight className="h-4 w-4" />
                </a>
                <a href="/agent/login" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-950 transition-colors hover:bg-slate-100">
                  {t.agentLogin}
                </a>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 text-slate-900 shadow-2xl lg:p-8">
              <div className="mb-6 grid grid-cols-2 gap-4">
                {[Globe2, Link2, BarChart3, Smartphone].map((Icon, index) => (
                  <div key={t.stats[index]} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <Icon className="mb-3 h-5 w-5 text-orange-500" />
                    <div className="text-sm font-extrabold leading-snug">{t.stats[index]}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
                <p className="text-sm font-semibold leading-relaxed text-orange-900">{t.heroNote}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-3xl">
              <h2 className="mb-3 text-3xl font-extrabold text-slate-900">{t.howTitle}</h2>
              <p className="leading-relaxed text-slate-600">{t.howText}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {t.steps.map(([title, text], index) => {
                const Icon = stepIcons[index];
                return (
                  <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                    <Icon className="mb-4 h-9 w-9 text-blue-600" />
                    <h3 className="mb-2 font-extrabold text-slate-900">{title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto grid max-w-7xl items-start gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div>
              <h2 className="mb-4 text-3xl font-extrabold text-slate-900">{t.trackTitle}</h2>
              <p className="mb-6 leading-relaxed text-slate-600">{t.trackText}</p>
              <div className="space-y-3">
                {t.tracking.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    <p className="text-sm font-semibold text-slate-800">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-6 text-white lg:p-8">
              <BadgeCheck className="mb-5 h-9 w-9 text-orange-400" />
              <h3 className="mb-3 text-2xl font-extrabold">{t.modelTitle}</h3>
              <p className="mb-6 leading-relaxed text-slate-300">{t.modelText}</p>
              <a href="/agent/login" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-slate-950">
                {t.panelCta} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl">
              <h2 className="mb-3 text-3xl font-extrabold text-slate-900">{t.segmentsTitle}</h2>
              <p className="text-slate-600">{t.segmentsText}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {t.segments.map(([title, text], index) => {
                const Icon = segmentIcons[index];
                return (
                  <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                    <Icon className="mb-4 h-8 w-8 text-blue-600" />
                    <h3 className="mb-2 font-extrabold text-slate-900">{title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-2xl">
              <h2 className="mb-3 text-3xl font-extrabold text-slate-900">{t.benefitsTitle}</h2>
              <p className="text-slate-600">{t.benefitsText}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {t.benefits.map(([title, text], index) => {
                const Icon = benefitIcons[index];
                return (
                  <div key={title} className="rounded-2xl border border-slate-100 bg-white p-6">
                    <Icon className="mb-4 h-8 w-8 text-orange-500" />
                    <h3 className="mb-2 font-extrabold text-slate-900">{title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="apply" className="bg-white py-16">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <h2 className="mb-4 text-3xl font-extrabold text-slate-900">{t.formTitle}</h2>
              <p className="mb-6 leading-relaxed text-slate-600">{t.formText}</p>
            </div>

            <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{t.fullName}</span>
                  <input required value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{t.companyName}</span>
                  <input required value={form.companyName} onChange={(e) => update('companyName', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{t.email}</span>
                  <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{t.whatsapp}</span>
                  <input value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="+994..." className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{t.partnerType}</span>
                  <select value={form.partnerType} onChange={(e) => update('partnerType', e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100">
                    {partnerTypeValues.map((value, index) => (
                      <option key={value} value={value}>{t.partnerTypes[index]}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">{t.monthlyClients}</span>
                  <input value={form.monthlyClients} onChange={(e) => update('monthlyClients', e.target.value)} placeholder={t.monthlyPlaceholder} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">{t.message}</span>
                <textarea rows={4} value={form.message} onChange={(e) => update('message', e.target.value)} placeholder={t.messagePlaceholder} className="mt-2 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
              </label>

              {status === 'success' && <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">{t.success}</div>}
              {status === 'error' && <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{errorMessage || t.error}</div>}

              <button type="submit" disabled={status === 'submitting'} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-3.5 font-bold text-white transition-colors hover:bg-orange-700 disabled:opacity-60">
                {status === 'submitting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t.submit}
              </button>
            </form>
          </div>
        </section>

        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-10 text-center text-3xl font-extrabold text-slate-900">{t.faqTitle}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {t.faqs.map(([q, a]) => (
                <div key={q} className="rounded-2xl border border-slate-100 bg-white p-5">
                  <h3 className="mb-2 font-extrabold text-slate-900">{q}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{a}</p>
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
