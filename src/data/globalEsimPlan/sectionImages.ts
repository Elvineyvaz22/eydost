/** Shared image URLs + localized alt/caption for global eSIM article sections. */
export const GLOBAL_ESIM_IMG = {
  qr: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&auto=format&fit=crop&q=80',
  airport: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80',
  support: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=80',
} as const;

type Lang = 'en' | 'az' | 'ru' | 'tr' | 'ar' | 'es' | 'zh';

export const GLOBAL_ESIM_IMAGE_TEXT: Record<
  Lang,
  {
    qr: { alt: string; caption: string };
    airport: { alt: string; caption: string };
    support: { alt: string; caption: string };
  }
> = {
  en: {
    qr: {
      alt: 'Traveler scanning a global eSIM QR code on a smartphone',
      caption: 'Most global eSIM plans activate with a QR code in under a minute.',
    },
    airport: {
      alt: 'Traveler using a phone with mobile data at an international airport',
      caption: 'One data plan can cover multiple countries on a single itinerary.',
    },
    support: {
      alt: 'Traveler comparing mobile data plans on a phone before a trip',
      caption: 'Check coverage, data amount, and support before you buy — Ey Dost helps on WhatsApp.',
    },
  },
  az: {
    qr: {
      alt: 'Səyahətçi smartfonda qlobal eSIM QR kodunu skan edir',
      caption: 'Əksər qlobal eSIM planları bir dəqiqədən az müddətdə QR kodla aktivləşir.',
    },
    airport: {
      alt: 'Beynəlxalq hava limanında telefonda mobil data ilə səyahətçi',
      caption: 'Bir data planı tək marşrutda bir neçə ölkəni əhatə edə bilər.',
    },
    support: {
      alt: 'Səfərdən əvvəl telefonda mobil data planlarını müqayisə edən səyahətçi',
      caption: 'Alışdan əvvəl əhatə, data həcmi və dəstəyi yoxlayın — Ey Dost WhatsApp-da kömək edir.',
    },
  },
  ru: {
    qr: {
      alt: 'Путешественник сканирует QR-код глобального eSIM на смартфоне',
      caption: 'Большинство глобальных тарифов eSIM активируются по QR-коду менее чем за минуту.',
    },
    airport: {
      alt: 'Путешественник с мобильным интернетом в телефоне в международном аэропорту',
      caption: 'Один тариф может покрывать несколько стран в одной поездке.',
    },
    support: {
      alt: 'Путешественник сравнивает тарифы мобильного интернета перед поездкой',
      caption: 'Проверьте покрытие, объём данных и поддержку — Ey Dost помогает в WhatsApp.',
    },
  },
  tr: {
    qr: {
      alt: 'Yolcu akıllı telefonda küresel eSIM QR kodunu tarıyor',
      caption: 'Çoğu küresel eSIM planı bir dakikadan kısa sürede QR kodla etkinleşir.',
    },
    airport: {
      alt: 'Uluslararası havalimanında telefonda mobil veri kullanan yolcu',
      caption: 'Tek bir veri planı aynı rotada birden fazla ülkeyi kapsayabilir.',
    },
    support: {
      alt: 'Yolcu seyahat öncesi telefonda mobil veri planlarını karşılaştırıyor',
      caption: 'Satın almadan önce kapsama, veri miktarı ve desteği kontrol edin — Ey Dost WhatsApp’ta yardımcı olur.',
    },
  },
  ar: {
    qr: {
      alt: 'مسافر يمسح رمز QR لشريحة eSIM عالمية على الهاتف',
      caption: 'تفعّل معظم خطط eSIM العالمية عبر رمز QR في أقل من دقيقة.',
    },
    airport: {
      alt: 'مسافر يستخدم بيانات الجوال في مطار دولي',
      caption: 'خطة بيانات واحدة قد تغطي عدة دول في رحلة واحدة.',
    },
    support: {
      alt: 'مسافر يقارن خطط بيانات الجوال قبل الرحلة',
      caption: 'تحقق من التغطية وحجم البيانات والدعم قبل الشراء — Ey Dost يساعدك عبر واتساب.',
    },
  },
  es: {
    qr: {
      alt: 'Viajero escaneando un código QR de eSIM global en el smartphone',
      caption: 'La mayoría de los planes eSIM globales se activan con un QR en menos de un minuto.',
    },
    airport: {
      alt: 'Viajero usando datos móviles en el teléfono en un aeropuerto internacional',
      caption: 'Un solo plan de datos puede cubrir varios países en el mismo itinerario.',
    },
    support: {
      alt: 'Viajero comparando planes de datos móviles antes del viaje',
      caption: 'Revisa cobertura, cantidad de datos y soporte antes de comprar — Ey Dost ayuda por WhatsApp.',
    },
  },
  zh: {
    qr: {
      alt: '旅客在智能手机上扫描全球 eSIM 二维码',
      caption: '大多数全球 eSIM 套餐可在不到一分钟内通过二维码激活。',
    },
    airport: {
      alt: '旅客在国际机场使用手机移动数据',
      caption: '一份流量套餐可覆盖同一行程中的多个国家。',
    },
    support: {
      alt: '旅客在出行前用手机比较移动数据套餐',
      caption: '购买前请核对覆盖范围、流量与支持 — Ey Dost 可通过 WhatsApp 协助。',
    },
  },
};

export function globalEsimSectionImages(lang: Lang) {
  const t = GLOBAL_ESIM_IMAGE_TEXT[lang];
  return {
    qr: { src: GLOBAL_ESIM_IMG.qr, ...t.qr },
    airport: { src: GLOBAL_ESIM_IMG.airport, ...t.airport },
    support: { src: GLOBAL_ESIM_IMG.support, ...t.support },
  };
}
