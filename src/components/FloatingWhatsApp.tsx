import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import { getWaId, createOrder } from '../utils/whatsapp';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { isEsimRoute } from '../utils/routes';

export default function FloatingWhatsApp() {
  const { pathname } = useLocation();
  const { t, language } = useLanguage();

  if (isEsimRoute(pathname)) return null;
  const [isOrdering, setIsOrdering] = useState(false);
  const waId = getWaId();

  const isMiniApp = typeof window !== 'undefined' && 
    (window as any).Telegram?.WebApp?.platform !== undefined && 
    (window as any).Telegram?.WebApp?.platform !== 'unknown';
  if (isMiniApp) return null;

  const handleSupportClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackEvent(EVENTS.WHATSAPP_CHAT_GENERAL, { source: 'floating_button' });

    if (waId) {
      e.preventDefault();
      setIsOrdering(true);
      try {
        await createOrder({
          wa_id: waId,
          type: 'taxi',
          details:
            language === 'az'
              ? 'Salam! Kömək lazımdır.'
              : language === 'ru'
                ? 'Здравствуйте! Мне нужна помощь.'
                : language === 'tr'
                  ? 'Merhaba! Yardıma ihtiyacım var.'
                  : language === 'ar'
                    ? 'مرحباً! أحتاج مساعدة.'
                    : language === 'es'
                      ? '¡Hola! Necesito ayuda.'
                      : language === 'zh'
                        ? '你好！我需要帮助。'
                        : 'Hi! I need help.',
        });
        alert(
          language === 'az'
            ? 'Mesajınız WhatsApp-a göndərildi! Çat bölməsinə qayıdın.'
            : language === 'ru'
              ? 'Ваше сообщение отправлено в WhatsApp! Вернитесь в чат.'
              : language === 'tr'
                ? 'Mesajınız WhatsApp’a gönderildi! Lütfen sohbetinize geri dönün.'
                : language === 'ar'
                  ? 'تم إرسال رسالتك إلى واتساب! الرجاء العودة إلى الدردشة.'
                  : language === 'es'
                    ? '¡Tu mensaje se envió a WhatsApp! Vuelve al chat.'
                    : language === 'zh'
                      ? '你的消息已发送到 WhatsApp！请返回聊天。'
                      : 'Your message has been sent to WhatsApp! Please return to your chat.',
        );
      } finally {
        setIsOrdering(false);
      }
    }
  };

  const genericMsg = encodeURIComponent(
    language === 'az'
      ? 'Salam! EyDost xidməti haqqında sualım var.'
      : language === 'ru'
        ? 'Здравствуйте! У меня есть вопрос об услуге EyDost.'
        : language === 'tr'
          ? 'Merhaba! Ey Dost hizmeti hakkında bir sorum var.'
          : language === 'ar'
            ? 'مرحباً! لدي سؤال عن خدمة Ey Dost.'
            : language === 'es'
              ? '¡Hola! Tengo una pregunta sobre el servicio de Ey Dost.'
              : language === 'zh'
                ? '你好！我想咨询 Ey Dost 的服务。'
                : 'Hi! I have a question about EyDost service.',
  );

  return (
    <a
      href={waId ? "#" : `https://wa.me/994992000444?text=${genericMsg}`}
      target={waId ? "_self" : "_blank"}
      rel="noopener noreferrer"
      onClick={handleSupportClick}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-[#20bd5a] transition-all duration-200 ${
        isOrdering ? 'opacity-70 cursor-not-allowed' : ''
      }`}
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm font-semibold hidden sm:inline">
        {isOrdering
          ? language === 'az'
            ? 'Göndərilir...'
            : language === 'ru'
              ? 'Отправка...'
              : language === 'tr'
                ? 'Gönderiliyor...'
                : language === 'ar'
                  ? 'جارٍ الإرسال...'
                  : language === 'es'
                    ? 'Enviando...'
                    : language === 'zh'
                      ? '发送中...'
                      : 'Sending...'
          : t.whatsappButton}
      </span>
    </a>
  );
}
