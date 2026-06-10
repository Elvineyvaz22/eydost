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
    lead: 'Lead',
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
    lead: 'Lead',
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
    lead: 'Lead',
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
    lead: 'Лиды',
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
    lead: 'Lead',
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
    lead: 'Lead',
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
    lead: '线索',
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
  const conversionRate = totals.leads > 0 ? Math.round((referrals.filter((item) => item.status === 'paid').length / totals.leads) * 100) : 0;

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
          <div className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="grid gap-5 xl:grid-cols-[1fr_420px] xl:items-stretch">
                <div className="min-w-0">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                    <span className={`h-2 w-2 rounded-full ${agent.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {agent.status === 'active' ? t.activeAgent : t.awaitingApproval}
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{t.welcome}, {agent.full_name}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                    {t.intro}
                  </p>
                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                      <div className="text-xs font-bold uppercase text-slate-400">{t.commissionRate}</div>
                      <div className="mt-1 text-2xl font-black text-slate-950">{Number(agent.commission_rate || 0).toFixed(0)}%</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                      <div className="text-xs font-bold uppercase text-slate-400">{t.conversionRate}</div>
                      <div className="mt-1 text-2xl font-black text-slate-950">{conversionRate}%</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                      <div className="text-xs font-bold uppercase text-slate-400">{t.code}</div>
                      <div className="mt-1 truncate text-xl font-black text-slate-950">{agent.referral_code || t.notCreated}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-slate-950 sm:p-5">
                  {agent.referral_code ? (
                    <div className="flex h-full flex-col justify-between gap-5">
                      <div>
                        <div className="mb-3 flex items-center gap-2 text-sm font-black text-emerald-700">
                          <CheckCircle2 className="h-5 w-5" />
                          {t.linkActive}
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-bold uppercase text-slate-400">{t.referralLink}</div>
                          <div className="mt-2 break-all text-sm font-bold text-slate-900">{referralLink}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={copyReferral} className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 font-black text-white transition hover:bg-blue-700">
                          <Copy className="w-4 h-4" />
                          {t.copy}
                        </button>
                        <a href={referralLink} target="_blank" rel="noopener noreferrer" className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 font-black text-white transition hover:bg-slate-800">
                          {t.open}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
                      {t.approvalNotice}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: t.lead, value: totals.leads, icon: Users, tone: 'bg-orange-50 text-orange-700 ring-orange-100' },
                { label: t.conversions, value: totals.conversions || 0, icon: TrendingUp, tone: 'bg-blue-50 text-blue-700 ring-blue-100' },
                { label: t.salesAmount, value: money(totals.sales), icon: TrendingUp, tone: 'bg-slate-50 text-slate-700 ring-slate-100' },
                { label: t.commission, value: money(totals.commission), icon: Wallet, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${item.tone}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-black uppercase text-slate-400">{item.label}</div>
                    <div className="mt-1 text-3xl font-black tracking-tight text-slate-950">{item.value}</div>
                  </div>
                );
              })}
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950">{t.recentTitle}</h2>
                  <p className="text-sm text-slate-500">{t.recentSubtitle}</p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                  {referrals.length} {t.records}
                </span>
              </div>
              {referrals.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  {t.empty}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {referrals.map((row) => (
                    <div key={row.id} className="grid gap-4 p-4 transition hover:bg-slate-50/80 lg:grid-cols-[120px_1fr_130px_130px] lg:items-center">
                      <div>
                        <div className="text-sm font-black text-slate-950">{new Date(row.created_at).toLocaleDateString(t.dateLocale)}</div>
                        <div className="mt-1 text-xs font-semibold uppercase text-slate-400">{row.product_type}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ring-1 ${statusStyle(row.status)}`}>
                            {row.status}
                          </span>
                          <span className="text-sm font-semibold text-slate-500">{row.customer_name || row.customer_contact || t.noCustomer}</span>
                        </div>
                        <div className="mb-2 flex flex-wrap gap-2">
                          {parseLeadNotes(row.notes)['source'] && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
                              {t.source}: {parseLeadNotes(row.notes)['source']}
                            </span>
                          )}
                          {parseLeadNotes(row.notes)['medium'] && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200">
                              {t.medium}: {parseLeadNotes(row.notes)['medium']}
                            </span>
                          )}
                          {parseLeadNotes(row.notes)['campaign'] && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 ring-1 ring-violet-200">
                              {t.campaign}: {parseLeadNotes(row.notes)['campaign']}
                            </span>
                          )}
                        </div>
                        <div className="max-w-3xl">
                          <LeadDetails notes={row.notes} t={t} />
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3 lg:text-right">
                        <div className="text-xs font-bold uppercase text-slate-400">{t.sale}</div>
                        <div className="text-lg font-black text-slate-950">{money(row.sale_amount)}</div>
                        {row.order_reference && (
                          <div className="mt-1 text-xs font-semibold text-slate-400">{t.order}: {row.order_reference}</div>
                        )}
                      </div>
                      <div className="rounded-2xl bg-emerald-50 p-3 lg:text-right">
                        <div className="text-xs font-bold uppercase text-emerald-600">{t.commission}</div>
                        <div className="text-lg font-black text-emerald-700">{money(row.commission_amount)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}

