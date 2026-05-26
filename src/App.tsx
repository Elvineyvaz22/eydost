import { BrowserRouter, Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AdminProvider } from './contexts/AdminContext';
import Header from './components/Header';
import Hero from './components/Hero';
import StatsBar from './components/StatsBar';
import EsimPackages from './components/EsimPackages';
import HowEsimWorks from './components/HowEsimWorks';
import WhyEyDost from './components/WhyEyDost';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import CookieConsent from './components/CookieConsent';
import VercelAnalytics from './components/VercelAnalytics';
import CountryEsim from './pages/CountryEsim';
import RegionalEsim from './pages/RegionalEsim';
import Taxi from './pages/Taxi';
import TaxiOrderTest from './pages/TaxiOrderTest';
import AllPackages from './pages/AllPackages';
import EsimAccount from './pages/EsimAccount';
import Privacy from './pages/Privacy';
import About from './pages/About';
import Terms from './pages/Terms';
import Refund from './pages/Refund';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Seo from './components/Seo';
import TaxiLinkRedirect from './components/TaxiLinkRedirect';
import ProtectedRoute from './components/admin/ProtectedRoute';
import { PackagesProvider } from './contexts/PackagesContext';

const REGIONAL_SLUGS = new Set([
  'europe-esim',
  'asia-esim',
  'middle-east-africa-esim',
  'americas-esim',
  'global-esim',
]);

function EsimRouter() {
  const { slug } = useParams<{ slug: string }>();
  if (slug && REGIONAL_SLUGS.has(slug)) return <RegionalEsim />;
  return <CountryEsim />;
}

function EsimRootRouter() {
  const [params] = useSearchParams();
  const waId = params.get('wa_id');
  if (waId) return <EsimAccount waId={waId} />;
  return <AllPackages />;
}

const AdminLogin = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const EsimEditor = lazy(() => import('./pages/admin/EsimEditor'));
const EsimSync = lazy(() => import('./pages/admin/EsimSync'));
const TaxiEditor = lazy(() => import('./pages/admin/TaxiEditor'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const TranslationsEditor = lazy(() => import('./pages/admin/TranslationsEditor'));
const Messages = lazy(() => import('./pages/admin/Messages'));
const PricingEditor = lazy(() => import('./pages/admin/PricingEditor'));

const HOME_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://eydost.com/#organization",
    "name": "Ey Dost",
    "alternateName": ["Ey Dost — Global eSIM & Taxi", "eydost.com", "EyDost"],
    "url": "https://eydost.com",
    "logo": "https://eydost.com/og-image.png",
    "image": "https://eydost.com/og-image.png",
    "description": "Ey Dost — Your Global Travel Companion on WhatsApp. Two dedicated WhatsApp lines: one for taxi bookings (+994 99 200 04 44) and one for eSIM purchases (+994 99 201 01 17).",
    "areaServed": "Worldwide",
    "knowsLanguage": ["en", "az", "ru"],
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "name": "Taxi booking — WhatsApp",
        "description": "Dedicated WhatsApp line for taxi bookings, ride dispatch, and airport transfers in 850+ cities across 50+ countries.",
        "contactType": "Reservations",
        "telephone": "+994992000444",
        "url": "https://wa.me/994992000444",
        "areaServed": "Worldwide",
        "availableLanguage": ["English", "Azerbaijani", "Russian"]
      },
      {
        "@type": "ContactPoint",
        "name": "eSIM purchase & support — WhatsApp",
        "description": "Dedicated WhatsApp line for prepaid eSIM data plans, activation help, and plan questions for 150+ countries.",
        "contactType": "Sales",
        "productSupported": "eSIM data plans",
        "telephone": "+994992010117",
        "url": "https://wa.me/994992010117",
        "areaServed": "Worldwide",
        "availableLanguage": ["English", "Azerbaijani", "Russian"]
      },
      {
        "@type": "ContactPoint",
        "name": "General customer support — Email",
        "contactType": "customer support",
        "email": "info@eydost.com",
        "availableLanguage": ["English", "Azerbaijani", "Russian"]
      }
    ],
    "sameAs": [
      "https://wa.me/994992000444",
      "https://wa.me/994992010117",
      "https://t.me/eydost_esim_bot"
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://eydost.com/#website",
    "name": "Ey Dost",
    "url": "https://eydost.com",
    "inLanguage": ["en", "az", "ru"],
    "publisher": { "@id": "https://eydost.com/#organization" },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://eydost.com/esim?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is the WhatsApp number for ordering an eSIM from Ey Dost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "For eSIM purchases and activation help, contact Ey Dost on WhatsApp at +994 99 201 01 17 (https://wa.me/994992010117). The line is available 24/7 in English, Azerbaijani, and Russian."
        }
      },
      {
        "@type": "Question",
        "name": "What is the WhatsApp number for booking a taxi with Ey Dost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "For taxi bookings, ride dispatch, and airport transfers, contact Ey Dost on WhatsApp at +994 99 200 04 44 (https://wa.me/994992000444). The line is available 24/7 in English, Azerbaijani, and Russian, and works in 850+ cities across 50+ countries."
        }
      },
      {
        "@type": "Question",
        "name": "What is an eSIM and how do I install it?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "An eSIM is a digital SIM. Order from Ey Dost via WhatsApp +994 99 201 01 17, and we send you a QR code — scan it with your phone's camera and your internet is active in seconds."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to download an app to use Ey Dost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. Everything — both taxi bookings and eSIM purchases — happens 100% on WhatsApp. Use +994 99 200 04 44 for taxi or +994 99 201 01 17 for eSIM. Zero downloads."
        }
      },
      {
        "@type": "Question",
        "name": "In which cities is the Ey Dost taxi service available?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ey Dost taxi operates in 850+ cities across 50+ countries — including Azerbaijan, the UAE, the UK, France, Germany, Spain, Italy and many more. Open the Taxi page or message WhatsApp +994 99 200 04 44 to book."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use the Ey Dost eSIM in multiple countries?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. With our Regional or Global eSIM plans you can travel across multiple borders without losing connection or changing your eSIM. Ask about regional bundles on WhatsApp +994 99 201 01 17."
        }
      },
      {
        "@type": "Question",
        "name": "Are Ey Dost services available 24/7?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Both WhatsApp lines (+994 99 200 04 44 for taxi, +994 99 201 01 17 for eSIM) are staffed 24/7/365 with multilingual support."
        }
      }
    ]
  }
];

function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Seo jsonLd={HOME_JSON_LD} />
      <Header />
      <Hero />
      <StatsBar />
      <EsimPackages />
      <HowEsimWorks />
      <WhyEyDost />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AdminProvider>
        <PackagesProvider>
          <LanguageProvider>
            <CookieConsent />
            <VercelAnalytics />
            <TaxiLinkRedirect />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/about" element={<About />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/refund" element={<Refund />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/esim" element={<EsimRootRouter />} />
                <Route path="/taxi" element={<Taxi />} />
                <Route path="/taxi-order" element={<TaxiOrderTest />} />
                <Route
                  path="/admin/login"
                  element={
                    <>
                      <Seo title="Admin Login" noIndex canonicalPath="/admin/login" />
                      <AdminLogin />
                    </>
                  }
                />
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute>
                      <Seo title="Admin Dashboard" noIndex canonicalPath="/admin/dashboard" />
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/esim-sync"
                  element={
                    <ProtectedRoute>
                      <Seo title="eSIM Sync" noIndex canonicalPath="/admin/esim-sync" />
                      <EsimSync />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/esim"
                  element={
                    <ProtectedRoute>
                      <Seo title="Admin eSIM" noIndex canonicalPath="/admin/esim" />
                      <EsimEditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/taxi"
                  element={
                    <ProtectedRoute>
                      <Seo title="Admin Taxi" noIndex canonicalPath="/admin/taxi" />
                      <TaxiEditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/faq"
                  element={
                    <ProtectedRoute>
                      <Seo title="Admin FAQ" noIndex canonicalPath="/admin/faq" />
                      <Dashboard /> {/* Temporary placeholder */}
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/messages"
                  element={
                    <ProtectedRoute>
                      <Seo title="Admin Messages" noIndex canonicalPath="/admin/messages" />
                      <Messages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute>
                      <Seo title="Admin Analytics" noIndex canonicalPath="/admin/analytics" />
                      <Analytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/translations"
                  element={
                    <ProtectedRoute>
                      <Seo title="Admin Translations" noIndex canonicalPath="/admin/translations" />
                      <TranslationsEditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/pricing"
                  element={
                    <ProtectedRoute>
                      <Seo title="Admin Pricing" noIndex canonicalPath="/admin/pricing" />
                      <PricingEditor />
                    </ProtectedRoute>
                  }
                />
                <Route path="/:slug" element={<EsimRouter />} />
              </Routes>
            </Suspense>
          </LanguageProvider>
        </PackagesProvider>
      </AdminProvider>
    </BrowserRouter>
  );
}

export default App;
