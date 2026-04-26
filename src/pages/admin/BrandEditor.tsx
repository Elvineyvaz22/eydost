import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { Save } from 'lucide-react';

interface BrandData {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

export default function BrandEditor() {
  const { refreshContent } = useLanguage();
  const [data, setData] = useState<BrandData>({
    logoUrl: '',
    primaryColor: '#0891b2',
    secondaryColor: '#0e7490',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: content } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', 'brand')
        .maybeSingle();

      if (content?.value) {
        setData(content.value as BrandData);
      }
    } catch (error) {
      console.error('Error loading brand data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('site_content')
        .upsert(
          {
            key: 'brand',
            value: data,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) throw error;

      await refreshContent();
      setMessage('Uğurla yadda saxlanıldı!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving brand data:', error);
      setMessage('Xəta baş verdi!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-gray-600">Yüklənir...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Brend Ayarları</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-gray-400"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saxlanılır...' : 'Yadda Saxla'}
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${message.includes('Uğurla') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loqo URL
            </label>
            <input
              type="url"
              value={data.logoUrl}
              onChange={(e) => setData({ ...data, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
            />
            {data.logoUrl && (
              <div className="mt-2">
                <img src={data.logoUrl} alt="Logo" className="h-16 object-contain" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Əsas Rəng
            </label>
            <div className="flex gap-4">
              <input
                type="color"
                value={data.primaryColor}
                onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                className="w-20 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={data.primaryColor}
                onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İkinci Rəng
            </label>
            <div className="flex gap-4">
              <input
                type="color"
                value={data.secondaryColor}
                onChange={(e) => setData({ ...data, secondaryColor: e.target.value })}
                className="w-20 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={data.secondaryColor}
                onChange={(e) => setData({ ...data, secondaryColor: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
