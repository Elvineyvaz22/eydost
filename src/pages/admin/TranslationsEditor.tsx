import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { Save } from 'lucide-react';
import { translations } from '../../translations';

export default function TranslationsEditor() {
  const { refreshContent } = useLanguage();
  const [azContent, setAzContent] = useState('');
  const [enContent, setEnContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: translationsData } = await supabase
        .from('site_content')
        .select('value')
        .eq('key', 'translations')
        .maybeSingle();

      if (translationsData?.value) {
        const value = translationsData.value as any;
        setAzContent(JSON.stringify(value.az || translations.az, null, 2));
        setEnContent(JSON.stringify(value.en || translations.en, null, 2));
      } else {
        setAzContent(JSON.stringify(translations.az, null, 2));
        setEnContent(JSON.stringify(translations.en, null, 2));
      }
    } catch (error) {
      console.error('Error loading translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const azParsed = JSON.parse(azContent);
      const enParsed = JSON.parse(enContent);

      const { error } = await supabase
        .from('site_content')
        .upsert(
          {
            key: 'translations',
            value: {
              az: azParsed,
              en: enParsed,
            },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) throw error;

      await refreshContent();
      setMessage('Uğurla yadda saxlanıldı!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving translations:', error);
      setMessage('Xəta baş verdi! JSON formatını yoxlayın.');
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
      <div className="max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tərcümələr (AZ / EN)</h1>
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

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AZ Məzmunu</h2>
            <textarea
              value={azContent}
              onChange={(e) => setAzContent(e.target.value)}
              rows={30}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none font-mono text-sm"
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">EN Məzmunu</h2>
            <textarea
              value={enContent}
              onChange={(e) => setEnContent(e.target.value)}
              rows={30}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none font-mono text-sm"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
