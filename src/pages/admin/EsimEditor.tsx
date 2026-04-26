import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { usePackages } from '../../contexts/PackagesContext';
import { Search, Save, Star, Edit2, TrendingUp, DollarSign, Percent, ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';

export default function EsimEditor() {
  const [search, setSearch] = useState('');
  const { packages, updatePackages } = usePackages();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Bulk Edit States
  const [bulkType, setBulkType] = useState<'fixed' | 'percent'>('percent');
  const [bulkValue, setBulkValue] = useState<number>(0);

  const filteredPackages = packages.filter(p => 
    p.country.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFeatured = (slug: string) => {
    const newPackages = packages.map(p => 
      p.slug === slug ? { ...p, featured: !p.featured } : p
    );
    updatePackages(newPackages);
  };

  const handlePlanPriceChange = (pkgSlug: string, planIndex: number, newPrice: string) => {
    const newPackages = packages.map(p => {
      if (p.slug === pkgSlug) {
        const newPlans = [...p.plans];
        newPlans[planIndex] = { ...newPlans[planIndex], price: newPrice };
        return { ...p, plans: newPlans };
      }
      return p;
    });
    updatePackages(newPackages);
  };

  const applyBulkAdjustment = () => {
    if (bulkValue === 0) return;
    
    const newPackages = packages.map(p => {
      const newPlans = p.plans.map(plan => {
        const currentPrice = parseFloat(plan.price.replace('$', ''));
        let newPriceNum;
        
        if (bulkType === 'percent') {
          newPriceNum = currentPrice * (1 + bulkValue / 100);
        } else {
          newPriceNum = currentPrice + bulkValue;
        }
        
        return { ...plan, price: `$${newPriceNum.toFixed(2)}` };
      });
      return { ...p, plans: newPlans };
    });
    
    updatePackages(newPackages);
    alert(`Bütün paketlərin qiyməti ${bulkValue}${bulkType === 'percent' ? '%' : '$'} ${bulkValue > 0 ? 'artırıldı' : 'azaldıldı'}.`);
  };

  const handleSave = () => {
    // Already handled by updatePackages in this version, but we can still show the alert
    alert('Bütün dəyişikliklər qlobal bazada yadda saxlanıldı!');
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">eSIM Qiymət Redaktoru</h1>
            <p className="text-gray-500 text-sm mt-1">Paketləri tək-tək və ya toplu şəkildə idarə edin.</p>
          </div>
          <button 
            onClick={handleSave}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95"
          >
            <Save className="w-5 h-5" /> Dəyişiklikləri Təsdiqlə
          </button>
        </header>

        {/* Bulk Actions Bar */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-6 mb-8 text-white shadow-lg">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Toplu Qiymət Ayarı</h3>
                <p className="text-xs text-gray-400">Bütün ölkələrin qiymətini eyni anda dəyişin.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 w-full lg:w-auto">
              <div className="flex bg-black/40 rounded-xl p-1">
                <button 
                  onClick={() => setBulkType('percent')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${bulkType === 'percent' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                >
                  <Percent className="w-3 h-3 inline mr-1" /> Faiz
                </button>
                <button 
                  onClick={() => setBulkType('fixed')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${bulkType === 'fixed' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}
                >
                  <DollarSign className="w-3 h-3 inline mr-1" /> Sabit
                </button>
              </div>
              <input 
                type="number" 
                value={bulkValue}
                onChange={e => setBulkValue(Number(e.target.value))}
                placeholder="Dəyər (məs: 10)"
                className="bg-transparent border-none focus:ring-0 text-white font-bold w-24 text-center placeholder-gray-600"
              />
              <button 
                onClick={applyBulkAdjustment}
                className="bg-white text-black px-5 py-2 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all"
              >
                Tətbiq Et
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Ölkə axtar (məs: Turkey, USA...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-3xl focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm"
          />
        </div>

        {/* Table / List */}
        <div className="space-y-4">
          {filteredPackages.map((pkg) => {
            const isExpanded = expandedId === pkg.slug;
            return (
              <div key={pkg.slug} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:border-gray-300">
                <div 
                  className="flex items-center justify-between p-6 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : pkg.slug)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl filter drop-shadow-sm">{pkg.flag}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{pkg.country}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{pkg.region}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-col items-end">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Başlanğıc qiymət</p>
                      <p className="font-extrabold text-blue-600">{pkg.plans[0].price}</p>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFeatured(pkg.slug);
                      }}
                      className={`p-2.5 rounded-xl transition-all ${
                        pkg.featured 
                          ? 'bg-orange-100 text-orange-600 shadow-inner' 
                          : 'bg-gray-50 text-gray-300 hover:text-gray-500'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${pkg.featured ? 'fill-current' : ''}`} />
                    </button>
                    
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-gray-50 bg-gray-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pkg.plans.map((plan, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-500">{plan.gb}GB / {plan.days} Gün</span>
                            <Edit2 className="w-3 h-3 text-gray-300" />
                          </div>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                            <input 
                              type="text" 
                              value={plan.price.replace('$', '')}
                              onChange={(e) => handlePlanPriceChange(pkg.slug, idx, `$${e.target.value}`)}
                              className="w-full pl-7 pr-3 py-2 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none font-extrabold text-gray-900"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
