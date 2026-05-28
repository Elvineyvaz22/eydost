import { useMemo, useState } from 'react';
import { Mail, Phone, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { t, language, setLanguage } = useLanguage();
  const year = new Date().getFullYear();

  const [langOpen, setLangOpen] = useState(false);
  const langOptions = useMemo(
    () =>
      [
        { code: 'en', label: 'EN', flag: '🇬🇧' },
        { code: 'az', label: 'AZ', flag: '🇦🇿' },
        { code: 'ru', label: 'RU', flag: '🇷🇺' },
        { code: 'tr', label: 'TR', flag: '🇹🇷' },
        { code: 'ar', label: 'AR', flag: '🇸🇦' },
        { code: 'es', label: 'ES', flag: '🇪🇸' },
        { code: 'zh', label: '中文', flag: '🇨🇳' },
      ] as const,
    []
  );
  const currentLang = langOptions.find((o) => o.code === language) ?? langOptions[0];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Ey Dost</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{t.footer.tagline}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">{t.footer.quickLinks}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#how-esim" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.howItWorks}</a></li>
              <li><a href="/esim" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.features}</a></li>
              <li><a href="#faq" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.faq}</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.contact}</a></li>
              <li><Link to="/blog" className="text-gray-400 hover:text-cyan-400 transition-colors">{(t.footer as Record<string, string>).blog}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">{t.footer.contactInfo}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-gray-400">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                info@eydost.com
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                {t.contact.support24}
              </li>

            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">{t.footer.legal}</h4>
            <div className="text-sm text-gray-400 space-y-2">
              <p><span className="text-gray-500">{t.footer.companyLabel}:</span> NURTEL ELEKTR&#304;K MMC</p>
              <p><span className="text-gray-500">{t.footer.addressLabel}:</span> AZ5000, Sumqay&#305;t, N&#601;riman N&#601;rimanov 7/16</p>
              <div className="pt-2 space-y-1.5">
                <Link to="/about" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                  {(t.footer as Record<string, string>).about}
                </Link>
                <Link to="/privacy" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                  <Shield className="w-4 h-4" />
                  {(t.footer as Record<string, string>).privacy}
                </Link>
                <Link to="/terms" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                  {(t.footer as Record<string, string>).terms}
                </Link>
                <Link to="/refund" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                  {(t.footer as Record<string, string>).refund}
                </Link>
              </div>
            </div>

            <div className="relative mt-4" dir="ltr">
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                onBlur={() => setTimeout(() => setLangOpen(false), 120)}
                className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-100 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                aria-haspopup="menu"
                aria-expanded={langOpen}
              >
                <span className="text-base leading-none" aria-hidden>
                  {currentLang.flag}
                </span>
                <span className="leading-none">{currentLang.label}</span>
                <span className="text-gray-300 leading-none" aria-hidden>
                  ▾
                </span>
              </button>
              {langOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-700 bg-gray-900 shadow-lg overflow-hidden z-50"
                >
                  {langOptions.map((opt) => {
                    const active = opt.code === language;
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        role="menuitem"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setLanguage(opt.code);
                          setLangOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 flex items-center gap-2 text-sm font-semibold transition-colors ${
                          active
                            ? 'bg-blue-900/30 text-blue-200'
                            : 'text-gray-200 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-base leading-none" aria-hidden>
                          {opt.flag}
                        </span>
                        <span className="flex-1 text-left">{opt.label}</span>
                        {active ? <span className="text-blue-200">✓</span> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
          &copy; {year} {t.footer.copyright}
        </div>
      </div>
    </footer>
  );
}
