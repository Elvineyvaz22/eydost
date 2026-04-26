import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { trackEvent, EVENTS } from '../utils/analytics';

export default function FloatingWhatsApp() {
  const { t } = useLanguage();

  return (
    <a
      href="https://wa.me/994512778085"
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent(EVENTS.WHATSAPP_CHAT_GENERAL, { source: 'floating_button' })}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-[#20bd5a] transition-all duration-200"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm font-semibold hidden sm:inline">{t.whatsappButton}</span>
    </a>
  );
}
