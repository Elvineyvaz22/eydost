import { useMemo, useState } from 'react';
import { MessageCircle, Menu, X, Car, Smartphone } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocation, useSearchParams } from 'react-router-dom';
import { isEsimRoute } from '../utils/routes';
import { buildTaxiHref } from '../utils/taxiLinkSession';
import { resolveLogoUrl } from '../constants/brand';
import { blogPath } from '../utils/localePaths';

const WA_LINK = 'https://wa.me/994992000444';

export default function Header() {
  const { language, setLanguage, t, brand } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const taxiHref = buildTaxiHref(searchParams);

  const langOptions = useMemo(
    () =>
      [
        { code: 'en', label: 'EN', flag: '🇬🇧' },
        { code: 'az', label: 'AZ', flag: '🇦🇿' },
        { code: 'ru', label: 'RU', flag: '🇷🇺' },
        { code: 'tr', label: 'TR', flag: '🇹🇷' },
        // Arabic is a language, not a country — we use a common MENA flag for UI.
        { code: 'ar', label: 'AR', flag: '🇸🇦' },
        { code: 'es', label: 'ES', flag: '🇪🇸' },
        { code: 'zh', label: '中文', flag: '🇨🇳' },
      ] as const,
    []
  );
  const currentLang = langOptions.find((o) => o.code === language) ?? langOptions[0];

  const isTaxiPage = location.pathname === '/taxi';
  const isPackagesPage = location.pathname === '/esim';
  const isEsimPage = isEsimRoute(location.pathname);

  const blogLabel = (t.nav as Record<string, string>).blog ?? 'Blog';

  const navLinks = [
    { href: '/esim', label: t.nav.esim },
    { href: taxiHref, label: t.nav.taxi },
    { href: blogPath(), label: blogLabel },
    { href: '/#how-esim', label: t.nav.howItWorks },
    { href: '/#faq', label: t.nav.faq },
    { href: '/#contact', label: t.nav.contact },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20 transition-all">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <img
              src={resolveLogoUrl(brand?.logoUrl)}
              alt="Ey Dost"
              className="h-10 lg:h-[60px] object-contain transition-all"
            />
          </a>

          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Conditional Mobile Buttons */}
            {isTaxiPage && (
              <a
                href="/esim"
                className="lg:hidden flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
              >
                <Smartphone className="w-3 h-3" />
                {t.hero.ctaEsim}
              </a>
            )}

            {isPackagesPage && (
              <a
                href={taxiHref}
                className="lg:hidden flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-600 transition-all shadow-md active:scale-95"
              >
                <Car className="w-3 h-3" />
                {t.hero.ctaTaxi}
              </a>
            )}

            {/* Language dropdown (flags) */}
            <div className="relative" dir="ltr">
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                onBlur={() => setTimeout(() => setLangOpen(false), 120)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
                aria-haspopup="menu"
                aria-expanded={langOpen}
              >
                <span className="text-base leading-none" aria-hidden>
                  {currentLang.flag}
                </span>
                <span className="leading-none">{currentLang.label}</span>
                <span className="text-gray-400 leading-none" aria-hidden>
                  ▾
                </span>
              </button>
              {langOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50"
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
                          active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base leading-none" aria-hidden>
                          {opt.flag}
                        </span>
                        <span className="flex-1 text-left">{opt.label}</span>
                        {active ? <span className="text-blue-600">✓</span> : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {!isEsimPage && (
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#20bd5a] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-gray-600"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
          <nav className="px-4 py-4 space-y-1">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
            {!isEsimPage && (
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-lg font-semibold mt-2"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
