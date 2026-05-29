/** Paris CDG transfer — Unsplash IDs used elsewhere in blog (verified in repo) */
const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&auto=format&fit=crop&q=80`;

export const CDG_TAXI_IMG = {
  featured: U('1502602898657-3e91760cbb34'),
  arrival: U('1436491865332-7a61a109cc05'),
  whatsapp: U('1682018272449-0a4216a8be57'),
  esim: U('1579621970563-ebec7560ff3e'),
} as const;

type Lang = 'en' | 'az' | 'ru' | 'tr' | 'ar' | 'es' | 'zh';

export const CDG_TAXI_IMAGE_TEXT: Record<
  Lang,
  {
    arrival: { alt: string; caption: string };
    whatsapp: { alt: string; caption: string };
    esim: { alt: string; caption: string };
  }
> = {
  en: {
    arrival: {
      alt: 'Passengers at an international airport arrivals area',
      caption: 'Pre-book CDG to Paris so you leave Terminal 2 or 3 with a driver waiting.',
    },
    whatsapp: {
      alt: 'WhatsApp taxi booking on a phone screen',
      caption: 'Share flight number and Paris address — Ey Dost confirms your CDG transfer quickly.',
    },
    esim: {
      alt: 'Traveler using mobile data in Europe',
      caption: 'France eSIM before landing — Uber, maps, and hotel messages work at CDG.',
    },
  },
  az: {
    arrival: {
      alt: 'Beynəlxalq hava limanı gəliş zonasında sərnişinlər',
      caption: 'CDG-dən Parisə əvvəlcədən sifariş — Terminal 2 və ya 3-dən sürücü ilə çıxın.',
    },
    whatsapp: {
      alt: 'Telefonda WhatsApp taksi sifarişi',
      caption: 'Uçuş nömrəsi və Paris ünvanı göndərin — Ey Dost CDG transferinizi tez təsdiqləyir.',
    },
    esim: {
      alt: 'Avropada mobil data istifadə edən səyahətçi',
      caption: 'Enməzdən əvvəl Fransa eSIM — CDG-də Uber, xəritə və otel mesajları işləsin.',
    },
  },
  ru: {
    arrival: {
      alt: 'Пассажиры в зоне прилёта международного аэропорта',
      caption: 'Забронируйте CDG → Париж заранее — водитель ждёт у терминала 2 или 3.',
    },
    whatsapp: {
      alt: 'Заказ такси через WhatsApp на телефоне',
      caption: 'Отправьте рейс и адрес в Париже — Ey Dost быстро подтвердит трансфер из CDG.',
    },
    esim: {
      alt: 'Путешественник с мобильным интернетом в Европе',
      caption: 'eSIM для Франции до посадки — Uber, карты и отель работают в CDG.',
    },
  },
  tr: {
    arrival: {
      alt: 'Uluslararası havalimanı geliş alanında yolcular',
      caption: 'CDG–Paris’i önceden ayırtın — Terminal 2 veya 3’te şoför sizi beklesin.',
    },
    whatsapp: {
      alt: 'Telefonda WhatsApp taksi rezervasyonu',
      caption: 'Uçuş ve Paris adresi gönderin — Ey Dost CDG transferinizi hızla onaylar.',
    },
    esim: {
      alt: 'Avrupa’da mobil veri kullanan gezgin',
      caption: 'İnişten önce Fransa eSIM — CDG’de Uber, harita ve otel mesajları çalışsın.',
    },
  },
  ar: {
    arrival: {
      alt: 'ركاب في منطقة الوصول بمطار دولي',
      caption: 'احجز CDG إلى باريس مسبقاً — سائق ينتظرك عند المحطة 2 أو 3.',
    },
    whatsapp: {
      alt: 'حجز تاكسي عبر واتساب على الهاتف',
      caption: 'أرسل الرحلة وعنوان باريس — Ey Dost يؤكد نقل CDG بسرعة.',
    },
    esim: {
      alt: 'مسافر يستخدم بيانات الجوال في أوروبا',
      caption: 'eSIM فرنسا قبل الهبوط — أوبر والخرائط ورسائل الفندق تعمل في CDG.',
    },
  },
  es: {
    arrival: {
      alt: 'Pasajeros en la zona de llegadas de un aeropuerto internacional',
      caption: 'Reserva CDG–París con antelación — conductor en Terminal 2 o 3.',
    },
    whatsapp: {
      alt: 'Reserva de taxi por WhatsApp en el móvil',
      caption: 'Envía vuelo y dirección en París — Ey Dost confirma tu traslado desde CDG.',
    },
    esim: {
      alt: 'Viajero usando datos móviles en Europa',
      caption: 'eSIM Francia antes de aterrizar — Uber, mapas y hotel en CDG.',
    },
  },
  zh: {
    arrival: {
      alt: '国际机场到达区的旅客',
      caption: '提前预订 CDG 到巴黎，2 或 3 号航站楼即有司机等候。',
    },
    whatsapp: {
      alt: '手机上通过 WhatsApp 预订出租车',
      caption: '发送航班号和巴黎地址 — Ey Dost 快速确认 CDG 接送。',
    },
    esim: {
      alt: '在欧洲使用移动数据的旅客',
      caption: '落地前安装法国 eSIM — CDG 可用 Uber、地图和酒店消息。',
    },
  },
};

export function cdgTransferSectionImages(lang: Lang) {
  const t = CDG_TAXI_IMAGE_TEXT[lang];
  return {
    arrival: { src: CDG_TAXI_IMG.arrival, ...t.arrival },
    whatsapp: { src: CDG_TAXI_IMG.whatsapp, ...t.whatsapp },
    esim: { src: CDG_TAXI_IMG.esim, ...t.esim },
  };
}
