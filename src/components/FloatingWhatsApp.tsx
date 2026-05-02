import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import { getWaId, createOrder } from '../utils/whatsapp';
import { useState } from 'react';

export default function FloatingWhatsApp() {
  const { t } = useLanguage();
  const [isOrdering, setIsOrdering] = useState(false);
  const waId = getWaId();

  const handleSupportClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackEvent(EVENTS.WHATSAPP_CHAT_GENERAL, { source: 'floating_button' });

    if (waId) {
      e.preventDefault();
      setIsOrdering(true);
      try {
        await createOrder({
          wa_id: waId,
          type: 'taxi', // Using taxi type for generic message handling in this mock
          details: 'Salam! Kömək lazımdır.',
        });
        alert('Mesajınız WhatsApp-a göndərildi! Teat bölməsinə qayıdın.');
      } finally {
        setIsOrdering(false);
      }
    }
  };

  const genericMsg = encodeURIComponent("Salam! EyDost xidməti ilə bağlı sualım var.");

  return (
    <a
      href={waId ? "#" : `https://wa.me/994558878889?text=${genericMsg}`}
      target={waId ? "_self" : "_blank"}
      rel="noopener noreferrer"
      onClick={handleSupportClick}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-[#20bd5a] transition-all duration-200 ${
        isOrdering ? 'opacity-70 cursor-not-allowed' : ''
      }`}
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm font-semibold hidden sm:inline">
        {isOrdering ? 'Göndərilir...' : t.whatsappButton}
      </span>
    </a>
  );
}
