import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import {
  acceptAllCookies,
  acceptNecessaryOnly,
  applyStoredConsent,
  getStoredConsent,
} from '../utils/cookieConsent';

export default function CookieConsent() {
  const { t } = useLanguage();
  const c = t.cookieConsent;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    applyStoredConsent();
    if (!getStoredConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => setVisible(false);

  return (
    <div
      role="dialog"
      aria-label={c.title}
      className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 pointer-events-none"
    >
      <div className="max-w-4xl mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl border border-gray-700 p-5 sm:p-6 pointer-events-auto">
        <p className="text-sm font-bold text-white mb-2">{c.title}</p>
        <p className="text-sm text-gray-300 leading-relaxed mb-4">
          {c.description}{' '}
          <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300 underline" onClick={dismiss}>
            {c.privacyLink}
          </Link>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => {
              acceptNecessaryOnly();
              dismiss();
            }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-600 text-gray-200 hover:bg-gray-800 transition-colors"
          >
            {c.reject}
          </button>
          <button
            type="button"
            onClick={() => {
              acceptAllCookies();
              dismiss();
            }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-gray-900 transition-colors"
          >
            {c.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
