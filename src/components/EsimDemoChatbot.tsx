import { FormEvent, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const DEMO_ACTIVE_KEY = 'eydost_esim_chatbot_demo_active';
const DEMO_MESSAGES_KEY = 'eydost_esim_chatbot_demo_messages';
const DEMO_COUNTRY_KEY = 'eydost_esim_chatbot_demo_country';
const DEMO_VERSION_KEY = 'eydost_esim_chatbot_demo_version';
const DEMO_VERSION = 'openai-assistant-v1';

type ChatMessage = {
  role: 'bot' | 'user';
  text: string;
};

type CountryMatch = {
  code: string;
  slug: string;
  label: string;
  names: string[];
};

const COUNTRY_MATCHES: CountryMatch[] = [
  { code: 'TR', slug: 'turkey-esim', label: 'Turkiye', names: ['turkey', 'turkiye', 'türkiye', 'istanbul', 'antalya'] },
  { code: 'AZ', slug: 'azerbaijan-esim', label: 'Azerbaycan', names: ['azerbaijan', 'azerbaycan', 'azərbaycan', 'baku', 'baki', 'bakı'] },
  { code: 'US', slug: 'united-states-esim', label: 'ABŞ', names: ['usa', 'us', 'united states', 'america', 'amerika', 'abs', 'abş'] },
  { code: 'AE', slug: 'uae-esim', label: 'Dubai', names: ['uae', 'dubai', 'abu dhabi', 'emirates', 'birləşmiş ərəb', 'birləşmiş ereb'] },
  { code: 'GE', slug: 'georgia-esim', label: 'Gurcustan', names: ['georgia', 'gurcustan', 'gürcüstan', 'tbilisi'] },
  { code: 'DE', slug: 'germany-esim', label: 'Almaniya', names: ['germany', 'almaniya', 'deutschland'] },
  { code: 'FR', slug: 'france-esim', label: 'Fransa', names: ['france', 'fransa', 'paris'] },
  { code: 'IT', slug: 'italy-esim', label: 'Italiya', names: ['italy', 'italiya', 'rome', 'roma'] },
  { code: 'ES', slug: 'spain-esim', label: 'Ispaniya', names: ['spain', 'ispaniya', 'barcelona', 'madrid'] },
  { code: 'GB', slug: 'uk-esim', label: 'Ingiltere', names: ['uk', 'england', 'london', 'united kingdom', 'ingiltere', 'britain'] },
  { code: 'SA', slug: 'saudi-arabia-esim', label: 'Seudiyye', names: ['saudi', 'saudi arabia', 'seudiye', 'səudiyyə', 'riyadh', 'jeddah'] },
  { code: 'QA', slug: 'qatar-esim', label: 'Qatar', names: ['qatar', 'doha'] },
  { code: 'EG', slug: 'egypt-esim', label: 'Misir', names: ['egypt', 'misir', 'cairo', 'sharm'] },
  { code: 'TH', slug: 'thailand-esim', label: 'Tayland', names: ['thailand', 'tayland', 'bangkok', 'phuket'] },
  { code: 'JP', slug: 'japan-esim', label: 'Yaponiya', names: ['japan', 'yaponiya', 'tokyo'] },
  { code: 'CN', slug: 'china-esim', label: 'Cin', names: ['china', 'cin', 'çin', 'beijing', 'shanghai'] },
  { code: 'CA', slug: 'canada-esim', label: 'Kanada', names: ['canada', 'kanada', 'toronto'] },
  { code: 'MX', slug: 'mexico-esim', label: 'Meksika', names: ['mexico', 'meksika', 'cancun'] },
];

function initialMessages(): ChatMessage[] {
  return [
    {
      role: 'bot',
      text: 'Salam! Hansı ölkə üçün eSIM lazımdır? Ölkə adını yazın, uyğun səhifəni açım.',
    },
  ];
}

function normalizeInput(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c');
}

function detectCountry(input: string) {
  const typed = normalizeInput(input).trim();
  if (typed.length < 3) return undefined;

  return COUNTRY_MATCHES.find((country) =>
    country.names.some((name) => {
      const normalizedName = normalizeInput(name);
      return typed.includes(normalizedName) || normalizedName.startsWith(typed);
    })
  );
}

function loadMessages() {
  try {
    if (sessionStorage.getItem(DEMO_VERSION_KEY) !== DEMO_VERSION) return initialMessages();
    const raw = sessionStorage.getItem(DEMO_MESSAGES_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : initialMessages();
  } catch {
    return initialMessages();
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(DEMO_MESSAGES_KEY, JSON.stringify(messages.slice(-12)));
  } catch {
    /* ignore */
  }
}

export function activateEsimDemoChatbot() {
  sessionStorage.setItem(DEMO_ACTIVE_KEY, '1');
  if (sessionStorage.getItem(DEMO_VERSION_KEY) !== DEMO_VERSION) {
    sessionStorage.setItem(DEMO_VERSION_KEY, DEMO_VERSION);
    sessionStorage.removeItem(DEMO_MESSAGES_KEY);
    sessionStorage.removeItem(DEMO_COUNTRY_KEY);
  }
  window.dispatchEvent(new Event('eydost-esim-chatbot-activate'));
}

export default function EsimDemoChatbot() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(() => sessionStorage.getItem(DEMO_ACTIVE_KEY) === '1');
  const [open, setOpen] = useState(() => sessionStorage.getItem(DEMO_ACTIVE_KEY) === '1');
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const autoNavigatedCountry = useRef('');

  useEffect(() => {
    const handleActivate = () => {
      setActive(true);
      setOpen(true);
      setMessages(loadMessages());
    };
    window.addEventListener('eydost-esim-chatbot-activate', handleActivate);
    return () => window.removeEventListener('eydost-esim-chatbot-activate', handleActivate);
  }, []);

  useEffect(() => {
    const enabled = sessionStorage.getItem(DEMO_ACTIVE_KEY) === '1';
    setActive(enabled);
    if (enabled) setOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  if (!active || location.pathname.startsWith('/admin') || location.pathname.startsWith('/agent')) return null;

  const closeChatbot = () => {
    sessionStorage.removeItem(DEMO_ACTIVE_KEY);
    sessionStorage.removeItem(DEMO_COUNTRY_KEY);
    setActive(false);
    setOpen(false);
    autoNavigatedCountry.current = '';
  };

  const navigateToCountry = (country: CountryMatch) => {
    if (autoNavigatedCountry.current === country.code) return;
    autoNavigatedCountry.current = country.code;
    sessionStorage.setItem(DEMO_COUNTRY_KEY, country.code);
    setInput('');
    navigate(`/${country.slug}`);
  };

  const chooseCountry = (code: string, userText?: string) => {
    const country = COUNTRY_MATCHES.find((item) => item.code === code);
    if (!country) return;

    if (userText) setMessages((current) => [...current, { role: 'user', text: userText }]);
    navigateToCountry(country);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    const country = detectCountry(value);
    if (country) chooseCountry(country.code, value);
  };

  const askAssistant = async (text: string) => {
    setThinking(true);
    try {
      const response = await fetch('/api/chatbot-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language_code: 'az',
          current_path: location.pathname,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      const assistantText =
        payload?.reply ||
        payload?.error ||
        'Hansı ölkə üçün eSIM lazımdır? Ölkə adını yazın, uyğun səhifəni açaq.';

      setMessages((current) => [...current, { role: 'bot', text: assistantText }]);

      if (payload?.action === 'navigate_country' && payload?.country_slug) {
        const country = COUNTRY_MATCHES.find((item) => item.slug === payload.country_slug);
        if (country) {
          window.setTimeout(() => navigateToCountry(country), 250);
        }
      }
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'bot', text: 'Hazırda demo bot cavab verə bilmədi. Ölkə adını yazın, uyğun eSIM səhifəsini açaq.' },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    const country = detectCountry(text);
    if (country) {
      chooseCountry(country.code, text);
      return;
    }

    setMessages((current) => [...current, { role: 'user', text }]);
    setInput('');
    await askAssistant(text);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="flex h-[460px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-white">
            <div>
              <div className="text-sm font-black">Ey Dost AI eSIM</div>
              <div className="text-xs text-white/85">Ölkəni yazın, səhifəni açaq</div>
            </div>
            <button onClick={closeChatbot} className="rounded-lg p-2 hover:bg-white/15" aria-label="Bağla">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {messages.map((message, index) => (
              <div key={index} className={message.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={`inline-block max-w-[90%] rounded-2xl px-3 py-2 text-sm font-semibold leading-5 ${
                    message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800 shadow-sm'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="text-left">
                <div className="inline-flex items-center gap-1 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-500 shadow-sm">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                  Yazır...
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 border-t border-slate-100 bg-white px-3 pt-3">
            {['TR', 'AZ', 'FR'].map((code) => {
              const country = COUNTRY_MATCHES.find((item) => item.code === code);
              if (!country) return null;
              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => chooseCountry(country.code)}
                  className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                >
                  {country.label}
                </button>
              );
            })}
          </div>
          <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 bg-white p-3">
            <input
              value={input}
              onChange={(event) => handleInputChange(event.target.value)}
              placeholder="Məs: Fransa paketləri..."
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
