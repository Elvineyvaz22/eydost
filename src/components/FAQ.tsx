import { useState } from 'react';
import { ChevronDown, Car, Wifi, MessageCircle } from 'lucide-react';
import { trackEvent, EVENTS } from '../utils/analytics';
import { useLanguage } from '../contexts/LanguageContext';

type Tab = 'taxi' | 'esim' | 'general';

type FaqItem = { q: string; a: string };

export default function FAQ() {
  const { t } = useLanguage();
  const faqT = t.faq as unknown as {
    title: string;
    subtitle: string;
    tabTaxi: string;
    tabEsim: string;
    tabGeneral: string;
    showLess: string;
    viewAllTaxi: string;
    viewAllEsim: string;
    viewAllGeneral: string;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaButton: string;
    taxiList: FaqItem[];
    esimList: FaqItem[];
    generalList: FaqItem[];
  };
  const [activeTab, setActiveTab] = useState<Tab>('taxi');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);

  const faqs: Record<Tab, FaqItem[]> = {
    taxi: faqT.taxiList ?? [],
    esim: faqT.esimList ?? [],
    general: faqT.generalList ?? [],
  };

  const viewAllLabel: Record<Tab, string> = {
    taxi: faqT.viewAllTaxi,
    esim: faqT.viewAllEsim,
    general: faqT.viewAllGeneral,
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setOpenIndex(0);
    setShowAll(false);
  };

  const currentFaqs = showAll ? faqs[activeTab] : faqs[activeTab].slice(0, 3);

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">{faqT.title}</h2>
          <p className="text-lg text-gray-600">{faqT.subtitle}</p>
        </div>

        {/* Custom Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-200/50 p-1 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => handleTabChange('taxi')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'taxi' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Car className="w-4 h-4" /> {faqT.tabTaxi}
            </button>
            <button
              onClick={() => handleTabChange('esim')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'esim' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Wifi className="w-4 h-4" /> {faqT.tabEsim}
            </button>
            <button
              onClick={() => handleTabChange('general')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'general' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle className="w-4 h-4" /> {faqT.tabGeneral}
            </button>
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {currentFaqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:border-gray-200">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
              >
                <span className="font-bold text-gray-900 text-base">{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180 text-black' : ''
                  }`}
                />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-60' : 'max-h-0'}`}>
                <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-4">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        {faqs[activeTab].length > 3 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 border border-gray-300 bg-white rounded-full px-6 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-all shadow-sm"
            >
              {showAll ? faqT.showLess : viewAllLabel[activeTab]}
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center p-8 bg-gradient-to-br from-gray-900 to-black rounded-3xl shadow-xl">
          <h3 className="text-xl font-bold text-white mb-2">{faqT.ctaTitle}</h3>
          <p className="text-gray-400 text-sm mb-6">{faqT.ctaSubtitle}</p>
          <a
            href="https://wa.me/994992000444"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(EVENTS.WHATSAPP_CHAT_GENERAL, { source: 'faq_cta' })}
            className="inline-flex items-center gap-2 bg-[#25D366] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#20bd5a] transition-colors shadow-lg shadow-[#25D366]/20"
          >
            <MessageCircle className="w-5 h-5" /> {faqT.ctaButton}
          </a>
        </div>
      </div>
    </section>
  );
}
