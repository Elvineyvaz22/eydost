import Header from '../components/Header';
import Footer from '../components/Footer';
import FloatingWhatsApp from '../components/FloatingWhatsApp';
import Seo from '../components/Seo';
import { useLanguage } from '../contexts/LanguageContext';

const LAST_UPDATED = 'May 8, 2026';
const COMPANY = 'NURTEL ELEKTRİK MMC';
const EMAIL = 'info@eydost.com';

export default function Terms() {
  const { language } = useLanguage();
  const isAz = language === 'az';
  const isRu = language === 'ru';

  const title = isAz ? 'İstifadə Şərtləri' : isRu ? 'Условия использования' : 'Terms of Service';
  const updated = isAz ? `Son yenilənmə: ${LAST_UPDATED}` : isRu ? `Последнее обновление: ${LAST_UPDATED}` : `Last updated: ${LAST_UPDATED}`;

  return (
    <div className="min-h-screen bg-white">
      <Seo title={title} description="Ey Dost Terms of Service — eSIM and taxi booking conditions." canonicalPath="/terms" noIndex={false} />
      <Header />
      <main className="pt-24 pb-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-400 mb-10">{updated}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Agreement</h2>
            <p>By accessing or using Ey Dost services (including eydost.com and our WhatsApp channel), you agree to be bound by these Terms of Service. These terms are provided by <strong>{COMPANY}</strong>, the operator of Ey Dost. If you do not agree, please discontinue use immediately.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. Services</h2>
            <p>Ey Dost provides:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>eSIM data packages</strong> — digital mobile data plans for 150+ countries, delivered via WhatsApp as a QR code.</li>
              <li><strong>Taxi booking</strong> — ride facilitation service in 850+ cities across 50+ countries, coordinated through WhatsApp with third-party local fleet partners.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. eSIM Terms</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>eSIM plans are data-only and do not include a phone number.</li>
              <li>Validity periods begin upon first network connection in the destination country.</li>
              <li>Device compatibility is the customer's responsibility. Most modern smartphones (iPhone XS+, Samsung S20+, Pixel 3+) support eSIM.</li>
              <li>QR codes are personal and must not be shared or resold.</li>
              <li>Data speeds may vary based on local network conditions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Taxi Booking Terms</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ey Dost acts as an intermediary connecting customers with independent local taxi operators.</li>
              <li>Prices shown are estimates. Final fare may vary due to traffic, tolls, or airport fees.</li>
              <li>Ey Dost is not liable for driver conduct, vehicle condition, or delays caused by third-party operators.</li>
              <li>Taxi service is currently available in 850+ cities across 50+ countries. Availability may vary by location.</li>
              <li>For safety, driver details (name, vehicle, plate) are provided via WhatsApp upon booking confirmation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Payments</h2>
            <p>Payment links are sent via WhatsApp. By completing payment, you confirm acceptance of these terms. Prices are listed in USD unless otherwise stated. All transactions are processed through secure third-party payment providers.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">6. Prohibited Use</h2>
            <p>You may not use Ey Dost services to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Resell or redistribute eSIM QR codes.</li>
              <li>Abuse, harass, or threaten our support team.</li>
              <li>Use services for unlawful purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">7. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, {COMPANY} shall not be liable for any indirect, incidental, or consequential damages arising from use of our services, including but not limited to network outages, third-party driver actions, or device incompatibility.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">8. Governing Law</h2>
            <p>These terms are governed by the laws of the Republic of Azerbaijan. Any disputes shall be resolved in the courts of Sumqayıt, Azerbaijan.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">9. Contact</h2>
            <p>For any questions regarding these Terms, contact us at: <a href={`mailto:${EMAIL}`} className="text-blue-600 hover:underline">{EMAIL}</a></p>
          </section>

        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
