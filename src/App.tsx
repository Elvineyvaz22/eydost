import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AdminProvider } from './contexts/AdminContext';
import Header from './components/Header';
import Hero from './components/Hero';
import StatsBar from './components/StatsBar';
import EsimPackages from './components/EsimPackages';
import TaxiSection from './components/TaxiSection';
import HowEsimWorks from './components/HowEsimWorks';
import WhyEyDost from './components/WhyEyDost';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import CountryEsim from './pages/CountryEsim';
import RegionalEsim from './pages/RegionalEsim';
import AdminLogin from './pages/admin/Login';
import Taxi from './pages/Taxi';
import AllPackages from './pages/AllPackages';

const REGIONAL_SLUGS = ['europe-esim', 'asia-esim', 'middle-east-africa-esim', 'americas-esim', 'global-esim'];

function EsimRouter() {
  const { slug } = useParams<{ slug: string }>();
  if (slug && REGIONAL_SLUGS.includes(slug)) return <RegionalEsim />;
  return <CountryEsim />;
}
import Dashboard from './pages/admin/Dashboard';
import EsimEditor from './pages/admin/EsimEditor';
import TaxiEditor from './pages/admin/TaxiEditor';
import Analytics from './pages/admin/Analytics';
import TranslationsEditor from './pages/admin/TranslationsEditor';
import ProtectedRoute from './components/admin/ProtectedRoute';

function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <StatsBar />
      <EsimPackages />
      <TaxiSection />
      <HowEsimWorks />
      <WhyEyDost />
      <FAQ />
      <Contact />
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

import { PackagesProvider } from './contexts/PackagesContext';

function App() {
  return (
    <BrowserRouter>
      <AdminProvider>
        <PackagesProvider>
          <LanguageProvider>
            <Routes>
              {/* ... routes ... */}
              <Route path="/" element={<HomePage />} />
              <Route path="/packages" element={<AllPackages />} />
              <Route path="/taxi" element={<Taxi />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/esim"
                element={
                  <ProtectedRoute>
                    <EsimEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/taxi"
                element={
                  <ProtectedRoute>
                    <TaxiEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/faq"
                element={
                  <ProtectedRoute>
                    <Dashboard /> {/* Temporary placeholder */}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/translations"
                element={
                  <ProtectedRoute>
                    <TranslationsEditor />
                  </ProtectedRoute>
                }
              />
              <Route path="/:slug" element={<EsimRouter />} />
            </Routes>
          </LanguageProvider>
        </PackagesProvider>
      </AdminProvider>
    </BrowserRouter>
  );
}

export default App;
