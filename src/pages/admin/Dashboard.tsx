import AdminLayout from '../../components/admin/AdminLayout';
import { Layout, Sparkles, FileText, Rocket, Activity, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Dashboard() {
  const stats = [
    { label: 'eSIM Paketləri', count: '150+', icon: Layout, path: '/admin/esim', color: 'bg-blue-500' },
    { label: 'Taksi Sinifləri', count: '4', icon: Sparkles, path: '/admin/taxi', color: 'bg-green-500' },
    { label: 'Sual-Cavablar', count: '20+', icon: FileText, path: '/admin/faq', color: 'bg-orange-500' },
    { label: 'Girişlər (Bugün)', count: 'Canlı', icon: Activity, path: '/admin/analytics', color: 'bg-purple-500' },
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Xoş gəldiniz, Elvin!</h1>
          <p className="text-gray-500">Ey Dost Super App portalının idarəetmə mərkəzi.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <NavLink
              key={i}
              to={stat.path}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4 text-white shadow-lg shadow-gray-200`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
            </NavLink>
          ))}
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-3">Marketinq İpucu 💡</h2>
              <p className="text-gray-400 max-w-lg mb-6">
                Google Analytics artıq aktivdir! Müştəriləriniz ən çox hansı ölkənin eSIM paketini axtarırsa, 
                həmin ölkəni ana səhifədə "Populyar" kimi qeyd edərək satışları 20% artıra bilərsiniz.
              </p>
              <NavLink
                to="/admin/analytics"
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
              >
                Analitikaya bax
              </NavLink>
            </div>
            <div className="hidden lg:block">
              <Rocket className="w-24 h-24 text-gray-700 opacity-50" />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
