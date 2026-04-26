import { Globe, Bot, Smartphone, MapPin, Car, Users, CheckCircle, MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const WA_LINK = 'https://wa.me/994512778085';

export default function TaxiSection() {
  const { t } = useLanguage();

  const features = [
    { icon: Globe, title: t.taxi.feature1Title, desc: t.taxi.feature1Desc },
    { icon: Bot, title: t.taxi.feature2Title, desc: t.taxi.feature2Desc },
    { icon: Smartphone, title: t.taxi.feature3Title, desc: t.taxi.feature3Desc },
  ];

  const steps = [
    { icon: MapPin, title: t.taxi.step1Title, desc: t.taxi.step1Desc },
    { icon: Car, title: t.taxi.step2Title, desc: t.taxi.step2Desc },
    { icon: Users, title: t.taxi.step3Title, desc: t.taxi.step3Desc },
    { icon: CheckCircle, title: t.taxi.step4Title, desc: t.taxi.step4Desc },
  ];

  return (
    <section id="taxi" className="py-20 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{t.taxi.title}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t.taxi.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            );
          })}
        </div>

        <h3 className="text-2xl font-bold text-gray-900 text-center mb-10">{t.taxi.howTitle}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="absolute -top-3 left-4 w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow">
                  {i + 1}
                </div>
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1">{step.title}</h4>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-orange-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl"
          >
            <MessageCircle className="w-5 h-5" />
            {t.taxi.ctaButton}
          </a>
        </div>
      </div>
    </section>
  );
}
