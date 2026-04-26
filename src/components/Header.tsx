import { useState } from 'react';
import { MessageCircle, Menu, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const WA_LINK = 'https://wa.me/994512778085';

export default function Header() {
  const { language, setLanguage, t, brand } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const langs = ['EN', 'AZ', 'RU'] as const;
  const langMap = { EN: 'en', AZ: 'az', RU: 'ru' } as const;

  const navLinks = [
    { href: '/#esim-packages', label: t.nav.esim },
    { href: '/taxi', label: t.nav.taxi },
    { href: '/#how-esim', label: t.nav.howItWorks },
    { href: '/#faq', label: t.nav.faq },
    { href: '/#contact', label: t.nav.contact },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <img
              src={brand?.logoUrl || 'https://i.postimg.cc/9WJByvB7/Whats-App-Image-2025-12-11-at-23-51-41.jpg'}
              alt="Ey Dost"
              className="h-[50px] object-contain"
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

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden text-sm">
              {langs.map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(langMap[l])}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    language === langMap[l]
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#20bd5a] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>

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
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-lg font-semibold mt-2"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
