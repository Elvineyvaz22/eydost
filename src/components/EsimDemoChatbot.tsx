import { FormEvent, useEffect, useMemo, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchPublicPackagesForCountry, formatGB, formatPrice, getCountryNameLocalized, type ESIMPackageRaw } from '../services/esimApi';
import { appendReferralToMessage } from '../utils/whatsapp';
import { useLanguage } from '../contexts/LanguageContext';

const WA_LINK = 'https://wa.me/994992010117';
const DEMO_ACTIVE_KEY = 'eydost_esim_chatbot_demo_active';
const DEMO_MESSAGES_KEY = 'eydost_esim_chatbot_demo_messages';
const DEMO_COUNTRY_KEY = 'eydost_esim_chatbot_demo_country';

type ChatMessage = {
  role: 'bot' | 'user';
  text: string;
  actions?: Array<{ label: string; value: string; kind: 'country' | 'package' | 'whatsapp' }>;
};

const COUNTRY_MATCHES: Array<{ code: string; slug: string; names: string[] }> = [
  { code: 'TR', slug: 'turkey-esim', names: ['turkey', 'turkiye', 'türkiye', 'turkiyə', 'turkiye', 'türkiyə', 'istanbul', 'antalya'] },
  { code: 'AZ', slug: 'azerbaijan-esim', names: ['azerbaijan', 'azərbaycan', 'azerbaycan', 'baku', 'baki', 'bakı'] },
  { code: 'US', slug: 'united-states-esim', names: ['usa', 'us', 'united states', 'america', 'amerika'] },
  { code: 'AE', slug: 'uae-esim', names: ['uae', 'dubai', 'abu dhabi', 'birləşmiş ərəb', 'emirates'] },
  { code: 'GE', slug: 'georgia-esim', names: ['georgia', 'gurcustan', 'gürcüstan', 'tbilisi'] },
  { code: 'DE', slug: 'germany-esim', names: ['germany', 'almaniya', 'deutschland'] },
  { code: 'FR', slug: 'france-esim', names: ['france', 'fransa', 'paris'] },
  { code: 'IT', slug: 'italy-esim', names: ['italy', 'italiya', 'rome', 'roma'] },
  { code: 'ES', slug: 'spain-esim', names: ['spain', 'ispaniya', 'barcelona', 'madrid'] },
  { code: 'GB', slug: 'uk-esim', names: ['uk', 'england', 'london', 'united kingdom', 'ingiltere', 'britain'] },
];

function initialMessages(): ChatMessage[] {
  return [
    {
      role: 'bot',
      text: 'Salam! Hansı ölkə üçün eSIM lazımdır? Məsələn: Türkiyə, Azərbaycan, ABŞ, Dubai.',
      actions: [
        { label: 'Türkiyə', value: 'TR', kind: 'country' },
        { label: 'Azərbaycan', value: 'AZ', kind: 'country' },
        { label: 'ABŞ', value: 'US', kind: 'country' },
      ],
    },
  ];
}

function loadMessages() {
  try {
    const raw = sessionStorage.getItem(DEMO_MESSAGES_KEY);
    return raw ? JSON.parse(raw) as ChatMessage[] : initialMessages();
  } catch {
    return initialMessages();
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(DEMO_MESSAGES_KEY, JSON.stringify(messages.slice(-20)));
  } catch {
    /* ignore */
  }
}

function detectCountry(input: string) {
  const text = input.toLowerCase();
  return COUNTRY_MATCHES.find(country => country.names.some(name => text.includes(name)));
}

function packageLabel(pkg: ESIMPackageRaw) {
  return `${pkg.name} • ${formatGB(pkg.volume)} • ${pkg.duration} gün • ${formatPrice(pkg.sell_price_minor, pkg.currencyCode)}`;
}

function pickDisplayPackages(packages: ESIMPackageRaw[]) {
  const seen = new Set<string>();
  return packages
    .filter(pkg => pkg.volume >= 1024 * 1024 * 1024 && pkg.sell_price_minor > 0)
    .sort((a, b) => a.sell_price_minor - b.sell_price_minor)
    .filter(pkg => {
      const key = `${pkg.volume}-${pkg.duration}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
}

function buildWhatsappMessage(countryName: string, pkg: ESIMPackageRaw, language: string) {
  return appendReferralToMessage(
    [
      'Salam! eSIM almaq istəyirəm.',
      `Ölkə: ${countryName}`,
      `Paket: ${formatGB(pkg.volume)} • ${pkg.duration} gün`,
      `Qiymət: ${formatPrice(pkg.sell_price_minor, pkg.currencyCode)}`,
      `Code: ${pkg.packageCode}`,
      `ID: ${pkg.slug}`,
      'Mənbə: chatbot demo',
    ].join('\n'),
    language
  );
}

export function activateEsimDemoChatbot() {
  sessionStorage.setItem(DEMO_ACTIVE_KEY, '1');
}

export default function EsimDemoChatbot() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const [active, setActive] = useState(() => sessionStorage.getItem(DEMO_ACTIVE_KEY) === '1');
  const [open, setOpen] = useState(() => sessionStorage.getItem(DEMO_ACTIVE_KEY) === '1');
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState(() => sessionStorage.getItem(DEMO_COUNTRY_KEY) || '');
  const [packages, setPackages] = useState<ESIMPackageRaw[]>([]);

  const countryName = useMemo(() => getCountryNameLocalized(countryCode, language), [countryCode, language]);

  useEffect(() => {
    const enabled = sessionStorage.getItem(DEMO_ACTIVE_KEY) === '1';
    setActive(enabled);
    if (enabled) setOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (!countryCode) return;
    setLoading(true);
    fetchPublicPackagesForCountry(countryCode)
      .then((items) => setPackages(pickDisplayPackages(items)))
      .finally(() => setLoading(false));
  }, [countryCode]);

  if (!active || location.pathname.startsWith('/admin') || location.pathname.startsWith('/agent')) return null;

  const push = (message: ChatMessage) => setMessages((current) => [...current, message]);

  const chooseCountry = async (code: string) => {
    const country = COUNTRY_MATCHES.find(item => item.code === code);
    if (!country) return;
    sessionStorage.setItem(DEMO_COUNTRY_KEY, country.code);
    setCountryCode(country.code);
    push({ role: 'bot', text: `${getCountryNameLocalized(country.code, language)} səhifəsini açıram. Paketləri orada göstərəcəyəm.` });
    navigate(`/${country.slug}`);
  };

  const choosePackage = (packageCode: string) => {
    const pkg = packages.find(item => item.packageCode === packageCode);
    if (!pkg) return;
    const text = buildWhatsappMessage(countryName || countryCode, pkg, language);
    const url = `${WA_LINK}?text=${encodeURIComponent(text)}`;
    push({
      role: 'bot',
      text: `${packageLabel(pkg)} seçildi. Sifarişi WhatsApp-da tamamlaya bilərsiniz.`,
      actions: [{ label: 'WhatsApp-da tamamla', value: url, kind: 'whatsapp' }],
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    push({ role: 'user', text });

    const country = detectCountry(text);
    if (country) {
      await chooseCountry(country.code);
      return;
    }

    if (countryCode && packages.length > 0) {
      push({
        role: 'bot',
        text: `${countryName} üçün uyğun paketlər:`,
        actions: packages.map(pkg => ({ label: packageLabel(pkg), value: pkg.packageCode, kind: 'package' as const })),
      });
      return;
    }

    push({ role: 'bot', text: 'Ölkə adını yazın, mən uyğun eSIM səhifəsini açım. Məsələn: Türkiyə üçün 7 günlük internet.' });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="flex h-[560px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
            <div>
              <div className="text-sm font-black">Ey Dost eSIM Demo</div>
              <div className="text-xs text-slate-300">Paket seçimi, final WhatsApp</div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Bağla">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {messages.map((message, index) => (
              <div key={index} className={message.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block max-w-[90%] rounded-2xl px-3 py-2 text-sm font-semibold leading-5 ${
                  message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 shadow-sm'
                }`}>
                  {message.text}
                </div>
                {message.actions && (
                  <div className="mt-2 grid gap-2">
                    {message.actions.map((action) => (
                      action.kind === 'whatsapp' ? (
                        <a key={action.value} href={action.value} className="rounded-xl bg-[#25D366] px-3 py-2 text-center text-sm font-black text-white">
                          {action.label}
                        </a>
                      ) : (
                        <button
                          key={action.value}
                          onClick={() => action.kind === 'country' ? chooseCountry(action.value) : choosePackage(action.value)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-bold text-slate-800 hover:border-blue-300 hover:bg-blue-50"
                        >
                          {action.label}
                        </button>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="text-xs font-semibold text-slate-500">Paketlər yüklənir...</div>}
          </div>
          {countryCode && packages.length > 0 && (
            <div className="border-t border-slate-100 bg-white p-3">
              <div className="mb-2 text-xs font-black uppercase text-slate-400">Təklif olunan paketlər</div>
              <div className="grid gap-2">
                {packages.slice(0, 3).map(pkg => (
                  <button key={pkg.packageCode} onClick={() => choosePackage(pkg.packageCode)} className="rounded-xl bg-slate-50 px-3 py-2 text-left text-xs font-bold text-slate-800 hover:bg-blue-50">
                    {packageLabel(pkg)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Məs: Türkiyə üçün 7 gün..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
            <button className="rounded-xl bg-blue-600 px-3 text-white" aria-label="Göndər">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl">
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
