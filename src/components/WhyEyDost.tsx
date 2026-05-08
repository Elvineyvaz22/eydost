import { MessageCircle, Zap, Globe, Car, Bot, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function WhyEyDost() {
  const { t } = useLanguage();
  const w = t.whyUs as Record<string, string>;

  const features = [
    { icon: MessageCircle, title: w.feature1Title, desc: w.feature1Desc, color: 'from-green-500 to-emerald-600' },
    { icon: Zap,           title: w.feature2Title, desc: w.feature2Desc, color: 'from-blue-500 to-cyan-500' },
    { icon: Globe,         title: w.feature3Title, desc: w.feature3Desc, color: 'from-indigo-500 to-purple-500' },
    { icon: Car,           title: w.feature4Title, desc: w.feature4Desc, color: 'from-yellow-400 to-orange-500' },
    { icon: Bot,           title: w.feature5Title, desc: w.feature5Desc, color: 'from-cyan-400 to-blue-500' },
    { icon: Clock,         title: w.feature6Title, desc: w.feature6Desc, color: 'from-orange-400 to-red-500' },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-14">{w.title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-200 group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
