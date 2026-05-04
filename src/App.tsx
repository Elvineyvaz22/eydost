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
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import CountryEsim from './pages/CountryEsim';
import RegionalEsim from './pages/RegionalEsim';
import Taxi from './pages/Taxi';
import AllPackages from './pages/AllPackages';
import Privacy from './pages/Privacy';
import Seo from './components/Seo';
import ProtectedRoute from './components/admin/ProtectedRoute';
import { PackagesProvider } from './contexts/PackagesContext';

const REGIONAL_SLUGS = ['europe-esim', 'asia-esim', 'middle-east-africa-esim', 'americas-esim', 'global-esim'];

function EsimRouter() {
  const { slug } = useParams<{ slug: string }>();
  if (slug && REGIONAL_SLUGS.includes(slug)) return <RegionalEsim />;
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

function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Seo />
      <Header />
      <Hero />
      <StatsBar />
      <EsimPackages />
      <HowEsimWorks />
      <WhyEyDost />
      <FAQ />
      <Contact />
      <Footer />
      <FloatingWhatsApp />
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
