import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { trackEvent, EVENTS } from '../utils/analytics';

export default function FloatingWhatsApp() {
  const { t } = useLanguage();

  return (
    <a
      href="https://wa.me/994512778085?text=Salam%21%20T%C3%BCrkiy%C9%99%20%C3%BC%C3%A7%C3%BCn%20eSIM%20alma%C5%9F%20ist%C9%99yir%C9%99m.%20Data%3A%2010GB%20Etibarl%C4%B1l%C4%B1q%20m%C3%BCdd%C9%99ti%3A%2030%20g%C3%BCn%20Qiym%C9%99t%3A%207.35%20dollar%20Code%3A%20{code}%20ID%3A%20{id}"
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
