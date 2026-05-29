/** Turkey / Istanbul — Unsplash IDs verified HTTP 200 (not Paris or generic stock). */
const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&auto=format&fit=crop&q=80`;

export const TURKEY_ESIM_IMG = {
  /** Bosphorus & Galata — arrival / why eSIM in Turkey */
  travel: U('1721981424910-a4504e67a2ab'),
  /** iPhone eSIM QR setup — location-neutral */
  qr: U('1695048133142-1a20484d2569'),
  /** Galata Bridge area, Istanbul — taxis, maps, metro tips */
  city: U('1752508379817-eecff83d1745'),
} as const;

type Lang = 'en' | 'az' | 'ru' | 'tr' | 'ar' | 'es' | 'zh';

export const TURKEY_ESIM_IMAGE_TEXT: Record<
  Lang,
  {
    travel: { alt: string; caption: string };
    qr: { alt: string; caption: string };
    city: { alt: string; caption: string };
  }
> = {
  en: {
    travel: {
      alt: 'Istanbul skyline and the Bosphorus with Galata Tower in the background',
      caption: 'Land in Istanbul (IST or SAW) with data ready for maps, WhatsApp, and BiTaksi.',
    },
    qr: {
      alt: 'Installing a Turkey eSIM by scanning a QR code on iPhone',
      caption: 'Most Turkey eSIM plans install in under two minutes with a single QR code.',
    },
    city: {
      alt: 'Galata Bridge and Istanbul waterfront — a typical arrival area for tourists',
      caption: 'Reliable data helps on the metro, BiTaksi, and hotel check-in across Istanbul.',
    },
  },
  az: {
    travel: {
      alt: 'İstanbul silueti, Boğaz və arxada Qalata qülləsi',
      caption: 'İstanbulda (IST və ya SAW) enəndə xəritə, WhatsApp və BiTaksi üçün data hazır olsun.',
    },
    qr: {
      alt: 'iPhone-da QR kod skan edərək Türkiyə eSIM quraşdırılması',
      caption: 'Əksər Türkiyə eSIM planları tək QR kodla iki dəqiqədən az müddətdə quraşdırılır.',
    },
    city: {
      alt: 'Qalata körpüsü və İstanbul sahil xətti — turistlər üçün tipik varış zonası',
      caption: 'Stabil data metro, BiTaksi və İstanbul üzrə otel qeydiyyatında kömək edir.',
    },
  },
  ru: {
    travel: {
      alt: 'Панорама Стамбула, Босфор и Галатская башня на заднем плане',
      caption: 'Приземляйтесь в Стамбуле (IST или SAW) с готовым интернетом для карт, WhatsApp и BiTaksi.',
    },
    qr: {
      alt: 'Установка eSIM для Турции по QR-коду на iPhone',
      caption: 'Большинство тарифов для Турции устанавливаются менее чем за две минуты по одному QR-коду.',
    },
    city: {
      alt: 'Галатский мост и набережная Стамбула — типичная зона прибытия туристов',
      caption: 'Стабильный интернет помогает в метро, BiTaksi и при заселении в отель по Стамбулу.',
    },
  },
  tr: {
    travel: {
      alt: 'Galata Kulesi ve Boğaz ile İstanbul silueti',
      caption: 'İstanbul’a (IST veya SAW) inişte harita, WhatsApp ve BiTaksi için veriniz hazır olsun.',
    },
    qr: {
      alt: 'iPhone’da QR kod ile Türkiye eSIM kurulumu',
      caption: 'Çoğu Türkiye eSIM planı tek QR kodla iki dakikadan kısa sürede kurulur.',
    },
    city: {
      alt: 'Galata Köprüsü ve İstanbul sahil şeridi — turistler için tipik varış bölgesi',
      caption: 'Kararlı veri metro, BiTaksi ve İstanbul genelinde otele girişte işinize yarar.',
    },
  },
  ar: {
    travel: {
      alt: 'أفق إسطنبول والبوسفور مع برج غالطة في الخلفية',
      caption: 'اهبط في إسطنبول (IST أو SAW) وبياناتك جاهزة للخرائط وواتساب وBiTaksi.',
    },
    qr: {
      alt: 'تثبيت eSIM تركيا بمسح رمز QR على iPhone',
      caption: 'معظم خطط eSIM تركيا تُثبَّت في أقل من دقيقتين برمز QR واحد.',
    },
    city: {
      alt: 'جسر غالطة وواجهة إسطبول البحرية — منطقة وصول شائعة للسياح',
      caption: 'بيانات مستقرة تساعد في المترو وBiTaksi وتسجيل الفندق في إسطنبول.',
    },
  },
  es: {
    travel: {
      alt: 'Horizonte de Estambul y el Bósforo con la Torre de Gálata al fondo',
      caption: 'Aterriza en Estambul (IST o SAW) con datos listos para mapas, WhatsApp y BiTaksi.',
    },
    qr: {
      alt: 'Instalación de eSIM de Turquía escaneando un código QR en iPhone',
      caption: 'La mayoría de los planes eSIM para Turquía se instalan en menos de dos minutos con un QR.',
    },
    city: {
      alt: 'Puente de Gálata y el paseo marítimo de Estambul',
      caption: 'Datos fiables ayudan en el metro, BiTaksi y el check-in del hotel en Estambul.',
    },
  },
  zh: {
    travel: {
      alt: '伊斯坦布尔天际线、博斯普鲁斯海峡与远处的加拉塔塔',
      caption: '抵达伊斯坦布尔（IST 或 SAW）时，地图、WhatsApp 和 BiTaksi 即可使用。',
    },
    qr: {
      alt: '在 iPhone 上扫描二维码安装土耳其 eSIM',
      caption: '多数土耳其 eSIM 套餐通过一个二维码可在两分钟内完成安装。',
    },
    city: {
      alt: '加拉塔大桥与伊斯坦布尔海滨——游客常见的抵达区域',
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
