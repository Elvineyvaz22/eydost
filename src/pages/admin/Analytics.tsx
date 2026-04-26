import AdminLayout from '../../components/admin/AdminLayout';
import { BarChart3, Users, MousePointer2, Smartphone, Globe2, ArrowUpRight, ExternalLink, Activity } from 'lucide-react';

export default function Analytics() {
  // Simulated data for the dashboard UI
  const stats = [
    { label: 'Ümumi Giriş (Bu ay)', value: '1,284', change: '+12%', icon: Users, color: 'bg-blue-500' },
    { label: 'WhatsApp Klikləri', value: '342', change: '+8%', icon: MousePointer2, color: 'bg-green-500' },
    { label: 'eSIM Axtarışları', value: '856', change: '+15%', icon: SearchIcon, color: 'bg-purple-500' },
    { label: 'Konversiya nisbəti', value: '26.6%', change: '+2%', icon: BarChart3, color: 'bg-orange-500' },
  ];

  const topCountries = [
    { country: 'Turkey', count: 245, percentage: 65 },
    { country: 'USA', count: 120, percentage: 45 },
    { country: 'France', count: 98, percentage: 38 },
    { country: 'Georgia', count: 76, percentage: 30 },
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Marketinq Analitikası</h1>
            <p className="text-gray-500 text-sm mt-1">Məlumatlar Google Analytics (GA4) tərəfindən toplanır.</p>
          </div>
          <a 
            href="https://analytics.google.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-red-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-200 active:scale-95 animate-pulse"
          >
            <ExternalLink className="w-5 h-5" /> REAL PANELƏ KEÇİD
          </a>
        </header>

        {/* Disclaimer Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-10 flex items-start gap-3">
          <div className="text-amber-600 mt-1">⚠️</div>
          <p className="text-sm text-amber-800 leading-relaxed">
            <span className="font-bold">Diqqət:</span> Aşağıda gördüyünüz rəqəmlər hazırda idarəetmə panelinin <span className="font-bold">dizayn nümunəsidir</span>. 
            Sizin real məlumatlarınız (G-P2J6KQJ74T) Google-un öz serverlərində toplanır. 
            Dəqiq və canlı statistikaya baxmaq üçün yuxarıdakı qırmızı düymə ilə rəsmi Google Analytics panelinə keçid edin.
          </p>
        </div>

        {/* Live Status Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white mb-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-100">Canlı Analitika</span>
            </div>
            <h2 className="text-5xl font-black mb-2">12</h2>
            <p className="text-blue-100 font-medium">Hazırda saytda olan aktiv istifadəçi sayı</p>
          </div>
          <Activity className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-white/10 rotate-12" />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4 text-white shadow-lg`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-400 mb-1">{stat.label}</p>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
                <span className="text-xs font-bold text-green-500 mb-1 flex items-center">
                  <ArrowUpRight className="w-3 h-3" /> {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Searches Chart */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-blue-600" /> Ən çox axtarılan ölkələr
              </h3>
            </div>
            <div className="space-y-6">
              {topCountries.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-gray-700">{item.country}</span>
                    <span className="text-sm font-bold text-gray-400">{item.count} axtarış</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
            <Smartphone className="w-16 h-16 text-gray-200 mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cihaz Bölgüsü</h3>
            <p className="text-gray-400 text-sm mb-8">İstifadəçilərinizin 92%-i sayta mobil telefon vasitəsilə daxil olur.</p>
            
            <div className="flex items-center gap-10 w-full">
              <div className="flex-1">
                <p className="text-3xl font-black text-gray-900">92%</p>
                <p className="text-xs font-bold text-gray-400 uppercase">Mobil</p>
              </div>
              <div className="w-px h-10 bg-gray-100" />
              <div className="flex-1">
                <p className="text-3xl font-black text-gray-900">8%</p>
                <p className="text-xs font-bold text-gray-400 uppercase">Desktop</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function SearchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
