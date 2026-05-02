import { useState } from 'react';
import { ChevronDown, Car, Wifi, MessageCircle, Plus } from 'lucide-react';
import { trackEvent, EVENTS } from '../utils/analytics';

type Tab = 'taxi' | 'esim' | 'general';

export default function FAQ() {
  const [activeTab, setActiveTab] = useState<Tab>('taxi');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);

  const faqs = {
    taxi: [
      { q: "How do I book a ride globally?", a: "Simply open our Taxi map, select your pickup and drop-off locations anywhere in the world, and click 'Book via WhatsApp'. Our dispatch system will instantly connect you with a driver." },
      { q: "In which countries does the taxi service operate?", a: "Our taxi service is global! We partner with local fleets and drivers across Europe, Asia, Americas, and the Middle East to ensure you get a ride wherever you are." },
      { q: "How do I pay for the taxi?", a: "You can pay securely via a payment link sent to you on WhatsApp, or pay the driver directly with cash/card depending on local availability." },
      { q: "Can I schedule a ride in advance?", a: "Yes, you can message our WhatsApp agents to schedule a pickup for a specific date and time, such as an early morning airport transfer." },
      { q: "How do I recognize my driver?", a: "Once your ride is confirmed, we will send you the driver's name, car model, and license plate number directly via WhatsApp." },
      { q: "What happens if my flight is delayed?", a: "If you booked an airport pickup, just provide us with your flight number. Our drivers track flights and will adjust the pickup time automatically at no extra cost." },
      { q: "Are the prices fixed or metered?", a: "In most cases, we provide an estimated or fixed upfront price before you confirm the ride, so there are no surprises." },
      { q: "Can I order a ride for someone else?", a: "Absolutely! Just share their pickup location and contact details with us on WhatsApp, and we'll arrange the ride for them." },
      { q: "Is it safe to use your service?", a: "We only partner with licensed, verified local fleets and highly-rated drivers to ensure your safety and comfort anywhere in the world." },
      { q: "Can I cancel a ride after ordering?", a: "Yes, you can cancel by messaging us. Please note that a cancellation fee may apply if the driver is already at the pickup location." },
    ],
    esim: [
      { q: "What is an eSIM and how do I install it?", a: "An eSIM is a digital SIM. Once you buy a plan via WhatsApp, we send you a QR code. Just scan it with your phone's camera, and your internet will be active in seconds!" },
      { q: "Do I get a phone number with the eSIM?", a: "Our global eSIMs are data-only. This means you get fast internet for WhatsApp, Maps, and browsing, but no traditional phone number for SMS or calls." },
      { q: "Can I use the eSIM in multiple countries?", a: "Yes! If you purchase our Regional or Global eSIM packages, you can travel across multiple borders without losing connection or changing your eSIM." },
      { q: "Is my phone compatible with eSIM?", a: "Most modern smartphones (iPhone XS and newer, Samsung Galaxy S20 and newer, Google Pixel 3 and newer) support eSIM. You can ask our WhatsApp bot to check your specific model." },
      { q: "When does my eSIM data plan start?", a: "The validity period typically begins the moment your eSIM connects to a supported network in your destination country." },
      { q: "Can I keep my WhatsApp number?", a: "Yes! Your WhatsApp number remains exactly the same. You can continue chatting with your original number while using our eSIM for internet data." },
      { q: "What if I run out of data?", a: "We will send you a warning on WhatsApp when you are low on data. You can easily top up or buy a new package instantly by messaging us." },
      { q: "Do I need to remove my physical SIM card?", a: "No, you can keep your physical SIM inside your phone. Just make sure to select the eSIM for 'Cellular Data' in your phone's settings to avoid roaming charges." },
      { q: "Can I share my internet via Hotspot?", a: "Yes, tethering and mobile hotspot sharing are fully supported on our eSIM plans, allowing you to connect your laptop or tablet." },
      { q: "What should I do if my eSIM isn't working?", a: "Ensure data roaming is turned on for the eSIM in your phone settings. If you still have issues, our 24/7 WhatsApp support is ready to help you troubleshoot." },
    ],
    general: [
      { q: "Do I need to download an app?", a: "No! That's our biggest advantage. Everything from ordering a taxi to buying internet packages is done 100% via WhatsApp. Zero downloads, zero hassle." },
      { q: "Are your services available 24/7?", a: "Absolutely. Our WhatsApp automated system and support agents are available around the clock, 24/7/365, to assist you anywhere in the world." },
    ]
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
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-gray-600">Everything you need to know about our global Super App services.</p>
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
              <Car className="w-4 h-4" /> Taxi
            </button>
            <button
              onClick={() => handleTabChange('esim')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'esim' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Wifi className="w-4 h-4" /> eSIM
            </button>
            <button
              onClick={() => handleTabChange('general')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeTab === 'general' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle className="w-4 h-4" /> General
            </button>
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {currentFaqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:border-gray-200">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
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
              {showAll ? "Show Less" : `View All ${activeTab === 'taxi' ? 'Taxi' : 'eSIM'} Questions`}
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center p-8 bg-gradient-to-br from-gray-900 to-black rounded-3xl shadow-xl">
          <h3 className="text-xl font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-gray-400 text-sm mb-6">Our WhatsApp agents are ready to help you 24/7.</p>
          <a
            href="https://wa.me/994558878889"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(EVENTS.WHATSAPP_CHAT_GENERAL, { source: 'faq_cta' })}
            className="inline-flex items-center gap-2 bg-[#25D366] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#20bd5a] transition-colors shadow-lg shadow-[#25D366]/20"
          >
            <MessageCircle className="w-5 h-5" /> Chat with us
          </a>
        </div>
      </div>
    </section>
  );
}
