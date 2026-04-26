import { Globe, Bot, Smartphone, MapPin, Car, Users, CheckCircle, MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const WA_LINK = 'https://wa.me/994512778085';

function MovingCars() {
  return (
    <div className="relative w-full h-[400px] bg-[#f8f9fa] rounded-3xl overflow-hidden border border-gray-200 shadow-inner mb-16 group">
      {/* Abstract Map Background (Simplified Grid/Streets) */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>
      
      {/* Moving Cars */}
      
      {/* Car 1: Horizontal */}
      <div className="absolute top-[20%] left-[-50px] animate-car-move-horizontal">
        <div className="flex flex-col items-center">
           <div className="bg-white px-2 py-1 rounded-lg shadow-md text-[10px] font-bold mb-1 border border-gray-100">Economy</div>
           <Car className="w-8 h-8 text-orange-500 fill-orange-500/20" />
        </div>
      </div>

      {/* Car 2: Vertical */}
      <div className="absolute top-[-50px] left-[60%] animate-car-move-vertical">
        <div className="flex flex-row items-center">
           <Car className="w-8 h-8 text-blue-500 fill-blue-500/20 rotate-90" />
           <div className="bg-white px-2 py-1 rounded-lg shadow-md text-[10px] font-bold ml-1 border border-gray-100">Comfort</div>
        </div>
      </div>

      {/* Car 3: Diagonally */}
      <div className="absolute bottom-[10%] right-[-50px] animate-car-move-diagonal">
        <div className="flex flex-col items-center">
           <div className="bg-white px-2 py-1 rounded-lg shadow-md text-[10px] font-bold mb-1 border border-gray-100">Business</div>
           <Car className="w-8 h-8 text-black fill-black/10 -rotate-45" />
        </div>
      </div>

      {/* Map Labels for "Life" */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-white/50">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Live Tracking</p>
          <p className="text-2xl font-black text-gray-900">Drivers Nearby</p>
        </div>
      </div>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes carMoveHorizontal {
          0% { left: -50px; transform: scaleX(1); }
          45% { left: 110%; transform: scaleX(1); }
          50% { transform: scaleX(-1); }
          95% { left: -50px; transform: scaleX(-1); }
          100% { transform: scaleX(1); }
        }
        @keyframes carMoveVertical {
          0% { top: -50px; }
          100% { top: 110%; }
        }
        @keyframes carMoveDiagonal {
          0% { right: -50px; bottom: 10%; }
          100% { right: 110%; bottom: 80%; }
        }
        .animate-car-move-horizontal {
          animation: carMoveHorizontal 15s linear infinite;
        }
        .animate-car-move-vertical {
          animation: carMoveVertical 12s linear infinite;
        }
        .animate-car-move-diagonal {
          animation: carMoveDiagonal 18s linear infinite;
        }
      `}} />
    </div>
  );
}

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

        {/* Moving Cars Preview */}
        <MovingCars />

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
