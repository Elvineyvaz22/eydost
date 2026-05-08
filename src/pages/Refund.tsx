import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import Seo from '../components/Seo';
import { useLanguage } from '../contexts/LanguageContext';

const LAST_UPDATED = 'May 8, 2026';
const EMAIL = 'eydost@eydost.az';
const WA_LINK = 'https://wa.me/994992000444';

export default function Refund() {
  const { language } = useLanguage();
  const isAz = language === 'az';
  const isRu = language === 'ru';

  const title = isAz ? 'Geri Qaytarma Siyasəti' : isRu ? 'Политика возврата' : 'Refund Policy';
  const updated = isAz ? `Son yenilənmə: ${LAST_UPDATED}` : isRu ? `Последнее обновление: ${LAST_UPDATED}` : `Last updated: ${LAST_UPDATED}`;

  return (
    <div className="min-h-screen bg-white">
      <Seo title={title} description="Ey Dost Refund Policy — eSIM and taxi refund conditions." canonicalPath="/refund" noIndex={false} />
      <Header />
      <main className="pt-24 pb-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-400 mb-10">{updated}</p>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">eSIM Refund Policy</h2>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="font-semibold text-green-800 mb-1">✅ Full Refund Eligible</p>
                <ul className="list-disc pl-5 space-y-1 text-green-700">
                  <li>eSIM QR code has <strong>not been scanned</strong> and data has not been used.</li>
                  <li>Request made within <strong>24 hours</strong> of purchase.</li>
                  <li>Technical issue on our side preventing eSIM activation.</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="font-semibold text-amber-800 mb-1">⚠️ Partial Refund or Credit</p>
                <ul className="list-disc pl-5 space-y-1 text-amber-700">
                  <li>eSIM activated but <strong>less than 10% of data used</strong> — case-by-case review.</li>
                  <li>Network issues in specific regions that are beyond our control — credit may be offered.</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold text-red-800 mb-1">❌ Non-Refundable</p>
                <ul className="list-disc pl-5 space-y-1 text-red-700">
                  <li>eSIM QR code has been scanned and data usage has begun.</li>
                  <li>Device incompatibility (please verify eSIM support before purchase).</li>
                  <li>Customer changed travel plans.</li>
                  <li>Refund requested more than 7 days after purchase.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">Taxi Refund Policy</h2>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="font-semibold text-green-800 mb-1">✅ Full Refund Eligible</p>
                <ul className="list-disc pl-5 space-y-1 text-green-700">
                  <li>Cancellation made <strong>more than 30 minutes</strong> before scheduled pickup time.</li>
                  <li>Driver did not arrive within 15 minutes of confirmed pickup time.</li>
                  <li>Double charge occurred due to technical error.</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-semibold text-red-800 mb-1">❌ Non-Refundable</p>
                <ul className="list-disc pl-5 space-y-1 text-red-700">
                  <li>Cancellation within 30 minutes of pickup — cancellation fee applies.</li>
                  <li>No-show by customer.</li>
                  <li>Ride completed successfully.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">How to Request a Refund</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Message us on <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">WhatsApp</a> or email <a href={`mailto:${EMAIL}`} className="text-blue-600 hover:underline">{EMAIL}</a>.</li>
              <li>Include your order reference, purchase date, and reason for refund.</li>
              <li>Our team will review and respond within <strong>48 hours</strong>.</li>
              <li>Approved refunds are processed within <strong>5–10 business days</strong> to the original payment method.</li>
            </ol>
          </section>

          <section className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <p className="text-gray-600">Questions? Contact us at <a href={`mailto:${EMAIL}`} className="text-blue-600 hover:underline font-medium">{EMAIL}</a> or message on <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">WhatsApp</a>. We're available 24/7.</p>
          </section>

        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
