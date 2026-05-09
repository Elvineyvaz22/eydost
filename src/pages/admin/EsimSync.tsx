import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { RefreshCw, CheckCircle, AlertCircle, Package, Clock } from 'lucide-react';

const API_BASE = '/api/esim/admin';

export default function EsimSync() {
  const [status, setStatus] = useState<{
    synced: boolean;
    count?: number;
    synced_at?: string;
    message?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiKey = import.meta.env.VITE_APP_API_KEY || '';

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sync-status`, {
        headers: { 'X-API-Key': apiKey },
      });
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ synced: false, message: 'Backend əlçatmaz' });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sync`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`✅ ${data.count} paket uğurla Supabase-ə yükləndi`);
        fetchStatus();
      } else {
        setError(`❌ Xəta: ${data.detail || 'Bilinməyən xəta'}`);
      }
    } catch (e: any) {
      setError(`❌ Bağlantı xətası: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('az-AZ', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">eSIM Paket Sinxronizasiyası</h1>
        <p className="text-gray-500 mb-8">
          eSIM Access API-dən bütün paketləri çəkib Supabase-ə yaz. İctimai sayt oradan oxuyur.
        </p>

        {/* Status card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Son Sinxronizasiya</h2>
          </div>

          {loading ? (
            <p className="text-gray-400 text-sm">Yüklənir...</p>
          ) : status ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {status.synced
                  ? <CheckCircle className="w-5 h-5 text-green-500" />
                  : <AlertCircle className="w-5 h-5 text-amber-500" />}
                <span className={`font-medium ${status.synced ? 'text-green-700' : 'text-amber-700'}`}>
                  {status.synced ? 'Sinxronizasiya olunub' : 'Sinxronizasiya olunmayıb'}
                </span>
              </div>

              {status.synced && (
                <>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Package className="w-4 h-4" />
                    <span>{status.count?.toLocaleString()} paket</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(status.synced_at)}</span>
                  </div>
                </>
              )}

              {status.message && !status.synced && (
                <p className="text-sm text-amber-600">{status.message}</p>
              )}
            </div>
          ) : null}
        </div>

        {/* Sync button */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sinxronizasiya gedir...' : 'İndi Sinxronizasiya Et'}
        </button>

        <p className="text-sm text-gray-400 mt-3">
          eSIM Access API-dən bütün paketlər çəkiləcək (1–3 dəq çəkə bilər).
        </p>

        {/* Result messages */}
        {result && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-800 text-sm font-medium">
            {result}
          </div>
        )}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-800 text-sm font-medium">
            {error}
            <p className="mt-1 text-red-600 font-normal">
              Backend-in işlədiyindən əmin ol: <code className="bg-red-100 px-1 rounded">uvicorn main:app --reload --port 8000</code>
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
