export const TURKEY_ESIM_IMG = {
  travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80',
  qr: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&auto=format&fit=crop&q=80',
  city: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80',
} as const;

type Lang = 'en' | 'az' | 'ru' | 'tr' | 'ar' | 'es' | 'zh';

export const TURKEY_ESIM_IMAGE_TEXT: Record<
  Lang,
  { travel: { alt: string; caption: string }; qr: { alt: string; caption: string }; city: { alt: string; caption: string } }
> = {
  en: {
    travel: {
      alt: 'Traveler using mobile data at an airport before a trip to Turkey',
      caption: 'Activate your Turkey eSIM before landing so maps and WhatsApp work at IST or SAW.',
    },
    qr: {
      alt: 'Installing a Turkey eSIM by scanning a QR code on iPhone',
      caption: 'Most Turkey eSIM plans install in under two minutes with a single QR code.',
    },
    city: {
      alt: 'Tourist using a smartphone for navigation in a Turkish city',
      caption: 'Reliable data helps with Istanbul metros, BiTaksi, and hotel check-in on arrival.',
    },
  },
  az: {
    travel: {
      alt: 'Türkiyə səfərinə hazırlaşan səyahətçi hava limanında mobil datadan istifadə edir',
      caption: 'Enməzdən əvvəl Türkiyə eSIM-ini aktivləşdirin — IST və ya SAW-da xəritə və WhatsApp işləsin.',
    },
    qr: {
      alt: 'iPhone-da QR kod skan edərək Türkiyə eSIM quraşdırılması',
      caption: 'Əksər Türkiyə eSIM planları tək QR kodla iki dəqiqədən az müddətdə quraşdırılır.',
    },
    city: {
      alt: 'Türk şəhərində naviqasiya üçün smartfondan istifadə edən turist',
      caption: 'Stabil data İstanbul metro, BiTaksi və otel qeydiyyatında kömək edir.',
    },
  },
  ru: {
    travel: {
      alt: 'Путешественник использует мобильный интернет в аэропорту перед поездкой в Турцию',
      caption: 'Активируйте eSIM для Турции до посадки — карты и WhatsApp заработают в IST или SAW.',
    },
    qr: {
      alt: 'Установка eSIM для Турции по QR-коду на iPhone',
      caption: 'Большинство тарифов для Турции устанавливаются менее чем за две минуты по одному QR-коду.',
    },
    city: {
      alt: 'Турист с телефоном для навигации в турецком городе',
      caption: 'Стабильный интернет помогает с метро Стамбула, BiTaksi и регистрацией в отеле.',
    },
  },
  tr: {
    travel: {
      alt: 'Türkiye seyahati öncesi havalimanında mobil veri kullanan yolcu',
      caption: 'İnişten önce Türkiye eSIM’inizi etkinleştirin — IST veya SAW’da harita ve WhatsApp çalışsın.',
    },
    qr: {
      alt: 'iPhone’da QR kod ile Türkiye eSIM kurulumu',
      caption: 'Çoğu Türkiye eSIM planı tek QR kodla iki dakikadan kısa sürede kurulur.',
    },
    city: {
      alt: 'Türk şehrinde navigasyon için akıllı telefon kullanan turist',
      caption: 'Kararlı veri İstanbul metrosu, BiTaksi ve otele girişte işinize yarar.',
    },
  },
  ar: {
    travel: {
      alt: 'مسافر يستخدم بيانات الجوال في المطار قبل رحلة إلى تركيا',
      caption: 'فعّل eSIM تركيا قبل الهبوط ليعمل الخرائط وواتساب في IST أو SAW.',
    },
    qr: {
      alt: 'تثبيت eSIM تركيا بمسح رمز QR على iPhone',
      caption: 'معظم خطط eSIM تركيا تُثبَّت في أقل من دقيقتين برمز QR واحد.',
    },
    city: {
      alt: 'سائح يستخدم الهاتف للملاحة في مدينة تركية',
      caption: 'بيانات مستقرة تساعد في مترو إسطنبول وBiTaksi وتسجيل الفندق.',
    },
  },
  es: {
    travel: {
      alt: 'Viajero usando datos móviles en el aeropuerto antes de un viaje a Turquía',
      caption: 'Activa tu eSIM de Turquía antes de aterrizar para que mapas y WhatsApp funcionen en IST o SAW.',
    },
    qr: {
      alt: 'Instalación de eSIM de Turquía escaneando un código QR en iPhone',
      caption: 'La mayoría de los planes eSIM para Turquía se instalan en menos de dos minutos con un QR.',
    },
    city: {
      alt: 'Turista usando el smartphone para navegar en una ciudad turca',
      caption: 'Datos fiables ayudan con el metro de Estambul, BiTaksi y el check-in del hotel.',
    },
  },
  zh: {
    travel: {
      alt: '旅客在前往土耳其的行程前于机场使用手机流量',
      caption: '落地前激活土耳其 eSIM，在 IST 或 SAW 即可使用地图和 WhatsApp。',
    },
    qr: {
      alt: '在 iPhone 上扫描二维码安装土耳其 eSIM',
      caption: '多数土耳其 eSIM 套餐通过一个二维码可在两分钟内完成安装。',
    },
    city: {
      alt: '游客在土耳其城市用手机导航',
      caption: '稳定网络有助于伊斯坦布尔地铁、BiTaksi 和酒店入住。',
    },
  },
};

export function turkeyEsimSectionImages(lang: Lang) {
  const t = TURKEY_ESIM_IMAGE_TEXT[lang];
  return {
    travel: { src: TURKEY_ESIM_IMG.travel, ...t.travel },
    qr: { src: TURKEY_ESIM_IMG.qr, ...t.qr },
    city: { src: TURKEY_ESIM_IMG.city, ...t.city },
  };
}
