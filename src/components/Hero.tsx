import { Wifi, Car, ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function Hero() {
  const { t } = useLanguage();
  const hero = t.hero as Record<string, string>;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-[#0A0F1C] to-gray-900 text-white pt-24 pb-16 sm:pt-32 sm:pb-24">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-5" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
          <Zap className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium tracking-wide">{hero.badge}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
          <span className="block">{hero.title}</span>
          <span className="mt-3 sm:mt-4 flex flex-row flex-wrap justify-center items-center gap-x-4 sm:gap-x-10 gap-y-2">
            <span className="whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              {hero.ctaEsim}
            </span>
            <span
              className="hidden sm:inline text-white/25 font-light select-none"
              aria-hidden="true"
            >
              ·
            </span>
            <span className="whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
              {hero.ctaTaxi}
            </span>
          </span>
        </h1>

        <p className="text-lg sm:text-xl mb-12 max-w-2xl mx-auto text-gray-400 leading-relaxed">
          {hero.subtitle}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
          
          <Link to="/taxi" className="group relative bg-[#1E293B] hover:bg-[#2A3B52] border border-gray-700 hover:border-green-500/50 p-8 rounded-3xl transition-all duration-300 shadow-2xl hover:shadow-green-900/20 flex flex-col justify-between min-h-[220px] overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Car className="w-32 h-32 text-green-400" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Car className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{hero.ctaTaxi}</h2>
              <p className="text-gray-400 font-medium">{(t.taxi as Record<string, string>).subtitle}</p>
            </div>
            <div className="relative z-10 mt-8 flex items-center text-green-400 font-bold group-hover:translate-x-2 transition-transform">
              {hero.ctaTaxi} <ArrowRight className="ml-2 w-5 h-5" />
            </div>
          </Link>

          <Link to="/esim" className="group relative bg-[#1E293B] hover:bg-[#2A3B52] border border-gray-700 hover:border-blue-500/50 p-8 rounded-3xl transition-all duration-300 shadow-2xl hover:shadow-blue-900/20 flex flex-col justify-between min-h-[220px] overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Wifi className="w-32 h-32 text-blue-400" />
            </div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Wifi className="w-7 h-7 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{hero.ctaEsim}</h2>
              <p className="text-gray-400 font-medium">{(t.esimPackages as Record<string, string>).subtitle}</p>
            </div>
            <div className="relative z-10 mt-8 flex items-center text-blue-400 font-bold group-hover:translate-x-2 transition-transform">
              {hero.ctaEsim} <ArrowRight className="ml-2 w-5 h-5" />
            </div>
          </Link>

        </div>
      </div>
    </section>
  );
}
