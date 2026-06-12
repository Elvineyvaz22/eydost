import { useEffect, useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, Globe2, Laptop, Loader2, LogOut, MapPin, Package, Smartphone, TrendingUp, Users, Wallet } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import Seo from '../../components/Seo';

type Agent = {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  referral_code: string | null;
  commission_rate: number;
  status: string;
};

type Referral = {
  id: string;
  customer_name: string | null;
  customer_contact: string | null;
  product_type: string;
  order_reference: string | null;
  sale_amount: number;
  commission_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
};

type Totals = {
  leads: number;
  conversions?: number;
  sales: number;
  commission: number;
  paid: number;
};

const agentLanguages = ['en', 'az', 'tr', 'ru', 'ar', 'es', 'zh'] as const;
type AgentLanguage = (typeof agentLanguages)[number];

const dashboardCopy = {
  en: {
    agentPanel: 'Agent panel',
    logout: 'Log out',
    loading: 'Loading...',
    dashboardError: 'Dashboard could not be loaded',
    panelServerError: 'Panel server error',
    activeAgent: 'Active agent',
    awaitingApproval: 'Awaiting approval',
    welcome: 'Welcome',
    intro: 'Share your referral link and track WhatsApp clicks, conversions, and commission from this dashboard.',
    commissionRate: 'Commission rate',
    conversionRate: 'Conversion rate',
    code: 'Code',
    notCreated: 'Not created yet',
    linkActive: 'Link is active',
    referralLink: 'Referral link',
    copy: 'Copy',
    open: 'Open',
    approvalNotice: 'Your referral code will appear here after it is approved in the backend/admin panel.',
    lead: 'Views',
    conversions: 'Conversions',
    salesAmount: 'Sales amount',
    commission: 'Commission',
    recentTitle: 'Recent leads and sales',
    recentSubtitle: 'Clicks, viewed packages, and payment status.',
    records: 'records',
    empty: 'No leads or sales yet. WhatsApp clicks and sales will appear here after your referral code becomes active.',
    noCustomer: 'No customer details',
    viewedPackage: 'Viewed package',
    noPackage: 'No package details',
    source: 'Source',
    medium: 'Medium',
    campaign: 'Campaign',
    sale: 'Sale',
    order: 'Order',
    topCountries: 'Top viewed countries',
    topPackages: 'Top viewed packages',
    soldCountries: 'Sold countries',
    soldPackages: 'Sold packages',
    lastSevenDays: 'Last 7 days activity',
    country: 'Country',
    packageCode: 'Package',
    orders: 'Views',
    noAnalytics: 'No analytics yet',
    dataNoticeTitle: 'What this panel shows',
    dataNoticeText: 'Sales cards use completed affiliate purchases. Traffic cards use referral link clicks and viewed packages.',
    dateLocale: 'en-US',
  },
  az: {
    agentPanel: 'Agent panel',
    logout: 'Çıxış',
    loading: 'Yüklənir...',
    dashboardError: 'Panel yüklənmədi',
    panelServerError: 'Panel server xətası',
    activeAgent: 'Aktiv agent',
    awaitingApproval: 'Təsdiq gözləyir',
    welcome: 'Salam',
    intro: 'Referral linkinizi paylaşın, WhatsApp kliklərini, satışları və komissiyanı bu paneldən izləyin.',
    commissionRate: 'Komissiya faizi',
    conversionRate: 'Konversiya',
    code: 'Kod',
    notCreated: 'Hələ yaradılmayıb',
    linkActive: 'Link aktivdir',
    referralLink: 'Referral link',
    copy: 'Kopyala',
    open: 'Aç',
    approvalNotice: 'Referral kodunuz backend/admin paneldə təsdiqlənəndən sonra burada görünəcək.',
    lead: 'Baxışlar',
    conversions: 'Satış sayı',
    salesAmount: 'Satış məbləği',
    commission: 'Komissiya',
    recentTitle: 'Son lead və satışlar',
    recentSubtitle: 'Kliklər, baxılan paketlər və ödəniş statusları.',
    records: 'qeyd',
    empty: 'Hələ lead və satış yoxdur. Referral kod aktiv olandan sonra WhatsApp klikləri və satışlar burada görünəcək.',
    noCustomer: 'Müştəri məlumatı yoxdur',
    viewedPackage: 'Baxdığı paket',
    noPackage: 'Paket məlumatı yoxdur',
    source: 'Mənbə',
    medium: 'Medium',
    campaign: 'Campaign',
    sale: 'Satış',
    order: 'Order',
    topCountries: 'Ən çox baxılan ölkələr',
    topPackages: 'Ən çox baxılan paketlər',
    soldCountries: 'Satılan ölkələr',
    soldPackages: 'Satılan paketlər',
    lastSevenDays: 'Son 7 gündə aktivlik',
    country: 'Ölkə',
    packageCode: 'Paket',
    orders: 'Baxışlar',
    noAnalytics: 'Hələ analitika yoxdur',
    dataNoticeTitle: 'Paneldə nə göstərilir',
    dataNoticeText: 'Satış kartları tamamlanmış affiliate alışlarından götürülür. Trafik kartları referral link klikləri və baxılan paketlər əsasında göstərilir.',
    dateLocale: 'az-AZ',
  },
  tr: {
    agentPanel: 'Agent paneli',
    logout: 'Çıkış',
    loading: 'Yükleniyor...',
    dashboardError: 'Panel yüklenemedi',
    panelServerError: 'Panel sunucu hatası',
    activeAgent: 'Aktif agent',
    awaitingApproval: 'Onay bekliyor',
    welcome: 'Merhaba',
    intro: 'Referral linkinizi paylaşın; WhatsApp tıklamalarını, satışları ve komisyonu bu panelden takip edin.',
    commissionRate: 'Komisyon oranı',
    conversionRate: 'Dönüşüm oranı',
    code: 'Kod',
    notCreated: 'Henüz oluşturulmadı',
    linkActive: 'Link aktif',
    referralLink: 'Referral link',
    copy: 'Kopyala',
    open: 'Aç',
    approvalNotice: 'Referral kodunuz backend/admin panelde onaylandıktan sonra burada görünecek.',
    lead: 'Görüntüleme',
    conversions: 'Satış sayısı',
    salesAmount: 'Satış tutarı',
    commission: 'Komisyon',
    recentTitle: 'Son lead ve satışlar',
    recentSubtitle: 'Tıklamalar, görüntülenen paketler ve ödeme durumu.',
    records: 'kayıt',
    empty: 'Henüz lead veya satış yok. Referral kod aktif olduktan sonra WhatsApp tıklamaları ve satışlar burada görünecek.',
    noCustomer: 'Müşteri bilgisi yok',
    viewedPackage: 'Görüntülenen paket',
    noPackage: 'Paket bilgisi yok',
    source: 'Kaynak',
    medium: 'Medium',
    campaign: 'Campaign',
    sale: 'Satış',
    order: 'Order',
    topCountries: 'En çok görüntülenen ülkeler',
    topPackages: 'En çok görüntülenen paketler',
    soldCountries: 'Satılan ülkeler',
    soldPackages: 'Satılan paketler',
    lastSevenDays: 'Son 7 gün aktivite',
    country: 'Ülke',
    packageCode: 'Paket',
    orders: 'Görüntüleme',
    noAnalytics: 'Henüz analitik yok',
    dataNoticeTitle: 'Panel neyi gösterir',
    dataNoticeText: 'Satış kartları tamamlanan affiliate satın almalarından alınır. Trafik kartları referral link tıklamaları ve görüntülenen paketlere göre gösterilir.',
    dateLocale: 'tr-TR',
  },
  ru: {
    agentPanel: 'Панель агента',
    logout: 'Выйти',
    loading: 'Загрузка...',
    dashboardError: 'Не удалось загрузить панель',
    panelServerError: 'Ошибка сервера панели',
    activeAgent: 'Активный агент',
    awaitingApproval: 'Ожидает подтверждения',
    welcome: 'Здравствуйте',
    intro: 'Делитесь реферальной ссылкой и отслеживайте WhatsApp-клики, продажи и комиссию в этой панели.',
    commissionRate: 'Ставка комиссии',
    conversionRate: 'Конверсия',
    code: 'Код',
    notCreated: 'Еще не создан',
    linkActive: 'Ссылка активна',
    referralLink: 'Реферальная ссылка',
    copy: 'Копировать',
    open: 'Открыть',
    approvalNotice: 'Ваш реферальный код появится здесь после подтверждения в backend/admin панели.',
    lead: 'Просмотры',
    conversions: 'Продажи',
    salesAmount: 'Сумма продаж',
    commission: 'Комиссия',
    recentTitle: 'Последние лиды и продажи',
    recentSubtitle: 'Клики, просмотренные пакеты и статус оплаты.',
    records: 'записей',
    empty: 'Лидов и продаж пока нет. WhatsApp-клики и продажи появятся здесь после активации реферального кода.',
    noCustomer: 'Нет данных клиента',
    viewedPackage: 'Просмотренный пакет',
    noPackage: 'Нет данных пакета',
    source: 'Источник',
    medium: 'Medium',
    campaign: 'Campaign',
    sale: 'Продажа',
    order: 'Order',
    topCountries: 'Самые просматриваемые страны',
    topPackages: 'Самые просматриваемые пакеты',
    soldCountries: 'Проданные страны',
    soldPackages: 'Проданные пакеты',
    lastSevenDays: 'Активность за 7 дней',
    country: 'Страна',
    packageCode: 'Пакет',
    orders: 'Просмотры',
    noAnalytics: 'Пока нет аналитики',
    dataNoticeTitle: 'Что показывает панель',
    dataNoticeText: 'Карточки продаж берутся из завершенных affiliate-покупок. Карточки трафика основаны на кликах по реферальной ссылке и просмотренных пакетах.',
    dateLocale: 'ru-RU',
  },
  ar: {
    agentPanel: 'لوحة الوكيل',
    logout: 'تسجيل الخروج',
    loading: 'جار التحميل...',
    dashboardError: 'تعذر تحميل اللوحة',
    panelServerError: 'خطأ في خادم اللوحة',
    activeAgent: 'وكيل نشط',
    awaitingApproval: 'بانتظار الموافقة',
    welcome: 'مرحبا',
    intro: 'شارك رابط الإحالة وتابع نقرات WhatsApp والمبيعات والعمولة من هذه اللوحة.',
    commissionRate: 'نسبة العمولة',
    conversionRate: 'معدل التحويل',
    code: 'الكود',
    notCreated: 'لم يتم إنشاؤه بعد',
    linkActive: 'الرابط نشط',
    referralLink: 'رابط الإحالة',
    copy: 'نسخ',
    open: 'فتح',
    approvalNotice: 'سيظهر كود الإحالة هنا بعد اعتماده في لوحة الإدارة.',
    lead: 'المشاهدات',
    conversions: 'عدد المبيعات',
    salesAmount: 'قيمة المبيعات',
    commission: 'العمولة',
    recentTitle: 'أحدث العملاء والمبيعات',
    recentSubtitle: 'النقرات، الباقات التي تمت مشاهدتها، وحالة الدفع.',
    records: 'سجل',
    empty: 'لا توجد عملاء أو مبيعات بعد. ستظهر نقرات WhatsApp والمبيعات هنا بعد تفعيل كود الإحالة.',
    noCustomer: 'لا توجد بيانات للعميل',
    viewedPackage: 'الباقة المعروضة',
    noPackage: 'لا توجد بيانات للباقة',
    source: 'المصدر',
    medium: 'Medium',
    campaign: 'Campaign',
    sale: 'بيع',
    order: 'Order',
    topCountries: 'الدول الأكثر مشاهدة',
    topPackages: 'الباقات الأكثر مشاهدة',
    soldCountries: 'الدول المباعة',
    soldPackages: 'الباقات المباعة',
    lastSevenDays: 'نشاط آخر 7 أيام',
    country: 'الدولة',
    packageCode: 'الباقة',
    orders: 'المشاهدات',
    noAnalytics: 'لا توجد تحليلات بعد',
    dataNoticeTitle: 'ما الذي تعرضه اللوحة',
    dataNoticeText: 'بطاقات المبيعات تعتمد على مشتريات affiliate المكتملة. بطاقات الزيارات تعتمد على نقرات رابط الإحالة والباقات التي تمت مشاهدتها.',
    dateLocale: 'ar',
  },
  es: {
    agentPanel: 'Panel de agente',
    logout: 'Salir',
    loading: 'Cargando...',
    dashboardError: 'No se pudo cargar el panel',
    panelServerError: 'Error del servidor del panel',
    activeAgent: 'Agente activo',
    awaitingApproval: 'Pendiente de aprobación',
    welcome: 'Bienvenido',
    intro: 'Comparte tu enlace de referido y sigue los clics de WhatsApp, ventas y comisión desde este panel.',
    commissionRate: 'Tasa de comisión',
    conversionRate: 'Conversión',
    code: 'Código',
    notCreated: 'Aún no creado',
    linkActive: 'El enlace está activo',
    referralLink: 'Enlace de referido',
    copy: 'Copiar',
    open: 'Abrir',
    approvalNotice: 'Tu código de referido aparecerá aquí después de ser aprobado en el panel admin/backend.',
    lead: 'Vistas',
    conversions: 'Ventas',
    salesAmount: 'Importe de ventas',
    commission: 'Comisión',
    recentTitle: 'Leads y ventas recientes',
    recentSubtitle: 'Clics, paquetes vistos y estado de pago.',
    records: 'registros',
    empty: 'Aún no hay leads ni ventas. Los clics de WhatsApp y las ventas aparecerán aquí cuando tu código esté activo.',
    noCustomer: 'Sin datos del cliente',
    viewedPackage: 'Paquete visto',
    noPackage: 'Sin datos del paquete',
    source: 'Fuente',
    medium: 'Medium',
    campaign: 'Campaign',
    sale: 'Venta',
    order: 'Order',
    topCountries: 'Países más vistos',
    topPackages: 'Paquetes más vistos',
    soldCountries: 'Países vendidos',
    soldPackages: 'Paquetes vendidos',
    lastSevenDays: 'Actividad de 7 días',
    country: 'País',
    packageCode: 'Paquete',
    orders: 'Vistas',
    noAnalytics: 'Aún no hay analítica',
    dataNoticeTitle: 'Qué muestra este panel',
    dataNoticeText: 'Las tarjetas de ventas usan compras affiliate completadas. Las tarjetas de tráfico usan clics del enlace de referido y paquetes vistos.',
    dateLocale: 'es-ES',
  },
  zh: {
    agentPanel: '代理面板',
    logout: '退出',
    loading: '加载中...',
    dashboardError: '无法加载面板',
    panelServerError: '面板服务器错误',
    activeAgent: '代理已启用',
    awaitingApproval: '等待审核',
    welcome: '欢迎',
    intro: '分享您的推荐链接，并在此面板跟踪 WhatsApp 点击、销售和佣金。',
    commissionRate: '佣金比例',
    conversionRate: '转化率',
    code: '代码',
    notCreated: '尚未创建',
    linkActive: '链接已启用',
    referralLink: '推荐链接',
    copy: '复制',
    open: '打开',
    approvalNotice: '推荐代码在后台/admin 面板审核后会显示在这里。',
    lead: '浏览',
    conversions: '销售数',
    salesAmount: '销售金额',
    commission: '佣金',
    recentTitle: '最新线索和销售',
    recentSubtitle: '点击、查看的套餐和付款状态。',
    records: '条记录',
    empty: '暂无线索或销售。推荐代码启用后，WhatsApp 点击和销售会显示在这里。',
    noCustomer: '无客户信息',
    viewedPackage: '查看的套餐',
    noPackage: '无套餐信息',
    source: '来源',
    medium: 'Medium',
    campaign: 'Campaign',
    sale: '销售',
    order: 'Order',
    topCountries: '浏览最多的国家',
    topPackages: '浏览最多的套餐',
    soldCountries: '已售国家',
    soldPackages: '已售套餐',
    lastSevenDays: '最近 7 天活动',
    country: '国家',
    packageCode: '套餐',
    orders: '浏览',
    noAnalytics: '暂无分析数据',
    dataNoticeTitle: '此面板显示什么',
    dataNoticeText: '销售卡片来自已完成的 affiliate 购买。流量卡片来自推荐链接点击和已浏览套餐。',
    dateLocale: 'zh-CN',
  },
} satisfies Record<AgentLanguage, Record<string, string>>;

function money(value: number): string {
  return `$${Number(value || 0).toFixed(2)}`;
}

function parseLeadNotes(notes: string | null) {
  const result: Record<string, string> = {};
  if (!notes) return result;

  notes.split('\n').forEach((line) => {
    const index = line.indexOf(':');
    if (index === -1) return;
    const key = line.slice(0, index).trim().toLowerCase();
    const value = line.slice(index + 1).trim();
    if (key && value) result[key] = value;
  });

  return result;
}

function pickFromNotes(notes: string | null, keys: string[]) {
  const data = parseLeadNotes(notes);
  for (const key of keys) {
    const value = data[key.toLowerCase()];
    if (value) return value;
  }
  return '';
}

function countTop(items: string[], limit = 8) {
  const counts = new Map<string, number>();
  items
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildLastSevenDays(referrals: Referral[]) {
  const counts = new Map<string, number>();
  referrals.forEach((row) => {
    const key = isoDate(new Date(row.created_at));
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = isoDate(date);
    return { label: key, value: counts.get(key) || 0 };
  });
}

function AnalyticsCard({
  title,
  leftLabel,
  rightLabel,
  items,
}: {
  title: string;
  leftLabel: string;
  rightLabel: string;
  items: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
      </div>
      <div className="mb-2 grid grid-cols-[1fr_80px] gap-3 text-xs font-black uppercase text-slate-400">
        <span>{leftLabel}</span>
        <span className="text-right">{rightLabel}</span>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">-</div>
        ) : (
          items.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="truncate text-sm font-bold text-slate-800">{item.label}</span>
                <span className="shrink-0 text-sm font-black text-slate-950">{item.value}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-600 to-orange-400"
                  style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LastSevenDaysCard({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-5 text-lg font-black text-slate-950">{title}</h3>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-500">
              <span>{item.label}</span>
              <span className="font-black text-slate-900">{item.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-700 via-emerald-600 to-orange-400"
                style={{ width: item.value === 0 ? '0%' : `${Math.max(8, (item.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadDetails({ notes, t }: { notes: string | null; t: typeof dashboardCopy.en }) {
  const data = parseLeadNotes(notes);
  const packageText =
    data['viewed package'] ||
    data['package'] ||
    data['package code'] ||
    data['baxdığı paket'] ||
    data['baxdigi paket'] ||
    data['paket'] ||
    data['paket kodu'] ||
    t.noPackage;
  const device = data['device'] || data['cihaz'];
  const geo = data['geo'] || data['təxmini ölkə/şəhər'] || data['texmini olke/seher'];
  const page = data['page'] || data['səhifə'] || data['sehife'];
  const language = data['language'] || data['brauzer dili'];
  const source = data['source'] || data['utm source'] || data['mənbə'];
  const medium = data['medium'] || data['utm medium'];
  const campaign = data['campaign'] || data['utm campaign'];
  const orderReference = data['order reference'] || data['order_id'] || data['transaction id'] || data['provider order no'];

  return (
    <div className="min-w-0">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
        <div className="flex gap-2">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase text-slate-400">{t.viewedPackage}</div>
            <div className="break-words text-sm font-bold leading-snug text-slate-900">{packageText}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {orderReference && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <Package className="w-3.5 h-3.5" />
              {orderReference}
            </span>
          )}
          {device && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {device === 'mobile' ? <Smartphone className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
              {device}
            </span>
          )}
          {geo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <MapPin className="w-3.5 h-3.5" />
              {geo}
            </span>
          )}
          {language && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <Globe2 className="w-3.5 h-3.5" />
              {language}
            </span>
          )}
          {page && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <ExternalLink className="w-3.5 h-3.5" />
              {page}
            </span>
          )}
          {source && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <Globe2 className="w-3.5 h-3.5" />
              {t.source}: {source}
            </span>
          )}
          {medium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <Globe2 className="w-3.5 h-3.5" />
              {t.medium}: {medium}
            </span>
          )}
          {campaign && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              <Globe2 className="w-3.5 h-3.5" />
              {t.campaign}: {campaign}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function statusStyle(status: string) {
  switch (status) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'confirmed':
      return 'bg-blue-50 text-blue-700 ring-blue-200';
    case 'cancelled':
      return 'bg-red-50 text-red-700 ring-red-200';
    default:
      return 'bg-amber-50 text-amber-700 ring-amber-200';
  }
}

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<AgentLanguage>(() =>
    agentLanguages.includes(localStorage.getItem('eydost_agent_language') as AgentLanguage)
      ? (localStorage.getItem('eydost_agent_language') as AgentLanguage)
      : 'en'
  );
  const [agent, setAgent] = useState<Agent | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [totals, setTotals] = useState<Totals>({ leads: 0, sales: 0, commission: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const rawSession = localStorage.getItem('eydost_agent_session');
  const t = dashboardCopy[language];

  const changeLanguage = (nextLanguage: AgentLanguage) => {
    setLanguage(nextLanguage);
    localStorage.setItem('eydost_agent_language', nextLanguage);
  };

  const load = async () => {
    if (!rawSession) {
      setLoading(false);
      return;
    }

    try {
      const session = JSON.parse(rawSession);
      if (!session?.agentToken) {
        localStorage.removeItem('eydost_agent_session');
        navigate('/agent/login', { replace: true });
        return;
      }

      const response = await fetch('/api/agent-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentToken: session.agentToken }),
      });
      const responseText = await response.text();
      let payload: any = {};
      try {
        payload = responseText ? JSON.parse(responseText) : {};
      } catch {
        payload = { error: responseText || t.panelServerError };
      }
      if (!response.ok) throw new Error(payload.error || t.dashboardError);

      setAgent(payload.agent);
      setReferrals(payload.referrals || []);
      setTotals(payload.totals || { leads: 0, sales: 0, commission: 0, paid: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.dashboardError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [rawSession]);

  if (!rawSession) return <Navigate to="/agent/login" replace />;

  const logout = () => {
    localStorage.removeItem('eydost_agent_session');
    navigate('/agent/login');
  };

  const copyReferral = async () => {
    if (!agent?.referral_code) return;
    await navigator.clipboard.writeText(`https://eydost.com/esim?ref=${agent.referral_code}`);
  };

  const referralLink = agent?.referral_code ? `https://eydost.com/esim?ref=${agent.referral_code}` : '';
  const paidReferrals = referrals.filter((item) => item.status === 'paid');
  const trafficReferrals = referrals.filter((item) => item.status !== 'paid');
  const topCountries = countTop(
    trafficReferrals.map((row) =>
      pickFromNotes(row.notes, ['country', 'country code', 'olkə', 'olke', 'ölkə', 'geo'])
        .split('/')
        .map((part) => part.trim())
        .find(Boolean) || ''
    ),
    7
  );
  const topPackages = countTop(
    trafficReferrals.map((row) => pickFromNotes(row.notes, ['package code', 'package', 'viewed package', 'paket kodu', 'paket'])),
    10
  );
  const topSoldCountries = countTop(
    paidReferrals.map((row) =>
      pickFromNotes(row.notes, ['country', 'country code', 'olkə', 'olke', 'ölkə', 'geo'])
        .split('/')
        .map((part) => part.trim())
        .find(Boolean) || ''
    ),
    7
  );
  const topSoldPackages = countTop(
    paidReferrals.map((row) => pickFromNotes(row.notes, ['package', 'package code', 'viewed package', 'paket kodu', 'paket'])),
    10
  );
  const lastSevenDays = buildLastSevenDays(referrals);

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <Seo title="Agent Dashboard" noIndex canonicalPath="/agent/dashboard" />
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="text-lg font-black text-slate-950">Ey Dost Agent</div>
            <div className="truncate text-sm text-slate-500">{agent?.company_name || t.agentPanel}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap rounded-2xl bg-slate-100 p-1 text-xs font-black text-slate-600">
              {agentLanguages.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeLanguage(item)}
                  className={`rounded-xl px-2.5 py-2 uppercase transition ${language === item ? 'bg-white text-slate-950 shadow-sm' : 'hover:text-slate-950'}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <button onClick={logout} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-100 px-4 font-bold text-slate-700 transition hover:bg-slate-200">
              <LogOut className="w-4 h-4" />
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            {t.loading}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-5 font-semibold text-red-700">{error}</div>
        ) : agent ? (
          <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black text-white">
                    {(agent.full_name || agent.company_name || 'A').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-base font-black text-slate-950">{agent.full_name}</div>
                    <div className="truncate text-sm font-semibold text-slate-500">{agent.company_name || agent.email}</div>
                  </div>
                </div>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                  <span className={`h-2 w-2 rounded-full ${agent.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {agent.status === 'active' ? t.activeAgent : t.awaitingApproval}
                </div>
                <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                  {[
                    ['Overview', t.salesAmount],
                    ['Traffic', t.topPackages],
                    ['Payouts', t.commission],
                    ['Assets', t.referralLink],
                  ].map(([label, value], index) => (
                    <div
                      key={label}
                      className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-bold ${
                        index === 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{label}</span>
                      <span className="text-xs text-slate-400">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-xs font-black uppercase text-slate-400">{t.commission}</div>
                <div className="mt-2 text-3xl font-black text-slate-950">{money(totals.commission)}</div>
                <div className="mt-1 text-sm font-semibold text-slate-500">{Number(agent.commission_rate || 0).toFixed(0)}% {t.commissionRate.toLowerCase()}</div>
                <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                  {t.conversions}: {totals.conversions || 0}
                </div>
              </section>
            </aside>

            <div className="space-y-5">
              <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="text-xs font-black uppercase tracking-wide text-blue-600">Partner dashboard</div>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{t.welcome}, {agent.full_name}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">{t.intro}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      { label: t.lead, value: totals.leads, icon: Users, tone: 'bg-orange-50 text-orange-700 ring-orange-100' },
                      { label: t.conversions, value: totals.conversions || 0, icon: TrendingUp, tone: 'bg-blue-50 text-blue-700 ring-blue-100' },
                      { label: t.salesAmount, value: money(totals.sales), icon: TrendingUp, tone: 'bg-slate-50 text-slate-700 ring-slate-100' },
                      { label: t.commission, value: money(totals.commission), icon: Wallet, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                          <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${item.tone}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="text-xs font-black uppercase text-slate-400">{item.label}</div>
                          <div className="mt-1 text-2xl font-black tracking-tight text-slate-950">{item.value}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-black uppercase text-slate-400">{t.code}</div>
                      <div className="mt-1 max-w-[220px] truncate text-2xl font-black text-slate-950">{agent.referral_code || t.notCreated}</div>
                    </div>
                    {agent.referral_code && (
                      <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t.linkActive}
                      </div>
                    )}
                  </div>
                  {agent.referral_code ? (
                    <div className="mt-5 flex h-[calc(100%-72px)] flex-col justify-between gap-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-bold uppercase text-slate-400">{t.referralLink}</div>
                        <div className="mt-2 break-all text-sm font-bold text-slate-900">{referralLink}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={copyReferral} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 font-black text-white transition hover:bg-blue-700">
                          <Copy className="w-4 h-4" />
                          {t.copy}
                        </button>
                        <a href={referralLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 font-black text-white transition hover:bg-slate-800">
                          {t.open}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
                      {t.approvalNotice}
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-blue-900 shadow-sm">
                <div className="text-sm font-black">{t.dataNoticeTitle}</div>
                <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-blue-800">{t.dataNoticeText}</p>
              </section>

              <section className="grid gap-4 xl:grid-cols-2">
                <AnalyticsCard title={t.soldCountries} leftLabel={t.country} rightLabel={t.conversions} items={topSoldCountries} />
                <AnalyticsCard title={t.soldPackages} leftLabel={t.packageCode} rightLabel={t.conversions} items={topSoldPackages} />
              </section>

              <section className="grid gap-4 xl:grid-cols-2">
                <AnalyticsCard title={t.topCountries} leftLabel={t.country} rightLabel={t.orders} items={topCountries} />
                <AnalyticsCard title={t.topPackages} leftLabel={t.packageCode} rightLabel={t.orders} items={topPackages} />
              </section>

              <LastSevenDaysCard title={t.lastSevenDays} items={lastSevenDays} />

            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

