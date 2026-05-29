/** London Heathrow transfer — Unsplash IDs used elsewhere in blog (verified in repo) */
const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&auto=format&fit=crop&q=80`;

export const LHR_TAXI_IMG = {
  featured: U('1513635269977-59663e0ac1ad'),
  arrival: U('1436491865332-7a61a109cc05'),
  whatsapp: U('1682018272449-0a4216a8be57'),
  esim: U('1695048133142-1a20484d2569'),
} as const;

type Lang = 'en' | 'az' | 'ru' | 'tr' | 'ar' | 'es' | 'zh';

export const LHR_TAXI_IMAGE_TEXT: Record<
  Lang,
  {
    arrival: { alt: string; caption: string };
    whatsapp: { alt: string; caption: string };
    esim: { alt: string; caption: string };
  }
> = {
  en: {
    arrival: {
      alt: 'Travelers with luggage at a European airport arrivals hall',
      caption: 'Pre-book LHR pickup so you skip the taxi queue after immigration.',
    },
    whatsapp: {
      alt: 'Booking a ride through WhatsApp on a smartphone',
      caption: 'Send flight number and hotel — Ey Dost confirms your Heathrow transfer in minutes.',
    },
    esim: {
      alt: 'Installing a Europe eSIM on iPhone before travel',
      caption: 'Install UK/Europe data before landing so maps and WhatsApp work at LHR.',
    },
  },
  az: {
    arrival: {
      alt: 'Avropa hava limanı gəliş zalında baqajlı səyahətçilər',
      caption: 'LHR götürməsini əvvəlcədən sifariş edin — pasportdan sonra taksi növbəsindən qaçın.',
    },
    whatsapp: {
      alt: 'Smartfonda WhatsApp vasitəsilə transfer sifarişi',
      caption: 'Uçuş nömrəsi və otel göndərin — Ey Dost Hitro transferinizi dəqiqələr içində təsdiqləyir.',
    },
    esim: {
      alt: 'Səfərdən əvvəl iPhone-da Avropa eSIM quraşdırılması',
      caption: 'Enməzdən əvvəl UK/Avropa datası quraşdırın — LHR-də xəritə və WhatsApp işləsin.',
    },
  },
  ru: {
    arrival: {
      alt: 'Путешественники с багажом в зале прилёта европейского аэропорта',
      caption: 'Забронируйте встречу в LHR заранее — без очереди за такси после паспортного контроля.',
    },
    whatsapp: {
      alt: 'Бронирование трансфера через WhatsApp на смартфоне',
      caption: 'Отправьте номер рейса и отель — Ey Dost подтвердит трансфер из Хитро за минуты.',
    },
    esim: {
      alt: 'Установка eSIM для Европы на iPhone перед поездкой',
      caption: 'Установите данные UK/Европа до посадки — карты и WhatsApp заработают в LHR.',
    },
  },
  tr: {
    arrival: {
      alt: 'Avrupa havalimanı geliş salonunda bagajlı yolcular',
      caption: 'LHR karşılamasını önceden ayırtın — pasaporttan sonra taksi kuyruğunu atlayın.',
    },
    whatsapp: {
      alt: 'Akıllı telefonda WhatsApp ile transfer rezervasyonu',
      caption: 'Uçuş numarası ve otel gönderin — Ey Dost Heathrow transferinizi dakikalar içinde onaylar.',
    },
    esim: {
      alt: 'Seyahat öncesi iPhone’da Avrupa eSIM kurulumu',
      caption: 'İnişten önce UK/Avrupa verisi kurun — LHR’de harita ve WhatsApp çalışsın.',
    },
  },
  ar: {
    arrival: {
      alt: 'مسافرون مع أمتعة في صالة الوصول بمطار أوروبي',
      caption: 'احجز الاستقبال من LHR مسبقاً وتجنب طابور التاكسي بعد الجوازات.',
    },
    whatsapp: {
      alt: 'حجز توصيلة عبر واتساب على الهاتف',
      caption: 'أرسل رقم الرحلة والفندق — Ey Dost يؤكد نقل هيثرو خلال دقائق.',
    },
    esim: {
      alt: 'تثبيت eSIM أوروبا على iPhone قبل السفر',
      caption: 'ثبّت بيانات UK/أوروبا قبل الهبوط لتعمل الخرائط وواتساب في LHR.',
    },
  },
  es: {
    arrival: {
      alt: 'Viajeros con equipaje en la sala de llegadas de un aeropuerto europeo',
      caption: 'Reserva el pickup en LHR y evita la cola de taxis tras inmigración.',
    },
    whatsapp: {
      alt: 'Reservar transfer por WhatsApp en el móvil',
      caption: 'Envía número de vuelo y hotel — Ey Dost confirma tu traslado de Heathrow en minutos.',
    },
    esim: {
      alt: 'Instalar eSIM Europa en iPhone antes del viaje',
      caption: 'Instala datos UK/Europa antes de aterrizar para mapas y WhatsApp en LHR.',
    },
  },
  zh: {
    arrival: {
      alt: '欧洲机场到达厅携带行李的旅客',
      caption: '提前预订 LHR 接机，入境后无需排队等出租车。',
    },
    whatsapp: {
      alt: '在手机上通过 WhatsApp 预订接送',
      caption: '发送航班号和酒店 — Ey Dost 几分钟内确认希思罗接送。',
    },
    esim: {
      alt: '出行前在 iPhone 上安装欧洲 eSIM',
      caption: '落地前安装英国/欧洲流量，LHR 即可使用地图和 WhatsApp。',
    },
  },
};

export function lhrTaxiSectionImages(lang: Lang) {
  const t = LHR_TAXI_IMAGE_TEXT[lang];
  return {
    arrival: { src: LHR_TAXI_IMG.arrival, ...t.arrival },
    whatsapp: { src: LHR_TAXI_IMG.whatsapp, ...t.whatsapp },
    esim: { src: LHR_TAXI_IMG.esim, ...t.esim },
  };
}
