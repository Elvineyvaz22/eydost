import { Wifi, Car, ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getWhatsAppLink } from '../utils/whatsapp';

export default function Hero() {
  const { t } = useLanguage();
  const hero = t.hero as Record<string, string>;
  const nav = t.nav as Record<string, string>;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-[#0A0F1C] to-gray-900 text-white pt-24 pb-16 sm:pt-32 sm:pb-24">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-5" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <a
          href={getWhatsAppLink('esim', 'Salam! EyDost xidməti haqqında sualım var.')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 sm:mb-8 transition-colors hover:bg-white/10 hover:border-white/20"
        >
          <Zap className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium tracking-wide">{hero.badge}</span>
        </a>

        <h1 className="text-[1.65rem] leading-snug sm:text-5xl lg:text-7xl font-extrabold mb-4 sm:mb-6 tracking-tight">
          {hero.title}
        </h1>

        <p className="text-sm sm:text-xl mb-6 sm:mb-12 max-w-2xl mx-auto text-gray-400 leading-relaxed px-1">
          {hero.subtitle}
        </p>

        {/* Only two CTAs — always 2 columns on phone */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-md sm:max-w-4xl mx-auto">
          <Link
            to="/esim"
            className="group relative bg-[#1E293B] hover:bg-[#2A3B52] border border-gray-700 hover:border-blue-500/50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 min-h-[6.75rem] sm:min-h-[220px] transition-all duration-300 shadow-lg sm:shadow-2xl hover:shadow-blue-900/20 flex flex-col items-center justify-center sm:items-stretch sm:justify-between text-center sm:text-left overflow-hidden active:scale-[0.98]"
          >
            <div className="hidden sm:block absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Wifi className="w-32 h-32 text-blue-400" />
            </div>
            <div className="relative z-10 flex flex-col items-center sm:items-start w-full">
              <div className="w-14 h-14 sm:w-14 sm:h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-3 sm:mb-6">
                <Wifi className="w-7 h-7 sm:w-7 sm:h-7 text-blue-400" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight">
                {nav.esim}
              </h2>
              <p className="sm:hidden text-[11px] text-blue-300/80 font-medium mt-1 leading-tight">
                {hero.ctaEsim}
              </p>
              <p className="hidden sm:block text-gray-400 font-medium mt-2">
                {(t.esimPackages as Record<string, string>).subtitle}
              </p>
            </div>
            <div className="relative z-10 hidden sm:flex mt-8 items-center text-blue-400 font-bold group-hover:translate-x-2 transition-transform">
              {hero.ctaEsim} <ArrowRight className="ml-2 w-5 h-5" />
            </div>
          </Link>

          <Link
            to="/taxi"
            className="group relative bg-[#1E293B] hover:bg-[#2A3B52] border border-gray-700 hover:border-green-500/50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 min-h-[6.75rem] sm:min-h-[220px] transition-all duration-300 shadow-lg sm:shadow-2xl hover:shadow-green-900/20 flex flex-col items-center justify-center sm:items-stretch sm:justify-between text-center sm:text-left overflow-hidden active:scale-[0.98]"
          >
            <div className="hidden sm:block absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Car className="w-32 h-32 text-green-400" />
            </div>
            <div className="relative z-10 flex flex-col items-center sm:items-start w-full">
              <div className="w-14 h-14 sm:w-14 sm:h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-3 sm:mb-6">
                <Car className="w-7 h-7 sm:w-7 sm:h-7 text-green-400" />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight">
                {nav.taxi}
              </h2>
              <p className="sm:hidden text-[11px] text-green-300/80 font-medium mt-1 leading-tight line-clamp-2">
                {hero.ctaTaxi}
              </p>
              <p className="hidden sm:block text-gray-400 font-medium mt-2">
                {(t.taxi as Record<string, string>).subtitle}
              </p>
            </div>
            <div className="relative z-10 hidden sm:flex mt-8 items-center text-green-400 font-bold group-hover:translate-x-2 transition-transform">
              {hero.ctaTaxi} <ArrowRight className="ml-2 w-5 h-5" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
