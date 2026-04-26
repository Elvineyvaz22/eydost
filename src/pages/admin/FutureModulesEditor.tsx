import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function FutureModulesEditor() {
  const { refreshContent } = useLanguage();
  const [modules, setModules] = useState<string[]>([]);
  const [newModule, setNewModule] = useState('');
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
        .eq('key', 'future_modules')
        .maybeSingle();

      if (content?.value) {
        setModules(content.value as string[]);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
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
            key: 'future_modules',
            value: modules,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) throw error;

      await refreshContent();
      setMessage('Uğurla yadda saxlanıldı!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving modules:', error);
      setMessage('Xəta baş verdi!');
    } finally {
      setSaving(false);
    }
  };

  const addModule = () => {
    if (newModule.trim()) {
      setModules([...modules, newModule.trim()]);
      setNewModule('');
    }
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const updateModule = (index: number, value: string) => {
    const updated = [...modules];
    updated[index] = value;
    setModules(updated);
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
          <h1 className="text-3xl font-bold text-gray-900">Gələcək Modullar</h1>
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

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newModule}
              onChange={(e) => setNewModule(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addModule()}
              placeholder="Yeni modul əlavə et (məs: Otel Rezervasiyaları — 2026-da Gəlir)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
            />
            <button
              onClick={addModule}
              className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Əlavə Et
            </button>
          </div>

          <div className="space-y-2">
            {modules.map((module, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={module}
                  onChange={(e) => updateModule(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                />
                <button
                  onClick={() => removeModule(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
