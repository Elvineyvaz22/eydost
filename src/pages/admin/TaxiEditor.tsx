import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Save, Info, DollarSign, Percent, Car } from 'lucide-react';

export default function TaxiEditor() {
  const [taxiSettings, setTaxiSettings] = useState({
    basePrice: 2.50,
    perKm: 0.85,
    perMinute: 0.20,
    airportFeeMultiplier: 1.15,
    surgePricing: 1.0,
  });

  const handleSave = () => {
    alert('Taksi tarifləri yeniləndi! (Simulyasiya)');
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Taksi Tənzimləmələri</h1>
            <p className="text-gray-500 text-sm mt-1">Qlobal Bolt tarifləri əsasında qiymət idarəedilməsi.</p>
          </div>
          <button 
            onClick={handleSave}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200"
          >
            <Save className="w-5 h-5" /> Tarifləri Yenilə
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Base Rates Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Baza Tarifləri (USD)</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Baza Qiyməti (Min. Sifariş)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input 
                    type="number" 
                    value={taxiSettings.basePrice} 
                    onChange={e => setTaxiSettings({...taxiSettings, basePrice: Number(e.target.value)})}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">1 KM üçün qiymət</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input 
                    type="number" 
                    value={taxiSettings.perKm} 
                    onChange={e => setTaxiSettings({...taxiSettings, perKm: Number(e.target.value)})}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">1 Dəqiqə üçün qiymət</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input 
                    type="number" 
                    value={taxiSettings.perMinute} 
                    onChange={e => setTaxiSettings({...taxiSettings, perMinute: Number(e.target.value)})}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modifiers Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                <Percent className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Əmsallar & Rüsumlar</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Aeroport Rüsumu (%)</label>
                <input 
                  type="number" 
                  value={taxiSettings.airportFeeMultiplier} 
                  step="0.01"
                  onChange={e => setTaxiSettings({...taxiSettings, airportFeeMultiplier: Number(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 outline-none transition-all font-bold"
                />
                <p className="text-[11px] text-gray-400 mt-2">Məsələn: 1.15 = 15% əlavə haqq</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Pik Saat Əmsalı (Surge)</label>
                <input 
                  type="number" 
                  value={taxiSettings.surgePricing} 
                  step="0.1"
                  onChange={e => setTaxiSettings({...taxiSettings, surgePricing: Number(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 outline-none transition-all font-bold"
                />
              </div>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-gray-400 shrink-0" />
                <p className="text-xs text-gray-500 leading-relaxed">
                  Bu tənzimləmələr real vaxt rejimində saytdakı taksi kalkulyatoruna təsir edəcək. 
                  Dəyişiklik etdikdən sonra "Yadda saxla" düyməsinə basmağı unutmayın.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Car Classes Preview */}
        <div className="mt-10 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <Car className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Maşın Sinifləri Multiplier</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Economy', 'Comfort', 'Business', 'Minivan'].map(cls => (
              <div key={cls} className="p-4 border border-gray-100 rounded-2xl text-center">
                <p className="text-xs text-gray-400 mb-1">{cls}</p>
                <p className="font-bold text-gray-900">
                  {cls === 'Economy' ? '1.0x' : cls === 'Comfort' ? '1.4x' : cls === 'Business' ? '2.0x' : '2.5x'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
