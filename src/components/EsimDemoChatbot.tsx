import { FormEvent, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const DEMO_ACTIVE_KEY = 'eydost_esim_chatbot_demo_active';
const DEMO_MESSAGES_KEY = 'eydost_esim_chatbot_demo_messages';
const DEMO_COUNTRY_KEY = 'eydost_esim_chatbot_demo_country';
const DEMO_VERSION_KEY = 'eydost_esim_chatbot_demo_version';
const DEMO_VERSION = 'country-route-only-v3';

type ChatMessage = {
  role: 'bot' | 'user';
  text: string;
  actions?: Array<{ label: string; value: string }>;
};

const COUNTRY_MATCHES: Array<{ code: string; slug: string; names: string[] }> = [
  { code: 'TR', slug: 'turkey-esim', names: ['turkey', 'turkiye', 'turkiyə', 'türkiye', 'türkiyə', 'istanbul', 'antalya'] },
  { code: 'AZ', slug: 'azerbaijan-esim', names: ['azerbaijan', 'azerbaycan', 'azərbaycan', 'baku', 'baki', 'bakı'] },
  { code: 'US', slug: 'united-states-esim', names: ['usa', 'us', 'united states', 'america', 'amerika', 'abs', 'abş'] },
  { code: 'AE', slug: 'uae-esim', names: ['uae', 'dubai', 'abu dhabi', 'emirates', 'birləşmiş ərəb'] },
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
      text: 'Salam! Hansı ölkə üçün eSIM lazımdır? Məsələn: Türkiyə, Azərbaycan, Fransa, ABŞ, Dubai.',
      actions: [
        { label: 'Türkiyə', value: 'TR' },
        { label: 'Azərbaycan', value: 'AZ' },
        { label: 'Fransa', value: 'FR' },
      ],
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
    return raw ? JSON.parse(raw) as ChatMessage[] : initialMessages();
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
}

export default function EsimDemoChatbot() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(() => sessionStorage.getItem(DEMO_ACTIVE_KEY) === '1');
  const [open, setOpen] = useState(() => sessionStorage.getItem(DEMO_ACTIVE_KEY) === '1');
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState('');
  const autoNavigatedCountry = useRef('');

  useEffect(() => {
    const enabled = sessionStorage.getItem(DEMO_ACTIVE_KEY) === '1';
    setActive(enabled);
    if (enabled) setOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  if (!active || location.pathname.startsWith('/admin') || location.pathname.startsWith('/agent')) return null;

  const chooseCountry = (code: string, userText?: string) => {
    const country = COUNTRY_MATCHES.find((item) => item.code === code);
    if (!country || autoNavigatedCountry.current === country.code) return;

    autoNavigatedCountry.current = country.code;
    sessionStorage.setItem(DEMO_COUNTRY_KEY, country.code);
    setMessages((current) => userText ? [...current, { role: 'user', text: userText }] : current);
    setInput('');
    navigate(`/${country.slug}`);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    const country = detectCountry(value);
    if (country) chooseCountry(country.code, value);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;

    const country = detectCountry(text);
    if (country) {
      chooseCountry(country.code, text);
      return;
    }

    setMessages((current) => [
      ...current,
      { role: 'user', text },
      { role: 'bot', text: 'Ölkə adını yazın, mən uyğun eSIM səhifəsini açım. Məsələn: Fransa paketləri lazımdır.' },
    ]);
    setInput('');
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="flex h-[460px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
            <div>
              <div className="text-sm font-black">Ey Dost eSIM Demo</div>
              <div className="text-xs text-slate-300">Ölkəni yazın, səhifəni açaq</div>
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
                      <button
                        key={action.value}
                        onClick={() => chooseCountry(action.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-bold text-slate-800 hover:border-blue-300 hover:bg-blue-50"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
