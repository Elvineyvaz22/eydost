import { MessageCircle, Mail, Phone, Shield, Send } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { t, language, setLanguage } = useLanguage();
  const year = new Date().getFullYear();

  const langs = ['EN', 'AZ', 'RU'] as const;
  const langMap = { EN: 'en', AZ: 'az', RU: 'ru' } as const;

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
              <li><a href="/packages" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.features}</a></li>
              <li><a href="#faq" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.faq}</a></li>
              <li><a href="#contact" className="text-gray-400 hover:text-cyan-400 transition-colors">{t.footer.contact}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">{t.footer.contactInfo}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-gray-400">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                eydost@eydost.az
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                {t.contact.support24}
              </li>
              <li className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="https://t.me/eydost_esim_bot" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition-colors">
                  Telegram Bot: t.me/eydost_esim_bot
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">{t.footer.legal}</h4>
            <div className="text-sm text-gray-400 space-y-2">
              <p><span className="text-gray-500">{t.footer.companyLabel}:</span> NURTEL ELEKTR&#304;K MMC</p>
              <p><span className="text-gray-500">{t.footer.addressLabel}:</span> AZ5000, Sumqay&#305;t, N&#601;riman N&#601;rimanov 7/16</p>
              <Link to="/privacy" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors pt-2 font-medium">
                <Shield className="w-4 h-4" />
                Privacy Policy / Gizlilik Siyasəti
              </Link>
            </div>

            <div className="flex gap-1 mt-4">
              {langs.map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(langMap[l])}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    language === langMap[l] ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
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
