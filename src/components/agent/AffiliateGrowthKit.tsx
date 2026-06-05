import { Copy, Download, ExternalLink, Link2, MessageSquare, QrCode, Share2 } from 'lucide-react';

type AffiliateGrowthKitProps = {
  referralCode: string;
};

const destinationLinks = [
  { label: 'Turkey eSIM', path: '/turkey-esim' },
  { label: 'Europe eSIM', path: '/europe-esim' },
  { label: 'USA eSIM', path: '/usa-esim' },
  { label: 'Dubai eSIM', path: '/dubai-esim' },
  { label: 'Saudi Arabia eSIM', path: '/saudi-arabia-esim' },
  { label: 'World Cup eSIM', path: '/world-cup-esim' },
];

function buildLink(path: string, referralCode: string) {
  return `https://eydost.com${path}?ref=${encodeURIComponent(referralCode)}`;
}

function copyText(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }
}

export default function AffiliateGrowthKit({ referralCode }: AffiliateGrowthKitProps) {
  const mainLink = buildLink('/esim', referralCode);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(mainLink)}`;

  const messages = [
    {
      title: 'WhatsApp mesajı',
      text: `Salam! Xaricə gedirsinizsə, internetinizi əvvəlcədən Ey Dost eSIM ilə həll edə bilərsiniz. Proqram yükləməyə ehtiyac yoxdur — WhatsApp ilə paket seçirsiniz, QR kod sizə göndərilir. Link: ${mainLink} Promo kod: ${referralCode}`,
    },
    {
      title: 'Instagram Story',
      text: `Səyahətə çıxırsınız? 🌍 eSIM internetinizi WhatsApp ilə alın. App yoxdur, qeydiyyat yoxdur, QR kod dərhal gəlir. Kod: ${referralCode} ${mainLink}`,
    },
    {
      title: 'Instagram bio/link mətni',
      text: `Travel eSIM via WhatsApp ✈️ No app needed. Use my code: ${referralCode} ${mainLink}`,
    },
    {
      title: 'Tur agentliyi mətni',
      text: `Hörmətli müştəri, səfər zamanı internet üçün Ey Dost eSIM istifadə edə bilərsiniz. Paket WhatsApp üzərindən seçilir və QR kod göndərilir. Endirim kodu: ${referralCode}. Link: ${mainLink}`,
    },
  ];

  return (
    <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Hazır satış materialları</h2>
            <p className="text-sm text-gray-500 mt-1">Agent linkinizi paylaşmaq üçün hazır mətnləri kopyalayın.</p>
          </div>
          <MessageSquare className="w-6 h-6 text-orange-600" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {messages.map((item) => (
            <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-bold text-slate-900 mb-2">{item.title}</div>
              <p className="text-sm text-slate-600 leading-relaxed min-h-[96px]">{item.text}</p>
              <button
                type="button"
                onClick={() => copyText(item.text)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800"
              >
                <Copy className="w-4 h-4" />
                Kopyala
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">QR kod</h2>
              <p className="text-sm text-gray-500 mt-1">Ofisdə, story-də və flayerdə paylaşın.</p>
            </div>
            <QrCode className="w-6 h-6 text-orange-600" />
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex justify-center">
            <img src={qrUrl} alt="Ey Dost referral QR" className="w-48 h-48 rounded-xl bg-white p-2" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => copyText(mainLink)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 text-sm font-bold text-white hover:bg-blue-700">
              <Copy className="w-4 h-4" /> Link
            </button>
            <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-sm font-bold text-white hover:bg-slate-800">
              <Download className="w-4 h-4" /> QR aç
            </a>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Ölkəyə görə linklər</h2>
              <p className="text-sm text-gray-500 mt-1">Hər kampaniya üçün uyğun səhifəni paylaşın.</p>
            </div>
            <Share2 className="w-6 h-6 text-orange-600" />
          </div>
          <div className="space-y-3">
            {destinationLinks.map((item) => {
              const link = buildLink(item.path, referralCode);
              return (
                <div key={item.path} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900">{item.label}</div>
                      <div className="text-xs text-slate-500 truncate">{link}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button type="button" onClick={() => copyText(link)} className="rounded-lg bg-white border border-slate-200 p-2 text-slate-700 hover:bg-slate-100" aria-label="Copy link">
                        <Copy className="w-4 h-4" />
                      </button>
                      <a href={link} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white border border-slate-200 p-2 text-slate-700 hover:bg-slate-100" aria-label="Open link">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
