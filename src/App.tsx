import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AdminProvider } from './contexts/AdminContext';
import Header from './components/Header';
import Hero from './components/Hero';
import StatsBar from './components/StatsBar';
import EsimPackages from './components/EsimPackages';
import HowEsimWorks from './components/HowEsimWorks';
import WhyEyDost from './components/WhyEyDost';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import CountryEsim from './pages/CountryEsim';
import RegionalEsim from './pages/RegionalEsim';
import Taxi from './pages/Taxi';
import AllPackages from './pages/AllPackages';
import Privacy from './pages/Privacy';
import About from './pages/About';
import Terms from './pages/Terms';
import Refund from './pages/Refund';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Seo from './components/Seo';
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

const AdminLogin = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const EsimEditor = lazy(() => import('./pages/admin/EsimEditor'));
const TaxiEditor = lazy(() => import('./pages/admin/TaxiEditor'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const TranslationsEditor = lazy(() => import('./pages/admin/TranslationsEditor'));
const Messages = lazy(() => import('./pages/admin/Messages'));
const PricingEditor = lazy(() => import('./pages/admin/PricingEditor'));

const HOME_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Ey Dost",
    "url": "https://eydost.com",
    "logo": "https://eydost.com/og-image.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "availableLanguage": ["Azerbaijani", "English", "Russian"],
      "contactOption": "TollFree"
    },
    "sameAs": [
      "https://t.me/eydost_esim_bot",
      "https://wa.me/994992000444"
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Ey Dost",
    "url": "https://eydost.com",
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
        "name": "What is an eSIM and how do I install it?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "An eSIM is a digital SIM. Once you buy a plan via WhatsApp, we send you a QR code. Just scan it with your phone's camera, and your internet will be active in seconds!"
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to download an app?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No! Everything from ordering a taxi to buying internet packages is done 100% via WhatsApp. Zero downloads, zero hassle."
        }
      },
      {
        "@type": "Question",
        "name": "In which European cities is the taxi service available?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our taxi service operates in 500+ cities across Europe including London, Paris, Berlin, Amsterdam, Barcelona, Rome, Vienna, Prague and many more. Just open the Taxi page and book via WhatsApp."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use the eSIM in multiple countries?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! If you purchase our Regional or Global eSIM packages, you can travel across multiple borders without losing connection or changing your eSIM."
        }
      },
      {
        "@type": "Question",
        "name": "Are your services available 24/7?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. Our WhatsApp automated system and support agents are available around the clock, 24/7/365, to assist you anywhere in the world."
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
      <Testimonials />
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
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/about" element={<About />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/refund" element={<Refund />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/esim" element={<AllPackages />} />
                <Route path="/taxi" element={<Taxi />} />
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
