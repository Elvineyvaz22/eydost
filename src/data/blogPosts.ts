import type { AppLanguage } from '../utils/languagePreference';
import { globalEsimDataPlanPost } from './blogPostGlobalEsimPlan';
import type { BlogPost, BlogContent } from './blogTypes';
import { BLOG_CATEGORY_IMAGES } from './blogTypes';
import { BLOG_POST_IMAGES } from './blogPostImages';

export type { BlogPost, BlogContent, BlogSection } from './blogTypes';
export { BLOG_CATEGORY_IMAGES } from './blogTypes';

export function getBlogImage(post: BlogPost): string {
  return post.image ?? BLOG_POST_IMAGES[post.slug] ?? BLOG_CATEGORY_IMAGES[post.category];
}

export function getBlogContent(post: BlogPost, language: AppLanguage): BlogContent {
  const byLang: Partial<Record<AppLanguage, BlogContent | undefined>> = {
    en: post.en,
    az: post.az,
    ru: post.ru,
    tr: post.tr,
    ar: post.ar,
    es: post.es,
    zh: post.zh,
  };
  return byLang[language] ?? post.en;
}

export const blogPosts: BlogPost[] = [
  globalEsimDataPlanPost,
  {
    slug: 'what-is-esim-complete-guide',
    category: 'esim',
    publishedAt: '2026-05-01',
    readingMinutes: 5,
    en: {
      title: 'What is an eSIM? The Complete Guide for Travelers',
      description: 'Learn everything about eSIM technology — what it is, how it works, which phones support it, and how to activate one for international travel in minutes.',
      sections: [
        {
          heading: 'What is an eSIM?',
          body: 'An eSIM (embedded SIM) is a digital SIM card built directly into your phone. Unlike a physical SIM card that you insert and remove, an eSIM is activated by scanning a QR code — no physical card required.',
        },
        {
          heading: 'How does an eSIM work?',
          body: 'When you purchase an eSIM data plan, you receive a QR code (usually via WhatsApp or email). You scan this code with your phone\'s camera through the eSIM settings, and your phone downloads the carrier profile. Internet connectivity is usually active within 30 seconds.',
        },
        {
          heading: 'Which phones support eSIM?',
          body: 'Most modern smartphones support eSIM. Here are the most popular compatible devices:',
          list: [
            'iPhone XS and all newer iPhone models',
            'Samsung Galaxy S20, S21, S22, S23, S24 and newer',
            'Google Pixel 3 and all newer Pixel models',
            'iPad Pro (2018 and newer)',
            'Most flagship Android phones from 2020 onward',
          ],
        },
        {
          heading: 'eSIM vs Physical SIM — which is better for travel?',
          body: 'For international travelers, eSIM wins in almost every way:',
          list: [
            'No queuing at airport SIM counters',
            'Activate before you even land',
            'Keep your home SIM in the phone simultaneously (dual SIM)',
            'No risk of losing a tiny physical card',
            'Instant top-up without visiting a store',
          ],
        },
        {
          heading: 'How to get an eSIM with Ey Dost',
          body: 'Getting an eSIM through Ey Dost takes under 2 minutes. Simply message us on WhatsApp, tell us your destination country, choose a data plan, and pay via the secure link we send. Your QR code arrives instantly. No ID required, no app to download.',
        },
      ],
    },
    az: {
      title: 'eSIM nədir? Səyahətçilər üçün tam bələdçi',
      description: 'eSIM texnologiyası haqqında hər şeyi öyrənin — nədir, necə işləyir, hansı telefonlar dəstəkləyir və beynəlxalq səfər üçün necə aktivləşdirilir.',
      sections: [
        {
          heading: 'eSIM nədir?',
          body: 'eSIM (embedded SIM — yerləşdirilmiş SIM) telefonunuzun içinə birbaşa quraşdırılmış rəqəmsal SIM kartdır. Fiziki SIM kartdan fərqli olaraq, eSIM QR kodu skan etməklə aktivləşdirilir — fiziki kart lazım deyil.',
        },
        {
          heading: 'eSIM necə işləyir?',
          body: 'eSIM data planı aldıqda, QR kodu alırsınız (adətən WhatsApp və ya e-poçtla). Bu kodu telefon kameranızla eSIM parametrləri vasitəsilə skan edirsiniz və telefonunuz operator profilini yükləyir. İnternet bağlantısı adətən 30 saniyə ərzində aktiv olur.',
        },
        {
          heading: 'Hansı telefonlar eSIM dəstəkləyir?',
          body: 'Müasir smartfonların əksəriyyəti eSIM dəstəkləyir. Ən populyar uyğun cihazlar:',
          list: [
            'iPhone XS və bütün yeni iPhone modelləri',
            'Samsung Galaxy S20, S21, S22, S23, S24 və yenisi',
            'Google Pixel 3 və bütün yeni Pixel modelləri',
            'iPad Pro (2018 və yenisi)',
            '2020-dən etibarən əksər flagman Android telefonlar',
          ],
        },
        {
          heading: 'eSIM vs Fiziki SIM — səfər üçün hansı daha yaxşıdır?',
          body: 'Beynəlxalq səyahətçilər üçün eSIM demək olar ki, hər cəhətdən üstündür:',
          list: [
            'Hava limanında SIM sayğacında növbə yoxdur',
            'Hələ enmədən əvvəl aktivləşdir',
            'Eyni zamanda ev SIM-inizi telefonda saxlayın (dual SIM)',
            'Kiçik fiziki kartı itirmə riski yoxdur',
            'Mağazaya getmədən ani doldurma',
          ],
        },
        {
          heading: 'Ey Dost ilə eSIM necə alınır',
          body: 'Ey Dost vasitəsilə eSIM almaq 2 dəqiqədən az vaxt aparır. Sadəcə WhatsApp-da yazın, gedəcəyiniz ölkəni söyləyin, data planı seçin və göndərdiyimiz təhlükəsiz link vasitəsilə ödəyin. QR kodunuz dərhal gəlir. ID tələb olunmur, proqram yükləmə yoxdur.',
        },
      ],
    },
    ru: {
      title: 'Что такое eSIM? Полное руководство для путешественников',
      description: 'Узнайте всё об eSIM — что это такое, как работает, какие телефоны поддерживают и как активировать за минуты для международных поездок.',
      sections: [
        {
          heading: 'Что такое eSIM?',
          body: 'eSIM (встроенная SIM-карта) — это цифровая SIM-карта, встроенная непосредственно в ваш телефон. В отличие от физической SIM-карты, eSIM активируется сканированием QR-кода — никакой физической карты не нужно.',
        },
        {
          heading: 'Как работает eSIM?',
          body: 'При покупке тарифного плана eSIM вы получаете QR-код (обычно через WhatsApp или email). Вы сканируете этот код камерой телефона через настройки eSIM, и телефон загружает профиль оператора. Подключение к интернету обычно активируется в течение 30 секунд.',
        },
        {
          heading: 'Какие телефоны поддерживают eSIM?',
          body: 'Большинство современных смартфонов поддерживают eSIM. Наиболее популярные совместимые устройства:',
          list: [
            'iPhone XS и все новые модели iPhone',
            'Samsung Galaxy S20, S21, S22, S23, S24 и новее',
            'Google Pixel 3 и все новые модели Pixel',
            'iPad Pro (2018 и новее)',
            'Большинство флагманских Android-смартфонов с 2020 года',
          ],
        },
        {
          heading: 'eSIM vs физическая SIM — что лучше для путешествий?',
          body: 'Для международных путешественников eSIM побеждает практически во всём:',
          list: [
            'Не нужно стоять в очереди за SIM-картой в аэропорту',
            'Активируйте до посадки',
            'Оставьте домашнюю SIM в телефоне одновременно (dual SIM)',
            'Нет риска потерять крошечную физическую карту',
            'Мгновенное пополнение без похода в магазин',
          ],
        },
        {
          heading: 'Как получить eSIM через Ey Dost',
          body: 'Получить eSIM через Ey Dost занимает менее 2 минут. Просто напишите нам в WhatsApp, укажите страну назначения, выберите тарифный план и оплатите по безопасной ссылке. QR-код придёт мгновенно. Никакого ID, никаких загрузок.',
        },
      ],
    },
  },
  {
    slug: 'how-to-install-esim-iphone',
    category: 'esim',
    publishedAt: '2026-05-02',
    readingMinutes: 4,
    en: {
      title: 'How to Install an eSIM on iPhone (Step-by-Step Guide)',
      description: 'A simple step-by-step guide to installing and activating an eSIM on any iPhone model that supports it — iPhone XS and newer.',
      sections: [
        {
          heading: 'Before you start',
          body: 'Make sure your iPhone supports eSIM (iPhone XS or newer) and that it is unlocked (not carrier-locked). Also ensure you have your eSIM QR code ready — Ey Dost sends this via WhatsApp.',
        },
        {
          heading: 'Step 1: Open Settings',
          body: 'Go to Settings → Mobile Data (or Cellular in some regions) → Add eSIM.',
        },
        {
          heading: 'Step 2: Scan the QR Code',
          body: 'Tap "Use QR Code" and point your camera at the QR code we sent you on WhatsApp. Your iPhone will automatically scan it.',
        },
        {
          heading: 'Step 3: Confirm and activate',
          body: 'Tap "Continue" on the confirmation screen. Your iPhone will download the carrier profile. This takes about 10-30 seconds.',
        },
        {
          heading: 'Step 4: Set data preferences',
          body: 'Go to Settings → Mobile Data → and select your new eSIM as the "Mobile Data" source. Enable "Data Roaming" for the eSIM if travelling internationally.',
          list: [
            'Settings → Mobile Data → Mobile Data (select eSIM)',
            'Enable Data Roaming for the eSIM line',
            'Keep your home SIM active for calls/SMS',
          ],
        },
        {
          heading: 'Troubleshooting',
          body: 'If the eSIM doesn\'t connect immediately:',
          list: [
            'Restart your iPhone after installing',
            'Make sure Data Roaming is ON for the eSIM',
            'Check that you\'re in an area with network coverage',
            'Contact Ey Dost support on WhatsApp — we\'re available 24/7',
          ],
        },
      ],
    },
    az: {
      title: 'iPhone-da eSIM necə quraşdırılır (Addım-addım bələdçi)',
      description: 'eSIM dəstəkləyən istənilən iPhone modelində (iPhone XS və yenisi) eSIM quraşdırma və aktivləşdirməyə dair sadə addım-addım bələdçi.',
      sections: [
        {
          heading: 'Başlamazdan əvvəl',
          body: 'iPhone-unuzun eSIM dəstəklədiyindən əmin olun (iPhone XS və ya yenisi) və operator kilidinin açıq olduğunu yoxlayın. Həmçinin eSIM QR kodunuzun hazır olduğundan əmin olun — Ey Dost bunu WhatsApp vasitəsilə göndərir.',
        },
        {
          heading: 'Addım 1: Parametrlərə keçin',
          body: 'Parametrlər → Mobil Data → eSIM Əlavə Et seçin.',
        },
        {
          heading: 'Addım 2: QR Kodu Skan Edin',
          body: '"QR Koddan İstifadə Et"ə toxunun və kameranı WhatsApp-da göndərilən QR koduna tuşlayın. iPhone avtomatik skan edəcək.',
        },
        {
          heading: 'Addım 3: Təsdiqləyin və aktivləşdirin',
          body: 'Təsdiq ekranında "Davam Et"ə toxunun. iPhone operator profilini yükləyəcək. Bu 10-30 saniyə çəkir.',
        },
        {
          heading: 'Addım 4: Data parametrlərini tənzimləyin',
          body: 'Parametrlər → Mobil Data → yeni eSIM-i "Mobil Data" mənbəyi kimi seçin. Beynəlxalq səfər üçün eSIM-də "Data Roaming"-i aktivləşdirin.',
          list: [
            'Parametrlər → Mobil Data → Mobil Data (eSIM seçin)',
            'eSIM xətti üçün Data Roaming-i aktivləşdirin',
            'Ev SIM-inizi zənglər/SMS üçün aktiv saxlayın',
          ],
        },
        {
          heading: 'Problem həlli',
          body: 'eSIM dərhal qoşulmursa:',
          list: [
            'Quraşdırmadan sonra iPhone-u yenidən başladın',
            'eSIM üçün Data Roaming-in AÇıq olduğunu yoxlayın',
            'Şəbəkə əhatəsi olan ərazidə olduğunuzu yoxlayın',
            'WhatsApp-da Ey Dost dəstəyi ilə əlaqə saxlayın — 24/7 mövcuduq',
          ],
        },
      ],
    },
    ru: {
      title: 'Как установить eSIM на iPhone (пошаговая инструкция)',
      description: 'Простая пошаговая инструкция по установке и активации eSIM на любом iPhone, поддерживающем eSIM — iPhone XS и новее.',
      sections: [
        {
          heading: 'Перед началом',
          body: 'Убедитесь, что ваш iPhone поддерживает eSIM (iPhone XS или новее) и что он разблокирован (не привязан к оператору). Также убедитесь, что QR-код eSIM готов — Ey Dost отправляет его через WhatsApp.',
        },
        {
          heading: 'Шаг 1: Откройте Настройки',
          body: 'Настройки → Сотовая связь → Добавить eSIM.',
        },
        {
          heading: 'Шаг 2: Сканируйте QR-код',
          body: 'Нажмите "Использовать QR-код" и наведите камеру на QR-код, присланный нами в WhatsApp. iPhone отсканирует его автоматически.',
        },
        {
          heading: 'Шаг 3: Подтвердите и активируйте',
          body: 'Нажмите "Продолжить" на экране подтверждения. iPhone загрузит профиль оператора. Это займёт около 10-30 секунд.',
        },
        {
          heading: 'Шаг 4: Настройте параметры данных',
          body: 'Настройки → Сотовая связь → выберите новый eSIM в качестве источника "Мобильных данных". Включите "Роуминг данных" для eSIM при международных поездках.',
          list: [
            'Настройки → Сотовая связь → Мобильные данные (выберите eSIM)',
            'Включите роуминг данных для линии eSIM',
            'Оставьте домашнюю SIM активной для звонков/SMS',
          ],
        },
        {
          heading: 'Устранение неполадок',
          body: 'Если eSIM не подключается немедленно:',
          list: [
            'Перезагрузите iPhone после установки',
            'Убедитесь, что роуминг данных ВКЛЮЧЁН для eSIM',
            'Проверьте, что вы находитесь в зоне покрытия сети',
            'Обратитесь в поддержку Ey Dost в WhatsApp — мы доступны 24/7',
          ],
        },
      ],
    },
  },
  {
    slug: 'how-to-install-esim-android',
    category: 'esim',
    publishedAt: '2026-05-03',
    readingMinutes: 4,
    en: {
      title: 'How to Install an eSIM on Android / Samsung (Step-by-Step)',
      description: 'A complete guide to installing an eSIM on Android phones including Samsung Galaxy, Google Pixel, and other eSIM-compatible Android devices.',
      sections: [
        {
          heading: 'Compatible Android devices',
          body: 'Most Android flagships from 2020 support eSIM. The most common:',
          list: [
            'Samsung Galaxy S20, S21, S22, S23, S24 series',
            'Google Pixel 3, 4, 5, 6, 7, 8 and newer',
            'Motorola Razr 5G and newer',
            'Huawei P40, P50 (limited support)',
          ],
        },
        {
          heading: 'Samsung Galaxy — Step by step',
          body: 'On a Samsung Galaxy device:',
          list: [
            'Settings → Connections → SIM Manager → Add eSIM',
            'Tap "Scan QR code" and scan the QR code from your WhatsApp',
            'Follow on-screen prompts to activate',
            'Set the eSIM as your Mobile Data source in SIM Manager',
            'Enable Data Roaming for the eSIM',
          ],
        },
        {
          heading: 'Google Pixel — Step by step',
          body: 'On a Google Pixel device:',
          list: [
            'Settings → Network & Internet → SIMs → Add SIM',
            'Tap "Download a SIM instead?" or "Scan QR code"',
            'Scan the QR code we sent via WhatsApp',
            'Confirm and wait for activation (10-30 seconds)',
            'Set as preferred data SIM in SIM settings',
          ],
        },
        {
          heading: 'Tips for Android eSIM',
          body: 'A few things to keep in mind with Android eSIM:',
          list: [
            'Your device must be unlocked (not carrier-locked)',
            'Some older Android versions may show different menu paths',
            'Always enable Data Roaming on the eSIM for international use',
            'If the QR code doesn\'t scan, try entering the activation code manually',
          ],
        },
      ],
    },
    az: {
      title: 'Android / Samsung telefonlarda eSIM necə quraşdırılır',
      description: 'Samsung Galaxy, Google Pixel və digər uyğun Android cihazlarında eSIM quraşdırma üçün tam bələdçi.',
      sections: [
        {
          heading: 'Uyğun Android cihazlar',
          body: '2020-dən etibarən əksər Android flagmanlar eSIM dəstəkləyir. Ən yaygınları:',
          list: [
            'Samsung Galaxy S20, S21, S22, S23, S24 seriyası',
            'Google Pixel 3, 4, 5, 6, 7, 8 və yenisi',
            'Motorola Razr 5G və yenisi',
          ],
        },
        {
          heading: 'Samsung Galaxy — Addım-addım',
          body: 'Samsung Galaxy cihazında:',
          list: [
            'Parametrlər → Bağlantılar → SIM Meneceri → eSIM Əlavə Et',
            '"QR kodu skan et"ə toxunun və WhatsApp-dan QR kodu skan edin',
            'Aktivləşdirmək üçün ekran göstərişlərini izləyin',
            'SIM Menecerində eSIM-i Mobil Data mənbəyi kimi təyin edin',
            'eSIM üçün Data Roaming-i aktivləşdirin',
          ],
        },
        {
          heading: 'Google Pixel — Addım-addım',
          body: 'Google Pixel cihazında:',
          list: [
            'Parametrlər → Şəbəkə və İnternet → SIM-lər → SIM Əlavə Et',
            '"QR kodu skan et"ə toxunun',
            'WhatsApp vasitəsilə göndərdiyimiz QR kodu skan edin',
            'Təsdiqləyin və aktivləşmə üçün gözləyin (10-30 saniyə)',
            'SIM parametrlərində üstünlüklü data SIM kimi təyin edin',
          ],
        },
        {
          heading: 'Android eSIM üçün məsləhətlər',
          body: 'Android eSIM ilə nəzərə alınacaq bir neçə məqam:',
          list: [
            'Cihazınız kilidsiz (operator kilidi açıq) olmalıdır',
            'Beynəlxalq istifadə üçün eSIM-də Data Roaming-i həmişə aktivləşdirin',
            'QR kodu skan edilmirsə, aktivləşdirmə kodunu əl ilə daxil etməyə cəhd edin',
          ],
        },
      ],
    },
    ru: {
      title: 'Как установить eSIM на Android / Samsung (пошаговая инструкция)',
      description: 'Полное руководство по установке eSIM на Android-смартфонах, включая Samsung Galaxy, Google Pixel и другие совместимые устройства.',
      sections: [
        {
          heading: 'Совместимые Android-устройства',
          body: 'Большинство Android-флагманов с 2020 года поддерживают eSIM. Наиболее распространённые:',
          list: [
            'Samsung Galaxy S20, S21, S22, S23, S24 серии',
            'Google Pixel 3, 4, 5, 6, 7, 8 и новее',
            'Motorola Razr 5G и новее',
          ],
        },
        {
          heading: 'Samsung Galaxy — Пошагово',
          body: 'На устройстве Samsung Galaxy:',
          list: [
            'Настройки → Подключения → Диспетчер SIM-карт → Добавить eSIM',
            'Нажмите "Сканировать QR-код" и отсканируйте QR-код из WhatsApp',
            'Следуйте инструкциям на экране для активации',
            'Установите eSIM как источник мобильных данных в диспетчере SIM',
            'Включите роуминг данных для eSIM',
          ],
        },
        {
          heading: 'Google Pixel — Пошагово',
          body: 'На устройстве Google Pixel:',
          list: [
            'Настройки → Сеть и интернет → SIM-карты → Добавить SIM',
            'Нажмите "Сканировать QR-код"',
            'Отсканируйте QR-код, присланный нами в WhatsApp',
            'Подтвердите и дождитесь активации (10-30 секунд)',
            'Установите в настройках SIM как предпочтительную SIM для данных',
          ],
        },
        {
          heading: 'Советы для Android eSIM',
          body: 'Несколько вещей, которые стоит учитывать:',
          list: [
            'Устройство должно быть разблокировано (не привязано к оператору)',
            'Всегда включайте роуминг данных на eSIM для международного использования',
            'Если QR-код не сканируется, попробуйте ввести код активации вручную',
          ],
        },
      ],
    },
  },
  {
    slug: 'best-europe-esim-2026',
    category: 'esim',
    publishedAt: '2026-05-04',
    readingMinutes: 6,
    en: {
      title: 'Best Europe eSIM Plans in 2026 — Complete Comparison',
      description: 'Compare the best Europe eSIM data plans for 2026. Find the right data package for your trip across 35 European countries with Ey Dost.',
      sections: [
        {
          heading: 'Why you need an eSIM for Europe',
          body: 'Travelling across Europe means constantly crossing borders — and with a traditional roaming plan, that means unexpected charges. An eSIM Europe plan covers 35+ countries with a single purchase. You pay once, and stay connected everywhere.',
        },
        {
          heading: 'Ey Dost Europe eSIM plans at a glance',
          body: 'All Ey Dost Europe eSIM plans cover 35 countries including UK, France, Germany, Spain, Italy, Netherlands, Switzerland, Austria, Belgium, Portugal, Greece, Poland, Czech Republic, Hungary and more.',
          list: [
            '1 GB / 7 days — ideal for short city trips',
            '3 GB / 15 days — best for week-long holidays',
            '5 GB / 30 days — great for 2-week trips with map and streaming',
            '10 GB / 30 days — heavy users, remote workers',
            '20 GB / 30 days — best value for long stays',
          ],
        },
        {
          heading: 'How to choose the right plan',
          body: 'A rough guide based on typical usage:',
          list: [
            '1-3 days trip: 1 GB is enough for maps, messaging, light browsing',
            '1 week: 3 GB covers maps, WhatsApp, occasional streaming',
            '2 weeks: 5–10 GB depending on video calls and streaming',
            'Remote worker / digital nomad: 20 GB',
          ],
        },
        {
          heading: 'Which countries are covered?',
          body: 'Ey Dost\'s Europe eSIM covers all major European destinations:',
          list: [
            'Western Europe: UK, France, Germany, Spain, Italy, Netherlands, Belgium, Switzerland',
            'Northern Europe: Sweden, Norway, Finland, Denmark',
            'Eastern Europe: Poland, Czech Republic, Hungary, Romania, Bulgaria',
            'Southern Europe: Greece, Portugal, Croatia, Malta',
            'And many more — 35 countries total',
          ],
        },
        {
          heading: 'How to buy',
          body: 'Message us on WhatsApp and say "Europe eSIM". We\'ll show you the available plans, you choose one, pay via the secure link, and your QR code arrives in under 2 minutes. No ID, no app, no hassle.',
        },
      ],
    },
    az: {
      title: '2026-cı ildə ən yaxşı Avropa eSIM planları — tam müqayisə',
      description: '2026-cı il üçün ən yaxşı Avropa eSIM data planlarını müqayisə edin. Ey Dost ilə 35 Avropa ölkəsindəki səfəriniz üçün düzgün paketi tapın.',
      sections: [
        {
          heading: 'Avropa üçün niyə eSIM lazımdır',
          body: 'Avropada səfər etmək daim sərhəd keçmək deməkdir — adi roaming planı ilə bu, gözlənilməz xərclər deməkdir. Avropa eSIM planı tək alışla 35+ ölkəni əhatə edir. Bir dəfə ödəyin, hər yerdə bağlı qalın.',
        },
        {
          heading: 'Ey Dost Avropa eSIM planlarına ümumi baxış',
          body: 'Bütün Ey Dost Avropa eSIM planları 35 ölkəni əhatə edir: Böyük Britaniya, Fransa, Almaniya, İspaniya, İtaliya, Hollandiya, İsveçrə, Avstriya, Belçika, Portuqaliya, Yunanıstan, Polşa, Çexiya, Macarıstan və daha çoxu.',
          list: [
            '1 GB / 7 gün — qısa şəhər səfərləri üçün ideal',
            '3 GB / 15 gün — bir həftəlik tətil üçün ən yaxşı',
            '5 GB / 30 gün — xəritə və yayım ilə 2 həftəlik səfərlər üçün əla',
            '10 GB / 30 gün — ağır istifadəçilər, uzaqdan işləyənlər',
            '20 GB / 30 gün — uzun qalışlar üçün ən yaxşı dəyər',
          ],
        },
        {
          heading: 'Düzgün planı necə seçmək olar',
          body: 'Tipik istifadəyə əsaslanan təxmini bələdçi:',
          list: [
            '1-3 günlük səfər: 1 GB xəritələr, mesajlaşma, yüngül gəzinti üçün kifayətdir',
            '1 həftə: 3 GB xəritələr, WhatsApp, ara-sıra yayım üçün əhatə edir',
            '2 həftə: video zənglər və yayımdan asılı olaraq 5–10 GB',
            'Uzaqdan işləyən / rəqəmsal köçəri: 20 GB',
          ],
        },
        {
          heading: 'Hansı ölkələr əhatə olunur?',
          body: 'Ey Dost Avropa eSIM bütün əsas Avropa məyarları əhatə edir:',
          list: [
            'Qərbi Avropa: Böyük Britaniya, Fransa, Almaniya, İspaniya, İtaliya, Hollandiya, Belçika, İsveçrə',
            'Şimali Avropa: İsveç, Norveç, Finlandiya, Danimarka',
            'Şərqi Avropa: Polşa, Çexiya, Macarıstan, Rumıniya, Bolqarıstan',
            'Cənubi Avropa: Yunanıstan, Portuqaliya, Xorvatiya, Malta',
            'Və daha çox — cəmi 35 ölkə',
          ],
        },
        {
          heading: 'Necə almaq olar',
          body: 'WhatsApp-da yazın və "Avropa eSIM" deyin. Mövcud planları göstərəcəyik, birini seçin, təhlükəsiz link vasitəsilə ödəyin və QR kodunuz 2 dəqiqədən az müddətdə gələcək. ID lazım deyil, proqram yoxdur.',
        },
      ],
    },
    ru: {
      title: 'Лучшие тарифы eSIM для Европы в 2026 году — полное сравнение',
      description: 'Сравните лучшие тарифные планы eSIM для Европы на 2026 год. Найдите правильный пакет данных для поездки по 35 европейским странам с Ey Dost.',
      sections: [
        {
          heading: 'Зачем нужна eSIM для Европы',
          body: 'Путешествовать по Европе — значит постоянно пересекать границы, а с обычным роамингом это означает неожиданные расходы. Европейский план eSIM покрывает 35+ стран за одну покупку. Платите один раз — оставайтесь на связи везде.',
        },
        {
          heading: 'Тарифы Ey Dost Europe eSIM',
          body: 'Все тарифы Ey Dost Europe eSIM покрывают 35 стран: Великобритания, Франция, Германия, Испания, Италия, Нидерланды, Швейцария, Австрия, Бельгия, Португалия, Греция, Польша, Чехия, Венгрия и другие.',
          list: [
            '1 ГБ / 7 дней — идеально для коротких городских поездок',
            '3 ГБ / 15 дней — лучший выбор для недельных каникул',
            '5 ГБ / 30 дней — отлично для 2-недельных поездок с картами и стримингом',
            '10 ГБ / 30 дней — для активных пользователей, удалённых работников',
            '20 ГБ / 30 дней — лучшая ценность для долгосрочного пребывания',
          ],
        },
        {
          heading: 'Как выбрать правильный тариф',
          body: 'Приблизительный ориентир по типичному использованию:',
          list: [
            '1-3 дня: 1 ГБ достаточно для карт, мессенджеров, лёгкого серфинга',
            '1 неделя: 3 ГБ покроет карты, WhatsApp, редкий стриминг',
            '2 недели: 5–10 ГБ в зависимости от видеозвонков и стриминга',
            'Удалённый работник / цифровой кочевник: 20 ГБ',
          ],
        },
        {
          heading: 'Какие страны покрываются?',
          body: 'eSIM Ey Dost для Европы охватывает все основные европейские направления:',
          list: [
            'Западная Европа: Великобритания, Франция, Германия, Испания, Италия, Нидерланды, Бельгия, Швейцария',
            'Северная Европа: Швеция, Норвегия, Финляндия, Дания',
            'Восточная Европа: Польша, Чехия, Венгрия, Румыния, Болгария',
            'Южная Европа: Греция, Португалия, Хорватия, Мальта',
            'И многое другое — всего 35 стран',
          ],
        },
        {
          heading: 'Как купить',
          body: 'Напишите нам в WhatsApp и скажите "Europe eSIM". Мы покажем доступные тарифы, вы выберете один, оплатите по безопасной ссылке, и QR-код придёт менее чем за 2 минуты. Без ID, без приложения.',
        },
      ],
    },
  },
  {
    slug: 'stay-connected-europe-without-roaming',
    category: 'travel',
    publishedAt: '2026-05-05',
    readingMinutes: 5,
    en: {
      title: 'How to Stay Connected in Europe Without Paying Roaming Fees',
      description: 'Avoid expensive roaming charges in Europe. Discover the best ways to get cheap, reliable mobile internet across 35+ European countries using eSIM.',
      sections: [
        {
          heading: 'The roaming problem',
          body: 'International roaming fees can be shockingly expensive — some carriers charge €10-€20 per day for data abroad. Even within Europe, post-Brexit rules mean UK travellers often face extra charges in EU countries.',
        },
        {
          heading: 'Option 1: Local SIM card (old way)',
          body: 'The traditional solution was buying a local SIM card at your destination. It works, but has real downsides:',
          list: [
            'Queuing at a shop or airport counter',
            'Often need to show your passport',
            'Your home number becomes unreachable',
            'Only works in one country',
            'Easy to lose the tiny card',
          ],
        },
        {
          heading: 'Option 2: Europe eSIM (best way in 2026)',
          body: 'An eSIM covers 35+ European countries with a single plan. You keep your phone number, no physical card to lose, and you activate it in under 2 minutes — even before you land.',
          list: [
            'Works across 35+ countries seamlessly',
            'Activate before departure via QR code on WhatsApp',
            'Keep your regular number for calls and SMS',
            'From as low as €1 per GB',
            'No ID, no shop visit, no app needed',
          ],
        },
        {
          heading: 'Option 3: Pocket WiFi',
          body: 'A portable WiFi device works, but you need to carry an extra device, charge it, and the battery always seems to die at the wrong moment. Not ideal.',
        },
        {
          heading: 'Our recommendation',
          body: 'For 2026, eSIM is clearly the best option for European travel. Ey Dost makes it even easier — order via WhatsApp, receive QR code, scan, and you\'re connected. Try our Europe eSIM plan and never worry about roaming again.',
        },
      ],
    },
    az: {
      title: 'Avropada roaming ödəmədən necə bağlı qalmaq olar',
      description: 'Avropada bahalı roaming xərclərindən qaçının. eSIM istifadə edərək 35+ Avropa ölkəsində ucuz, etibarlı mobil internet əldə etməyin ən yaxşı yollarını kəşf edin.',
      sections: [
        {
          heading: 'Roaming problemi',
          body: 'Beynəlxalq roaming rüsumları şok edici dərəcədə baha ola bilər — bəzi operatorlar xaricdə data üçün gündə 10-20 avro tələb edir.',
        },
        {
          heading: 'Variant 1: Yerli SIM kart (köhnə yol)',
          body: 'Ənənəvi həll gedəcəyiniz yerdə yerli SIM kart almaq idi. İşləyir, amma real mənfi cəhətləri var:',
          list: [
            'Mağaza və ya hava limanı sayğacında növbə',
            'Çox vaxt pasportunuzu göstərməlisiniz',
            'Ev nömrəniz əlçatmaz olur',
            'Yalnız bir ölkədə işləyir',
            'Kiçik kartı itirmək asandır',
          ],
        },
        {
          heading: 'Variant 2: Avropa eSIM (2026-da ən yaxşı yol)',
          body: 'eSIM tək planla 35+ Avropa ölkəsini əhatə edir. Telefon nömrənizi saxlayırsınız, itiriləcək fiziki kart yoxdur və QR kodu ilə 2 dəqiqədən az müddətdə aktivləşdirirsiniz — hətta uçuşa minməzdən əvvəl.',
          list: [
            '35+ ölkədə sorunsuz işləyir',
            'WhatsApp-da QR kodu ilə yola çıxmazdan əvvəl aktivləşdirin',
            'Zənglər və SMS üçün nömrənizi saxlayın',
            'GB başına €1-dən aşağı qiymətlərdən',
            'ID yoxdur, mağaza ziyarəti yoxdur, proqram lazım deyil',
          ],
        },
        {
          heading: 'Tövsiyəmiz',
          body: '2026-cı il üçün eSIM Avropa səfəri üçün açıq şəkildə ən yaxşı variantdır. Ey Dost bunu daha da asanlaşdırır — WhatsApp-da sifariş edin, QR kodu alın, skan edin və bağlısınız. Avropa eSIM planımızı sınayın.',
        },
      ],
    },
    ru: {
      title: 'Как оставаться на связи в Европе без оплаты роуминга',
      description: 'Избегайте дорогостоящего роуминга в Европе. Узнайте лучшие способы получить дешёвый, надёжный мобильный интернет в 35+ европейских странах с eSIM.',
      sections: [
        {
          heading: 'Проблема роуминга',
          body: 'Тарифы на международный роуминг могут быть поразительно высокими — некоторые операторы берут €10-20 в день за использование данных за рубежом.',
        },
        {
          heading: 'Вариант 1: Местная SIM-карта (старый способ)',
          body: 'Традиционным решением была покупка местной SIM-карты. Работает, но имеет реальные недостатки:',
          list: [
            'Очередь в магазине или в аэропорту',
            'Часто нужно показать паспорт',
            'Ваш домашний номер становится недоступным',
            'Работает только в одной стране',
            'Крошечную карточку легко потерять',
          ],
        },
        {
          heading: 'Вариант 2: eSIM для Европы (лучший способ в 2026)',
          body: 'eSIM покрывает 35+ европейских стран с одним тарифом. Вы сохраняете свой номер, нет физической карты — нечего терять, активируете за 2 минуты по QR-коду.',
          list: [
            'Работает в 35+ странах без перебоев',
            'Активируйте до отъезда через QR-код в WhatsApp',
            'Сохраните свой обычный номер для звонков и SMS',
            'От €1 за ГБ',
            'Без ID, без похода в магазин, без приложений',
          ],
        },
        {
          heading: 'Наша рекомендация',
          body: 'В 2026 году eSIM — явно лучший вариант для путешествий по Европе. Ey Dost делает это ещё проще — заказывайте через WhatsApp, получайте QR-код, сканируйте — и вы подключены.',
        },
      ],
    },
  },
  // ── eSIM vs Roaming ──────────────────────────────────────────────────────────
  {
    slug: 'esim-vs-roaming-cost-comparison',
    category: 'esim',
    publishedAt: '2026-05-06',
    readingMinutes: 5,
    en: {
      title: 'eSIM vs Roaming in 2026 — Which is Cheaper? (Cost Comparison)',
      description: 'A detailed cost comparison between eSIM and traditional roaming for European travel in 2026. Find out how much you can save by switching to eSIM.',
      sections: [
        { heading: 'The true cost of roaming', body: 'Most major carriers charge between €5 and €15 per day for a "roaming pass" in Europe. For a 10-day trip, that\'s €50–€150 just for internet access — on top of your regular monthly bill.' },
        { heading: 'What does an eSIM cost?', body: 'A Europe eSIM from Ey Dost covering 35 countries costs:', list: ['1 GB / 7 days — approx. €1.60', '3 GB / 15 days — approx. €3.90', '5 GB / 30 days — approx. €6.70', '10 GB / 30 days — approx. €12.00', '20 GB / 30 days — approx. €20.00'] },
        { heading: 'Side-by-side comparison', body: 'For a 2-week trip to Europe using 3–5 GB of data:', list: ['Carrier roaming pass: €70–€140', 'Airport SIM card: €25–€40 (single country only)', 'Ey Dost Europe eSIM: €6.70–€12.00', 'Saving with eSIM: up to €130 vs roaming'] },
        { heading: 'Hidden roaming costs to watch for', body: 'Roaming bills often include hidden extras:', list: ['Per-minute call charges even in EU', 'SMS charges that add up fast', 'Background app data charged at full roaming rate', 'Automatic renewal fees if you exceed daily cap'] },
        { heading: 'The verdict', body: 'For any trip of 3 days or more, an eSIM is significantly cheaper than roaming — often 5–10x less. And with Ey Dost, you activate in under 2 minutes via WhatsApp. No brainer.' },
      ],
    },
    az: {
      title: '2026-da eSIM vs Roaming — Hansı daha ucuzdur? (Xərc müqayisəsi)',
      description: '2026-cı ildə Avropa səfəri üçün eSIM və ənənəvi roaming arasında ətraflı xərc müqayisəsi. eSIM-ə keçərək nə qədər qənaət edə biləcəyinizi öyrənin.',
      sections: [
        { heading: 'Roaminqin əsl dəyəri', body: 'Əksər operatorlar Avropada "roaming paketi" üçün gündə 5-15 avro tələb edir. 10 günlük səfər üçün bu, yalnız internet girişi üçün 50–150 avro deməkdir.' },
        { heading: 'eSIM nə qədər başa gəlir?', body: '35 ölkəni əhatə edən Ey Dost Avropa eSIM-i bu qiymətlərə malikdir:', list: ['1 GB / 7 gün — təxm. €1.60', '3 GB / 15 gün — təxm. €3.90', '5 GB / 30 gün — təxm. €6.70', '10 GB / 30 gün — təxm. €12.00', '20 GB / 30 gün — təxm. €20.00'] },
        { heading: 'Yan-yana müqayisə', body: '3–5 GB data istifadə edərək Avropada 2 həftəlik səfər üçün:', list: ['Operator roaming paketi: €70–€140', 'Hava limanı SIM kartı: €25–€40 (yalnız bir ölkə)', 'Ey Dost Avropa eSIM: €6.70–€12.00', 'eSIM ilə qənaət: roamingə nisbətən 130 avro-ya qədər'] },
        { heading: 'Nəticə', body: '3 gün və ya daha uzun müddətli istənilən səfər üçün eSIM roamingdən əhəmiyyətli dərəcədə ucuzdur — çox vaxt 5-10 dəfə az. Ey Dost ilə WhatsApp vasitəsilə 2 dəqiqədən az müddətdə aktivləşdirirsiniz.' },
      ],
    },
    ru: {
      title: 'eSIM vs роуминг в 2026 — что дешевле? (сравнение стоимости)',
      description: 'Подробное сравнение стоимости eSIM и традиционного роуминга для поездок по Европе в 2026 году.',
      sections: [
        { heading: 'Реальная стоимость роуминга', body: 'Большинство операторов берут €5–15 в день за "пакет роуминга" в Европе. За 10-дневную поездку это €50–€150 только за интернет.' },
        { heading: 'Сколько стоит eSIM?', body: 'Европейский eSIM Ey Dost, охватывающий 35 стран, стоит:', list: ['1 ГБ / 7 дней — около €1.60', '3 ГБ / 15 дней — около €3.90', '5 ГБ / 30 дней — около €6.70', '10 ГБ / 30 дней — около €12.00', '20 ГБ / 30 дней — около €20.00'] },
        { heading: 'Сравнение', body: 'За 2-недельную поездку по Европе с 3–5 ГБ трафика:', list: ['Роуминг-пакет оператора: €70–€140', 'SIM-карта в аэропорту: €25–€40 (только одна страна)', 'Ey Dost Europe eSIM: €6.70–€12.00', 'Экономия с eSIM: до €130 по сравнению с роумингом'] },
        { heading: 'Вывод', body: 'Для любой поездки от 3 дней eSIM значительно дешевле роуминга — часто в 5–10 раз. С Ey Dost вы активируете за 2 минуты через WhatsApp.' },
      ],
    },
  },
  // ── Best eSIM Germany ─────────────────────────────────────────────────────────
  {
    slug: 'best-esim-germany-2026',
    category: 'esim',
    publishedAt: '2026-05-07',
    readingMinutes: 4,
    en: {
      title: 'Best eSIM for Germany in 2026 — Stay Connected Everywhere',
      description: 'Find the best eSIM for Germany in 2026. Compare data plans, coverage, and prices for travelling to Berlin, Munich, Hamburg and across Germany.',
      sections: [
        { heading: 'Why Germany needs a good eSIM', body: 'Germany has excellent 4G/LTE coverage in cities, but rural areas can be patchy. A good eSIM with broad network compatibility ensures you stay connected whether you\'re in Berlin\'s Mitte, Munich\'s Englischer Garten, or driving the Autobahn.' },
        { heading: 'Ey Dost Germany eSIM options', body: 'You can use our Europe eSIM (35 countries) or a dedicated Germany plan:', list: ['Germany-only plan: from €0.93 for 1 GB / 7 days', '5 GB / 30 days: approx. €5.80', 'Europe 35-country plan: from €1.60 — best if visiting multiple countries', '4G/LTE speeds on major German networks'] },
        { heading: 'Top German cities covered', body: 'Our eSIM works seamlessly across all major German cities and regions:', list: ['Berlin, Hamburg, Munich, Frankfurt, Cologne', 'Stuttgart, Düsseldorf, Dresden, Leipzig', 'All federal motorways (Autobahn) and intercity train routes'] },
        { heading: 'How to activate before you land', body: 'Order your Germany eSIM on WhatsApp before your flight. The QR code arrives instantly. Scan it, enable data roaming for the eSIM in your phone settings, and you\'ll have internet the moment you land at Frankfurt, Munich, or Berlin airports.' },
        { heading: 'Tips for using eSIM in Germany', body: '', list: ['German trains (Deutsche Bahn) have WiFi, but coverage can drop in tunnels — keep eSIM as backup', 'Berlin is known for poor indoor coverage — choose a plan with good network partners', 'Enable Low Data Mode on iPhone to stretch your GB further'] },
      ],
    },
    az: {
      title: '2026-da Almaniya üçün ən yaxşı eSIM — Hər yerdə bağlı qalın',
      description: '2026-cı ildə Almaniya üçün ən yaxşı eSIM-i tapın. Berlin, Münhen, Hamburq və bütün Almaniyada səfər üçün data planlarını, əhatəni və qiymətləri müqayisə edin.',
      sections: [
        { heading: 'Almaniyada niyə yaxşı eSIM lazımdır', body: 'Almaniyada şəhərlərdə əla 4G/LTE əhatəsi var, lakin kənd rayonlarında zəif ola bilər. Geniş şəbəkə uyğunluğu olan yaxşı eSIM ilə Berlin-in Mitte-sində, Münhen-in Englischer Garten-ında və ya Autobahn-da sürərkən bağlı qalırsınız.' },
        { heading: 'Ey Dost Almaniya eSIM seçimləri', body: 'Avropa eSIM-imizdən (35 ölkə) və ya xüsusi Almaniya planından istifadə edə bilərsiniz:', list: ['Yalnız Almaniya planı: 1 GB / 7 gün üçün €0.93-dən', '5 GB / 30 gün: təxm. €5.80', 'Avropa 35 ölkə planı: €1.60-dan — bir neçə ölkəyə gedərsinizsə ən yaxşı', 'Əsas Alman şəbəkələrində 4G/LTE sürəti'] },
        { heading: 'Əhatə olunan əsas Alman şəhərləri', body: 'eSIM-imiz bütün əsas Alman şəhərləri və regionlarında sorunsuz işləyir:', list: ['Berlin, Hamburq, Münhen, Frankfurt, Köln', 'Ştutqart, Düsseldorf, Drezden, Leypsiq', 'Bütün federal avtomobil yolları (Autobahn) və şəhərlərarası dəmir yolu marşrutları'] },
        { heading: 'Enməzdən əvvəl necə aktivləşdirmək olar', body: 'Uçuşunuzdan əvvəl WhatsApp-da Almaniya eSIM-inizi sifariş edin. QR kodu dərhal gəlir. Onu skan edin, telefon parametrlərinizdə eSIM üçün data roaming-i aktivləşdirin və Frankfurt, Münhen və ya Berlin hava limanlarına enən kimi internetiniz olacaq.' },
      ],
    },
    ru: {
      title: 'Лучший eSIM для Германии в 2026 году',
      description: 'Найдите лучший eSIM для Германии. Сравните тарифы, покрытие и цены для поездок в Берлин, Мюнхен, Гамбург и по всей Германии.',
      sections: [
        { heading: 'Зачем нужен хороший eSIM в Германии', body: 'В городах Германии отличное 4G/LTE-покрытие, но в сельской местности оно может быть нестабильным. Хороший eSIM с широкой совместимостью сетей обеспечит связь в Берлине, Мюнхене и на Autobahn.' },
        { heading: 'Варианты eSIM Ey Dost для Германии', body: 'Вы можете использовать наш европейский eSIM (35 стран) или отдельный план для Германии:', list: ['Только Германия: от €0.93 за 1 ГБ / 7 дней', '5 ГБ / 30 дней: около €5.80', 'Европейский план на 35 стран: от €1.60 — лучший вариант при посещении нескольких стран', '4G/LTE на ведущих немецких сетях'] },
        { heading: 'Охваченные города', body: 'Наш eSIM работает по всей Германии:', list: ['Берлин, Гамбург, Мюнхен, Франкфурт, Кёльн', 'Штутгарт, Дюссельдорф, Дрезден, Лейпциг', 'Все федеральные автострады и маршруты межгородских поездов'] },
        { heading: 'Как активировать до прилёта', body: 'Закажите eSIM для Германии в WhatsApp до вылета. QR-код придёт мгновенно. Отсканируйте его, включите роуминг данных для eSIM — и интернет будет готов, как только вы приземлитесь.' },
      ],
    },
  },
  // ── eSIM France ──────────────────────────────────────────────────────────────
  {
    slug: 'how-to-use-esim-france',
    category: 'esim',
    publishedAt: '2026-05-07',
    readingMinutes: 4,
    en: {
      title: 'How to Use eSIM in France — Paris, Lyon, Nice and Beyond',
      description: 'Complete guide to using an eSIM in France. Everything you need to know about staying connected in Paris, the French Riviera, and across France in 2026.',
      sections: [
        { heading: 'eSIM coverage in France', body: 'France has strong 4G/5G coverage in major cities and along major routes. Paris, Lyon, Marseille, Nice, and Bordeaux all have excellent connectivity. Rural areas and mountain regions (Alps, Pyrenees) can have limited coverage.' },
        { heading: 'Best eSIM options for France', body: 'Choose based on your trip length and data needs:', list: ['1 GB / 7 days — city break in Paris, perfect for maps and WhatsApp', '3 GB / 15 days — road trip or multi-city France tour', '5 GB / 30 days — extended stay with streaming and video calls', 'Europe 35-country plan — best if also visiting Belgium, Spain, or other EU countries'] },
        { heading: 'Paris travel tips with eSIM', body: 'In Paris, your eSIM is essential for:', list: ['Google Maps and public transport (RATP) navigation', 'Booking restaurant reservations via apps', 'Museum entry — most Paris museums use QR code e-tickets', 'Staying in touch via WhatsApp and social media', 'Translating French menus and signs'] },
        { heading: 'French Riviera (Côte d\'Azur)', body: 'Nice, Cannes, Monaco, and Saint-Tropez all have excellent coverage. Your Ey Dost eSIM also covers Monaco separately (as part of the Europe plan), so you won\'t lose signal crossing the French-Monégasque border.' },
        { heading: 'How to get your France eSIM', body: 'Message Ey Dost on WhatsApp before your trip. Say "France eSIM" and we\'ll show you available plans. Pay via the secure link and your QR code arrives in under 2 minutes. Activate before boarding and you\'re ready.' },
      ],
    },
    az: {
      title: 'Fransada eSIM-dən necə istifadə etmək olar — Paris, Lion, Nis',
      description: 'Fransada eSIM istifadəsinə dair tam bələdçi. 2026-cı ildə Parisdə, Fransız Rivyerasında bağlı qalmaq üçün lazım olan hər şey.',
      sections: [
        { heading: 'Fransada eSIM əhatəsi', body: 'Fransa əsas şəhərlərdə və əsas marşrutlar boyunca güclü 4G/5G əhatəsinə malikdir. Paris, Lion, Marsel, Nis və Bordo hamısı əla bağlantıya malikdir.' },
        { heading: 'Fransa üçün ən yaxşı eSIM seçimləri', body: 'Səfər müddətinizə və data ehtiyacınıza görə seçin:', list: ['1 GB / 7 gün — Parisdə şəhər gəzintisi, xəritə və WhatsApp üçün ideal', '3 GB / 15 gün — yol səfəri və ya çox şəhərli Fransa turu', '5 GB / 30 gün — yayım və video zənglər ilə uzadılmış qalış', 'Avropa 35 ölkə planı — Belçika, İspaniya və ya digər AB ölkələrini ziyarət edirsinizsə ən yaxşı'] },
        { heading: 'Paris-də eSIM ilə səyahət məsləhətləri', body: 'Parisdə eSIM-iniz bunlar üçün vacibdir:', list: ['Google Maps və ictimai nəqliyyat (RATP) naviqasiyası', 'Restoran rezervasiyaları', 'Muzey girişi — əksər Paris muzeylərinin QR kod e-biletləri var', 'WhatsApp və sosial media', 'Fransız menyularını və işarələrini tərcümə etmək'] },
        { heading: 'Fransız Rivyerası (Côte d\'Azur)', body: 'Nis, Kann, Monako və San-Trope hamısı əla əhatəyə malikdir. Ey Dost eSIM-iniz Monakonı da əhatə edir, buna görə Fransız-Monakolu sərhədi keçərkən siqnal itirməyəcəksiniz.' },
        { heading: 'Fransa eSIM-inizi necə əldə edəsiniz', body: 'Səfərinizdən əvvəl WhatsApp-da Ey Dost-a yazın. "Fransa eSIM" deyin — mövcud planları göstərəcəyik, ödəyin, QR kodu 2 dəqiqəyə gəlir.' },
      ],
    },
    ru: {
      title: 'Как использовать eSIM во Франции — Париж, Лион, Ницца',
      description: 'Полное руководство по использованию eSIM во Франции. Всё, что нужно знать для связи в Париже, на Лазурном берегу и по всей Франции.',
      sections: [
        { heading: 'Покрытие eSIM во Франции', body: 'Во Франции отличное 4G/5G-покрытие в крупных городах. Париж, Лион, Марсель, Ницца и Бордо — везде отличная связь.' },
        { heading: 'Лучшие варианты eSIM для Франции', body: 'Выбирайте в зависимости от продолжительности поездки:', list: ['1 ГБ / 7 дней — поездка в Париж, идеально для карт и WhatsApp', '3 ГБ / 15 дней — автотур или маршрут по нескольким городам', '5 ГБ / 30 дней — долгосрочное пребывание со стримингом', 'Европейский план на 35 стран — лучший, если планируете посетить Бельгию, Испанию и другие страны ЕС'] },
        { heading: 'Советы для Парижа', body: 'В Париже eSIM незаменим для:', list: ['Навигации в Google Maps и метро (RATP)', 'Бронирования ресторанов через приложения', 'Входа в музеи — большинство парижских музеев используют QR-коды', 'Общения в WhatsApp и социальных сетях', 'Перевода французских меню и указателей'] },
        { heading: 'Как получить eSIM для Франции', body: 'Напишите Ey Dost в WhatsApp перед поездкой. Скажите "France eSIM" — мы покажем доступные тарифы, оплатите, QR-код придёт за 2 минуты.' },
      ],
    },
  },
  // ── Taxi Europe WhatsApp ─────────────────────────────────────────────────────
  {
    slug: 'book-taxi-europe-whatsapp',
    category: 'taxi',
    publishedAt: '2026-05-08',
    readingMinutes: 4,
    en: {
      title: 'How to Book a Taxi in Europe via WhatsApp — Ey Dost Guide',
      description: 'The easiest way to book a taxi anywhere in Europe without downloading an app. Learn how Ey Dost\'s WhatsApp taxi service works in 500+ European cities.',
      sections: [
        { heading: 'Why book a taxi via WhatsApp?', body: 'Most ride-hailing apps (Uber, Bolt, Cabify) are not available in every European city. And even where they are, you need to download yet another app, create an account, and add a payment method. Ey Dost solves this: just message us on WhatsApp and we\'ll handle the rest.' },
        { heading: 'How it works — 3 simple steps', body: 'Booking a taxi through Ey Dost is as easy as sending a message:', list: ['1. Open the Taxi page at eydost.com/taxi — enter your pickup and drop-off', '2. Choose your car class (Economy from €8, Comfort from €14)', '3. Tap "Order via WhatsApp" — we confirm your booking in seconds'] },
        { heading: 'Where is the service available?', body: 'Ey Dost taxi is active in 500+ cities across Europe including:', list: ['UK: London, Manchester, Birmingham, Edinburgh', 'France: Paris, Lyon, Marseille, Nice, Bordeaux', 'Germany: Berlin, Munich, Hamburg, Frankfurt, Cologne', 'Spain: Madrid, Barcelona, Seville, Valencia', 'Italy: Rome, Milan, Florence, Venice, Naples', 'Netherlands, Belgium, Switzerland, Austria and 40+ more countries'] },
        { heading: 'Airport transfers', body: 'Ey Dost specialises in airport transfers. Pre-book your airport pickup in advance, give us your flight number, and your driver will track the flight and be waiting when you arrive — even if it\'s delayed.' },
        { heading: 'Payment and pricing', body: 'Car class pricing gives you clarity before you book: Economy from €8, Comfort from €14, Business from €22, Minivan from €20. Final price is confirmed before you commit. Pay securely via the link sent to WhatsApp.' },
      ],
    },
    az: {
      title: 'Avropada WhatsApp vasitəsilə taksi necə sifariş etmək olar',
      description: 'Proqram yükləmədən Avropanın istənilən yerində taksi sifariş etməyin ən asan yolu. Ey Dost-un WhatsApp taksi xidmətinin 500+ Avropa şəhərində necə işlədiyini öyrənin.',
      sections: [
        { heading: 'Niyə WhatsApp vasitəsilə taksi sifariş etmək?', body: 'Əksər taksi proqramları (Uber, Bolt) hər Avropa şəhərində mövcud deyil. Mövcud olduqda belə başqa proqram yükləmək, hesab yaratmaq lazımdır. Ey Dost bunu həll edir: sadəcə WhatsApp-da yazın.' },
        { heading: 'Necə işləyir — 3 sadə addım', body: 'Ey Dost vasitəsilə taksi sifariş etmək mesaj göndərmək qədər asandır:', list: ['1. eydost.com/taxi səhifəsini açın — götürülmə və çatdırılma yerini daxil edin', '2. Avtomobil sinfini seçin (Ekonom €8-dən, Komfort €14-dən)', '3. "WhatsApp ilə Sifariş Et"ə toxunun — sifarişinizi saniyələr içində təsdiqləyirik'] },
        { heading: 'Xidmət harada mövcuddur?', body: 'Ey Dost taksisi Avropada 500+ şəhərdə aktivdir:', list: ['Böyük Britaniya: London, Manchester, Edinburq', 'Fransa: Paris, Lion, Marsel, Nis', 'Almaniya: Berlin, Münhen, Hamburq, Frankfurt', 'İspaniya: Madrid, Barselona', 'İtaliya: Roma, Milan, Florensiya', 'Hollandiya, Belçika, İsveçrə, Avstriya və 40+ başqa ölkə'] },
        { heading: 'Hava limanı transferləri', body: 'Ey Dost hava limanı transferlərini xüsusi idarə edir. Uçuş nömrənizi verin — sürücü uçuşunuzu izləyir və gec qalsa belə sizi gözləyir.' },
        { heading: 'Ödəniş və qiymətlər', body: 'Avtomobil sinif qiymətləndirməsi rezervasiyadan əvvəl aydınlıq verir: Ekonom €8-dən, Komfort €14-dən, Biznes €22-dən, Minivan €20-dən. Son qiymət siz onaylamamışdan əvvəl təsdiqlənir.' },
      ],
    },
    ru: {
      title: 'Как заказать такси в Европе через WhatsApp — руководство Ey Dost',
      description: 'Самый простой способ заказать такси в любой точке Европы без загрузки приложения. Узнайте, как работает сервис такси Ey Dost через WhatsApp в 500+ городах.',
      sections: [
        { heading: 'Зачем заказывать такси через WhatsApp?', body: 'Большинство приложений для такси (Uber, Bolt) доступны не во всех европейских городах. Ey Dost решает эту проблему: просто напишите в WhatsApp — мы сделаем всё остальное.' },
        { heading: 'Как это работает — 3 простых шага', body: 'Заказать такси через Ey Dost так же просто, как отправить сообщение:', list: ['1. Откройте eydost.com/taxi — введите место посадки и назначение', '2. Выберите класс автомобиля (Эконом от €8, Комфорт от €14)', '3. Нажмите "Заказать через WhatsApp" — подтверждаем бронирование за секунды'] },
        { heading: 'Где доступен сервис?', body: 'Такси Ey Dost работает в 500+ городах Европы:', list: ['Великобритания: Лондон, Манчестер, Эдинбург', 'Франция: Париж, Лион, Марсель, Ницца', 'Германия: Берлин, Мюнхен, Гамбург, Франкфурт', 'Испания: Мадрид, Барселона', 'Италия: Рим, Милан, Флоренция', 'Нидерланды, Бельгия, Швейцария, Австрия и 40+ других стран'] },
        { heading: 'Трансферы из аэропорта', body: 'Ey Dost специализируется на трансферах. Забронируйте заранее, дайте номер рейса — водитель отследит рейс и будет ждать вас даже при задержке.' },
        { heading: 'Оплата и цены', body: 'Цены по классам автомобилей дают ясность до бронирования: Эконом от €8, Комфорт от €14, Бизнес от €22, Минивэн от €20. Итоговая цена подтверждается до оплаты.' },
      ],
    },
  },
  // ── Airport Transfer Guide ────────────────────────────────────────────────────
  {
    slug: 'airport-transfer-europe-guide',
    category: 'taxi',
    publishedAt: '2026-05-08',
    readingMinutes: 4,
    en: {
      title: 'Airport Transfer Guide: The Easiest Way to Get from Airport to City in Europe',
      description: 'How to pre-book reliable airport transfers across major European airports via WhatsApp. No queues, no apps, driver waiting with your name.',
      sections: [
        { heading: 'The airport arrival problem', body: 'After a long flight, the last thing you want is to queue for a taxi, figure out public transport in an unfamiliar city, or get scammed by an unlicensed driver outside the arrivals hall. Pre-booking a transfer via Ey Dost solves all of this.' },
        { heading: 'How to pre-book your airport transfer', body: 'It takes 2 minutes on WhatsApp:', list: ['Message us your flight number and arrival date', 'Tell us your destination (hotel name or address)', 'Choose your car class', 'Receive driver details and confirmation via WhatsApp', 'Your driver tracks your flight — no need to update if delayed'] },
        { heading: 'Covered airports', body: 'Ey Dost airport transfers are available at:', list: ['London Heathrow (LHR), Gatwick (LGW), Stansted (STN)', 'Paris Charles de Gaulle (CDG), Orly (ORY)', 'Frankfurt Airport (FRA), Munich (MUC), Berlin (BER)', 'Amsterdam Schiphol (AMS)', 'Barcelona El Prat (BCN), Madrid Barajas (MAD)', 'Rome Fiumicino (FCO), Milan Malpensa (MXP)', 'And 100+ more European airports'] },
        { heading: 'Flight tracking included', body: 'Every airport transfer includes real-time flight tracking at no extra cost. If your flight is delayed, your driver adjusts automatically. You never need to send a message — we\'ve got it covered.' },
        { heading: 'Pricing for airport transfers', body: 'Airport transfer prices vary by city and distance, but start from the same base as our standard fares: Economy from €8, Comfort from €14, Business from €22. A premium is applied for very early morning or late-night pickups in some cities.' },
      ],
    },
    az: {
      title: 'Hava limanı transfer bələdçisi: Avropada hava limanından şəhərə getməyin ən asan yolu',
      description: 'WhatsApp vasitəsilə əsas Avropa hava limanlarında etibarlı transfer əvvəlcədən necə sifariş edilir. Növbə yoxdur, proqram yoxdur, sürücü adınızla gözləyir.',
      sections: [
        { heading: 'Hava limanına gəliş problemi', body: 'Uzun bir uçuşdan sonra istəmədiyiniz son şey taksi növbəsidir. Ey Dost vasitəsilə transferi əvvəlcədən sifariş etmək bütün bu problemləri həll edir.' },
        { heading: 'Hava limanı transferini necə əvvəlcədən sifariş etmək olar', body: 'WhatsApp-da 2 dəqiqə çəkir:', list: ['Uçuş nömrənizi və gəliş tarixinizi bizə yazın', 'Gedəcəyiniz yeri bildirin (otel adı və ya ünvan)', 'Avtomobil sinfini seçin', 'WhatsApp vasitəsilə sürücü məlumatları və təsdiq alın', 'Sürücünüz uçuşunuzu izləyir — gecikirsinizsə xəbər verməyə ehtiyac yoxdur'] },
        { heading: 'Əhatə olunan hava limanları', body: 'Ey Dost hava limanı transferləri mövcuddur:', list: ['London Hitroh (LHR), Gatvik (LGW)', 'Paris Şarl de Qol (CDG), Orli (ORY)', 'Frankfurt (FRA), Münhen (MUC), Berlin (BER)', 'Amsterdam Şiphol (AMS)', 'Barselona (BCN), Madrid (MAD)', 'Roma (FCO), Milan (MXP)', 'Və 100+ başqa Avropa hava limanı'] },
        { heading: 'Uçuş izləmə daxildir', body: 'Hər hava limanı transferi əlavə xərcsiz real vaxt uçuş izləməni əhatə edir. Uçuşunuz gecikirsə, sürücünüz avtomatik uyğunlaşır.' },
      ],
    },
    ru: {
      title: 'Гид по трансферам из аэропорта: самый простой способ добраться из аэропорта в город в Европе',
      description: 'Как заблаговременно забронировать надёжный трансфер в крупных европейских аэропортах через WhatsApp. Никаких очередей, приложений, водитель ждёт с вашим именем.',
      sections: [
        { heading: 'Проблема прилёта в аэропорт', body: 'После долгого перелёта меньше всего хочется стоять в очереди за такси. Предварительное бронирование трансфера через Ey Dost решает все эти проблемы.' },
        { heading: 'Как забронировать трансфер из аэропорта', body: 'Это займёт 2 минуты в WhatsApp:', list: ['Напишите нам номер рейса и дату прилёта', 'Укажите место назначения (название отеля или адрес)', 'Выберите класс автомобиля', 'Получите данные водителя и подтверждение в WhatsApp', 'Водитель отслеживает рейс — не нужно сообщать о задержке'] },
        { heading: 'Охваченные аэропорты', body: 'Трансферы Ey Dost доступны в:', list: ['Лондон Хитроу (LHR), Гатвик (LGW)', 'Париж Шарль-де-Голль (CDG), Орли (ORY)', 'Франкфурт (FRA), Мюнхен (MUC), Берлин (BER)', 'Амстердам Схипхол (AMS)', 'Барселона (BCN), Мадрид (MAD)', 'Рим (FCO), Милан (MXP)', 'И 100+ других европейских аэропортов'] },
        { heading: 'Отслеживание рейса включено', body: 'Каждый трансфер из аэропорта включает отслеживание рейса в реальном времени. Если рейс задерживается, водитель корректирует расписание автоматически.' },
        { heading: 'Цены на трансферы', body: 'Цены начинаются от тех же базовых тарифов: Эконом от €8, Комфорт от €14, Бизнес от €22, Минивэн от €20.' },
      ],
    },
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
