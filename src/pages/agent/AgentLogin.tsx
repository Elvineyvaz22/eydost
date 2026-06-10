import { FormEvent, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Seo from '../../components/Seo';

function isStrongAccessCode(value: string) {
  return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value);
}

const agentLanguages = ['en', 'az', 'tr', 'ru', 'ar', 'es', 'zh'] as const;
type AgentLanguage = (typeof agentLanguages)[number];

const loginCopy = {
  en: {
    minimum: 'Minimum 8 characters',
    uppercase: 'At least 1 uppercase letter',
    number: 'At least 1 number',
    missingAgent: 'Agent details were not returned. Refresh the page and try again.',
    missingToken: 'Agent token was not returned. Please log in again after registration.',
    loginServerError: 'Login server error',
    loginFailed: 'Login failed',
    weakCode: 'Access code must be at least 8 characters and include 1 uppercase letter and 1 number',
    registrationServerError: 'Registration server error',
    registrationFailed: 'Registration failed',
    loginTitle: 'Agent dashboard login',
    registerTitle: 'Agent registration',
    loginSubtitle: 'Sign in with your email and access code.',
    registerSubtitle: 'Enter your details and create a strong access code. Your referral code becomes available after admin approval.',
    loginTab: 'Login',
    registerTab: 'Register',
    fullName: 'Full name',
    companyName: 'Company name',
    phone: 'Phone',
    email: 'Email',
    accessCode: 'Access code',
    createAccessCode: 'Create access code',
    hide: 'Hide',
    show: 'Show',
    signIn: 'Sign in',
    createAccount: 'Create account',
  },
  az: {
    minimum: 'Minimum 8 simvol',
    uppercase: 'Ən azı 1 böyük hərf',
    number: 'Ən azı 1 rəqəm',
    missingAgent: 'Agent məlumatı qayıtmadı. Səhifəni yeniləyib təkrar yoxlayın.',
    missingToken: 'Agent token qayıtmadı. Qeydiyyatdan sonra giriş bölməsindən təkrar daxil olun.',
    loginServerError: 'Giriş server xətası',
    loginFailed: 'Giriş alınmadı',
    weakCode: 'Giriş kodu minimum 8 simvol, 1 böyük hərf və 1 rəqəm olmalıdır',
    registrationServerError: 'Qeydiyyat server xətası',
    registrationFailed: 'Qeydiyyat alınmadı',
    loginTitle: 'Agent panelə giriş',
    registerTitle: 'Agent qeydiyyatı',
    loginSubtitle: 'Email və giriş kodu ilə daxil olun.',
    registerSubtitle: 'Məlumatlarınızı yazın və güclü giriş kodu yaradın. Referral kod admin təsdiqindən sonra aktiv olacaq.',
    loginTab: 'Giriş',
    registerTab: 'Qeydiyyat',
    fullName: 'Ad Soyad',
    companyName: 'Şirkət adı',
    phone: 'Telefon',
    email: 'Email',
    accessCode: 'Giriş kodu',
    createAccessCode: 'Giriş kodu yarat',
    hide: 'Gizlət',
    show: 'Göstər',
    signIn: 'Daxil ol',
    createAccount: 'Qeydiyyatdan keç',
  },
  tr: {
    minimum: 'Minimum 8 karakter',
    uppercase: 'En az 1 büyük harf',
    number: 'En az 1 rakam',
    missingAgent: 'Agent bilgisi dönmedi. Sayfayı yenileyip tekrar deneyin.',
    missingToken: 'Agent token dönmedi. Kayıttan sonra tekrar giriş yapın.',
    loginServerError: 'Giriş sunucu hatası',
    loginFailed: 'Giriş başarısız',
    weakCode: 'Giriş kodu en az 8 karakter, 1 büyük harf ve 1 rakam içermelidir',
    registrationServerError: 'Kayıt sunucu hatası',
    registrationFailed: 'Kayıt başarısız',
    loginTitle: 'Agent panel girişi',
    registerTitle: 'Agent kaydı',
    loginSubtitle: 'Email ve giriş kodu ile giriş yapın.',
    registerSubtitle: 'Bilgilerinizi girin ve güçlü bir giriş kodu oluşturun. Referral kod admin onayından sonra aktif olur.',
    loginTab: 'Giriş',
    registerTab: 'Kayıt',
    fullName: 'Ad Soyad',
    companyName: 'Şirket adı',
    phone: 'Telefon',
    email: 'Email',
    accessCode: 'Giriş kodu',
    createAccessCode: 'Giriş kodu oluştur',
    hide: 'Gizle',
    show: 'Göster',
    signIn: 'Giriş yap',
    createAccount: 'Hesap oluştur',
  },
  ru: {
    minimum: 'Минимум 8 символов',
    uppercase: 'Минимум 1 заглавная буква',
    number: 'Минимум 1 цифра',
    missingAgent: 'Данные агента не вернулись. Обновите страницу и попробуйте снова.',
    missingToken: 'Токен агента не вернулся. После регистрации войдите снова.',
    loginServerError: 'Ошибка сервера входа',
    loginFailed: 'Вход не выполнен',
    weakCode: 'Код доступа должен быть минимум 8 символов и содержать 1 заглавную букву и 1 цифру',
    registrationServerError: 'Ошибка сервера регистрации',
    registrationFailed: 'Регистрация не выполнена',
    loginTitle: 'Вход в панель агента',
    registerTitle: 'Регистрация агента',
    loginSubtitle: 'Войдите с email и кодом доступа.',
    registerSubtitle: 'Введите данные и создайте надежный код доступа. Реферальный код активируется после подтверждения администратором.',
    loginTab: 'Вход',
    registerTab: 'Регистрация',
    fullName: 'Имя и фамилия',
    companyName: 'Название компании',
    phone: 'Телефон',
    email: 'Email',
    accessCode: 'Код доступа',
    createAccessCode: 'Создать код доступа',
    hide: 'Скрыть',
    show: 'Показать',
    signIn: 'Войти',
    createAccount: 'Создать аккаунт',
  },
  ar: {
    minimum: '8 أحرف على الأقل',
    uppercase: 'حرف كبير واحد على الأقل',
    number: 'رقم واحد على الأقل',
    missingAgent: 'لم يتم إرجاع بيانات الوكيل. حدّث الصفحة وحاول مرة أخرى.',
    missingToken: 'لم يتم إرجاع رمز الوكيل. يرجى تسجيل الدخول مرة أخرى بعد التسجيل.',
    loginServerError: 'خطأ في خادم تسجيل الدخول',
    loginFailed: 'فشل تسجيل الدخول',
    weakCode: 'يجب أن يتكون كود الدخول من 8 أحرف على الأقل ويحتوي على حرف كبير ورقم واحد',
    registrationServerError: 'خطأ في خادم التسجيل',
    registrationFailed: 'فشل التسجيل',
    loginTitle: 'تسجيل الدخول إلى لوحة الوكيل',
    registerTitle: 'تسجيل وكيل',
    loginSubtitle: 'سجّل الدخول باستخدام البريد الإلكتروني وكود الدخول.',
    registerSubtitle: 'أدخل بياناتك وأنشئ كود دخول قوي. سيتم تفعيل كود الإحالة بعد موافقة الإدارة.',
    loginTab: 'دخول',
    registerTab: 'تسجيل',
    fullName: 'الاسم الكامل',
    companyName: 'اسم الشركة',
    phone: 'الهاتف',
    email: 'Email',
    accessCode: 'كود الدخول',
    createAccessCode: 'إنشاء كود الدخول',
    hide: 'إخفاء',
    show: 'إظهار',
    signIn: 'تسجيل الدخول',
    createAccount: 'إنشاء حساب',
  },
  es: {
    minimum: 'Mínimo 8 caracteres',
    uppercase: 'Al menos 1 letra mayúscula',
    number: 'Al menos 1 número',
    missingAgent: 'No se recibieron los datos del agente. Actualiza la página e inténtalo de nuevo.',
    missingToken: 'No se recibió el token del agente. Inicia sesión de nuevo después del registro.',
    loginServerError: 'Error del servidor de login',
    loginFailed: 'No se pudo iniciar sesión',
    weakCode: 'El código debe tener al menos 8 caracteres e incluir 1 letra mayúscula y 1 número',
    registrationServerError: 'Error del servidor de registro',
    registrationFailed: 'No se pudo completar el registro',
    loginTitle: 'Login del panel de agente',
    registerTitle: 'Registro de agente',
    loginSubtitle: 'Inicia sesión con tu email y código de acceso.',
    registerSubtitle: 'Introduce tus datos y crea un código seguro. El código de referido se activa después de la aprobación del administrador.',
    loginTab: 'Login',
    registerTab: 'Registro',
    fullName: 'Nombre completo',
    companyName: 'Empresa',
    phone: 'Teléfono',
    email: 'Email',
    accessCode: 'Código de acceso',
    createAccessCode: 'Crear código de acceso',
    hide: 'Ocultar',
    show: 'Mostrar',
    signIn: 'Entrar',
    createAccount: 'Crear cuenta',
  },
  zh: {
    minimum: '至少 8 个字符',
    uppercase: '至少 1 个大写字母',
    number: '至少 1 个数字',
    missingAgent: '未返回代理信息。请刷新页面后重试。',
    missingToken: '未返回代理 token。注册后请重新登录。',
    loginServerError: '登录服务器错误',
    loginFailed: '登录失败',
    weakCode: '访问代码至少需要 8 个字符，并包含 1 个大写字母和 1 个数字',
    registrationServerError: '注册服务器错误',
    registrationFailed: '注册失败',
    loginTitle: '代理面板登录',
    registerTitle: '代理注册',
    loginSubtitle: '使用邮箱和访问代码登录。',
    registerSubtitle: '填写信息并创建安全访问代码。推荐代码将在管理员审核后启用。',
    loginTab: '登录',
    registerTab: '注册',
    fullName: '姓名',
    companyName: '公司名称',
    phone: '电话',
    email: 'Email',
    accessCode: '访问代码',
    createAccessCode: '创建访问代码',
    hide: '隐藏',
    show: '显示',
    signIn: '登录',
    createAccount: '创建账号',
  },
} satisfies Record<AgentLanguage, Record<string, string>>;

export default function AgentLogin() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<AgentLanguage>(() =>
    agentLanguages.includes(localStorage.getItem('eydost_agent_language') as AgentLanguage)
      ? (localStorage.getItem('eydost_agent_language') as AgentLanguage)
      : 'en'
  );
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const t = loginCopy[language];

  const changeLanguage = (nextLanguage: AgentLanguage) => {
    setLanguage(nextLanguage);
    localStorage.setItem('eydost_agent_language', nextLanguage);
  };

  const accessCodeChecks = useMemo(
    () => [
      { label: t.minimum, ok: accessCode.length >= 8 },
      { label: t.uppercase, ok: /[A-Z]/.test(accessCode) },
      { label: t.number, ok: /\d/.test(accessCode) },
    ],
    [accessCode, t.minimum, t.uppercase, t.number]
  );

  const saveSession = (agent: { id?: string; email?: string } | null | undefined, code: string, agentToken?: string) => {
    if (!agent?.id || !agent?.email) {
      throw new Error(t.missingAgent);
    }
    if (!agentToken) {
      throw new Error(t.missingToken);
    }

    localStorage.setItem(
      'eydost_agent_session',
      JSON.stringify({ agentId: agent.id, accessCode: code, email: agent.email, agentToken })
    );
    navigate('/agent/dashboard');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/agent-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, accessCode }),
      });
      const responseText = await response.text();
      let payload: any = {};
      try {
        payload = responseText ? JSON.parse(responseText) : {};
      } catch {
        payload = { error: responseText || t.loginServerError };
      }
      if (!response.ok) throw new Error(payload.error || t.loginFailed);

      saveSession(payload.agent, accessCode, payload.agentToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  const register = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!isStrongAccessCode(accessCode)) {
      setError(t.weakCode);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/agent-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, companyName, phoneNumber, email, accessCode }),
      });
      const responseText = await response.text();
      let payload: any = {};
      try {
        payload = responseText ? JSON.parse(responseText) : {};
      } catch {
        payload = { error: responseText || t.registrationServerError };
      }
      if (!response.ok) throw new Error(payload.error || t.registrationFailed);

      saveSession(payload.agent, accessCode, payload.agentToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.registrationFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <Seo title="Agent Login" noIndex canonicalPath="/agent/login" />
      <form onSubmit={mode === 'login' ? submit : register} className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            {mode === 'login' ? <LockKeyhole className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <div className="flex flex-wrap justify-end rounded-xl bg-gray-100 p-1 text-xs font-black text-gray-500">
            {agentLanguages.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => changeLanguage(item)}
                className={`rounded-lg px-2.5 py-2 uppercase transition ${language === item ? 'bg-white text-gray-900 shadow-sm' : 'hover:text-gray-900'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'login' ? t.loginTitle : t.registerTitle}
        </h1>
        <p className="text-gray-600 mt-2 mb-6">
          {mode === 'login'
            ? t.loginSubtitle
            : t.registerSubtitle}
        </p>

        <div className="grid grid-cols-2 gap-2 mb-5 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-lg py-2 text-sm font-bold ${mode === 'login' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            {t.loginTab}
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`rounded-lg py-2 text-sm font-bold ${mode === 'register' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
          >
            {t.registerTab}
          </button>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm font-semibold">{error}</div>}

        {mode === 'register' && (
          <>
            <label className="block mb-4">
              <span className="text-sm font-bold text-gray-700">{t.fullName}</span>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
              />
            </label>
            <label className="block mb-4">
              <span className="text-sm font-bold text-gray-700">{t.companyName}</span>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
              />
            </label>
            <label className="block mb-4">
              <span className="text-sm font-bold text-gray-700">{t.phone}</span>
              <input
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+994..."
                className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
              />
            </label>
          </>
        )}

        <label className="block mb-4">
          <span className="text-sm font-bold text-gray-700">{t.email}</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm font-bold text-gray-700">
            {mode === 'login' ? t.accessCode : t.createAccessCode}
          </span>
          <div className="relative mt-2">
            <input
              required
              type={showAccessCode ? 'text' : 'password'}
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              minLength={mode === 'register' ? 8 : 1}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'register' ? t.minimum : undefined}
              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
            />
            <button
              type="button"
              onClick={() => setShowAccessCode((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
              aria-label={showAccessCode ? t.hide : t.show}
              title={showAccessCode ? t.hide : t.show}
            >
              {showAccessCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </label>

        {mode === 'register' && (
          <div className="mb-6 grid gap-1.5 text-xs font-semibold">
            {accessCodeChecks.map((item) => (
              <div key={item.label} className={item.ok ? 'text-emerald-700' : 'text-gray-500'}>
                {item.ok ? 'OK' : '-'} {item.label}
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 bg-orange-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {mode === 'login' ? t.signIn : t.createAccount}
        </button>
      </form>
    </div>
  );
}

