import { FormEvent, useMemo, useState } from 'react';
import { Mail, Send, Loader2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';

type SendStatus = 'idle' | 'sending' | 'sent' | 'error';

const DEFAULT_BODY = `Salam,

Mən Ey Dost komandasından yazıram.

Xaricə gedən turistlər üçün eSIM internet paketləri və airport transfer dəstəyi təqdim edirik. Tur agentlikləri ilə komissiya əsasında əməkdaşlıq edirik: sizin müştəri eSIM və ya transfer aldıqda satış sizə yazılır və komissiya hesablanır.

İstəsəniz, sizə qısa əməkdaşlıq şərtlərimizi və test linkini göndərə bilərəm.

Hörmətlə,
Ey Dost
https://eydost.com`;

export default function Outreach() {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('Ey Dost ilə əməkdaşlıq təklifi');
  const [body, setBody] = useState(DEFAULT_BODY);
  const [status, setStatus] = useState<SendStatus>('idle');
  const [feedback, setFeedback] = useState('');

  const recipientCount = useMemo(
    () => to.split(',').map((item) => item.trim()).filter(Boolean).length,
    [to]
  );

  const sendEmail = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setFeedback('');

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Admin sessiyası tapılmadı. Yenidən login olun.');

      const res = await fetch('/api/send-outreach-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to, cc, bcc, subject, body }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Göndərilmədi (${res.status})`);

      setStatus('sent');
      setFeedback(`Göndərildi. Qəbul edən: ${json.accepted?.join(', ') || to}`);
    } catch (err) {
      setStatus('error');
      setFeedback(err instanceof Error ? err.message : 'Email göndərilmədi');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Outreach Email</h1>
              <p className="text-gray-500 text-sm">info@eydost.com SMTP hesabı ilə tur agentlərinə email göndərin.</p>
            </div>
          </div>
        </header>

        <form onSubmit={sendEmail} className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Kimə</label>
            <input
              type="text"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="agency@example.com, sales@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
            />
            <p className="mt-1 text-xs text-gray-400">Bir neçə email üçün vergül istifadə edin. Hazırda: {recipientCount}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">CC</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">BCC</label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Mövzu</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Mesaj</label>
            <textarea
              required
              rows={13}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400 resize-y"
            />
          </div>

          {feedback && (
            <div className={`p-4 rounded-2xl text-sm font-semibold ${
              status === 'sent' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {feedback}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={status === 'sending'}
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-700 disabled:opacity-60 transition-colors"
            >
              {status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Göndər
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
