/** UAE / Dubai — Unsplash IDs verified HTTP 200 */
const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&auto=format&fit=crop&q=80`;

export const UAE_ESIM_IMG = {
  /** Burj Khalifa & Downtown Dubai skyline */
  featured: U('1745750434535-5943ef2fd31a'),
  /** Dubai skyline at sunset — arrival / why eSIM */
  travel: U('1607414851776-f2fcc379fb48'),
  /** iPhone eSIM QR setup */
  qr: U('1695048133142-1a20484d2569'),
  /** Sheikh Zayed Road — Careem, maps, city travel */
  city: U('1512453979798-5ea266f8880c'),
} as const;

type Lang = 'en' | 'az' | 'ru' | 'tr' | 'ar' | 'es' | 'zh';

export const UAE_ESIM_IMAGE_TEXT: Record<
  Lang,
  {
    travel: { alt: string; caption: string };
    qr: { alt: string; caption: string };
    city: { alt: string; caption: string };
  }
> = {
  en: {
    travel: {
      alt: 'Dubai skyline at sunset with high-rise towers along the waterfront',
      caption: 'Land at DXB or DWC with data ready for maps, WhatsApp, and Careem.',
    },
    qr: {
      alt: 'Installing a UAE eSIM by scanning a QR code on iPhone',
      caption: 'Most UAE eSIM plans install in under two minutes with a single QR code.',
    },
    city: {
      alt: 'Sheikh Zayed Road and Dubai skyscrapers — main transport corridor',
      caption: 'Stable data powers Careem, metro navigation, and hotel check-in across Dubai.',
    },
  },
  az: {
    travel: {
      alt: 'Gün batımında Dubay silueti və sahil boyu yüksək binalar',
      caption: 'DXB və ya DWC-yə enəndə xəritə, WhatsApp və Careem üçün data hazır olsun.',
    },
    qr: {
      alt: 'iPhone-da QR kod skan edərək BƏƏ eSIM quraşdırılması',
      caption: 'Əksər BƏƏ eSIM planları tək QR kodla iki dəqiqədən az müddətdə quraşdırılır.',
    },
    city: {
      alt: 'Şeyx Zayed yolu və Dubay göydələnləri — əsas nəqliyyət dəhlizi',
      caption: 'Stabil data Careem, metro naviqasiyası və Dubay üzrə otel qeydiyyatında kömək edir.',
    },
  },
  ru: {
    travel: {
      alt: 'Панорама Дубая на закате с небоскрёбами у воды',
      caption: 'Приземляйтесь в DXB или DWC с готовым интернетом для карт, WhatsApp и Careem.',
    },
    qr: {
      alt: 'Установка eSIM для ОАЭ по QR-коду на iPhone',
      caption: 'Большинство тарифов для ОАЭ устанавливаются менее чем за две минуты по одному QR-коду.',
    },
    city: {
      alt: 'Шоссе Шейх Зайед и небоскрёбы Дубая',
      caption: 'Стабильный интернет для Careem, метро и регистрации в отеле по Дубаю.',
    },
  },
  tr: {
    travel: {
      alt: 'Gün batımında Dubay silueti ve sahil boyunca gökdelenler',
      caption: 'DXB veya DWC’ye inişte harita, WhatsApp ve Careem için veriniz hazır olsun.',
    },
    qr: {
      alt: 'iPhone’da QR kod ile BAE eSIM kurulumu',
      caption: 'Çoğu BAE eSIM planı tek QR kodla iki dakikadan kısa sürede kurulur.',
    },
    city: {
      alt: 'Şeyh Zayed Yolu ve Dubai gökdelenleri',
      caption: 'Kararlı veri Careem, metro ve Dubai genelinde otele girişte işinize yarar.',
    },
  },
  ar: {
    travel: {
      alt: 'أفق دبي عند الغروب مع أبراج على الواجهة البحرية',
      caption: 'اهبط في DXB أو DWC وبياناتك جاهزة للخرائط وواتساب وكريم.',
    },
    qr: {
      alt: 'تثبيت eSIM الإمارات بمسح رمز QR على iPhone',
      caption: 'معظم خطط eSIM الإمارات تُثبَّت في أقل من دقيقتين برمز QR واحد.',
    },
    city: {
      alt: 'طريق الشيخ زايد وأبراج دبي',
      caption: 'بيانات مستقرة لكريم والمترو وتسجيل الفندق في دبي.',
    },
  },
  es: {
    travel: {
      alt: 'Horizonte de Dubái al atardecer con rascacielos junto al agua',
      caption: 'Aterriza en DXB o DWC con datos listos para mapas, WhatsApp y Careem.',
    },
    qr: {
      alt: 'Instalación de eSIM de EAU escaneando un código QR en iPhone',
      caption: 'La mayoría de los planes eSIM para EAU se instalan en menos de dos minutos con un QR.',
    },
    city: {
      alt: 'Sheikh Zayed Road y rascacielos de Dubái',
      caption: 'Datos fiables para Careem, metro y check-in del hotel en Dubái.',
    },
  },
  zh: {
    travel: {
      alt: '日落时分的迪拜天际线与海滨高楼',
      caption: '抵达 DXB 或 DWC 时，地图、WhatsApp 和 Careem 即可使用。',
    },
    qr: {
      alt: '在 iPhone 上扫描二维码安装阿联酋 eSIM',
      caption: '多数阿联酋 eSIM 套餐通过一个二维码可在两分钟内完成安装。',
    },
    city: {
      alt: '迪拜谢赫扎耶德路与摩天大楼',
      caption: '稳定网络支持 Careem、地铁导航和迪拜酒店入住。',
    },
  },
};

export function uaeEsimSectionImages(lang: Lang) {
  const t = UAE_ESIM_IMAGE_TEXT[lang];
  return {
    travel: { src: UAE_ESIM_IMG.travel, ...t.travel },
    qr: { src: UAE_ESIM_IMG.qr, ...t.qr },
    city: { src: UAE_ESIM_IMG.city, ...t.city },
  };
}
