import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { HelmetProvider } from 'react-helmet-async';
import { ToastContainer } from './components/Toast.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
      <ToastContainer />
    </HelmetProvider>
  </StrictMode>
);

// Signal to the build-time prerender script that React has mounted and
// react-helmet-async has flushed <title>/<meta>/<script type="application/ld+json">
// into the document head. The static server only listens for `render-event`.
if (typeof window !== 'undefined') {
  const fire = () => {
    (window as unknown as { __APP_RENDERED__?: boolean }).__APP_RENDERED__ = true;
    document.dispatchEvent(new Event('render-event'));
  };
  // Two RAFs guarantee at least one paint has happened (helmet has been flushed).
  requestAnimationFrame(() => requestAnimationFrame(fire));
}
