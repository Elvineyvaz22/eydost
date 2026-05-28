import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SCRIPT_SELECTOR = 'script[src*="speed-insights/script.js"]';

function isLocalHost(): boolean {
  if (typeof window === 'undefined') return true;
  return /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);
}

/** Updates SPA route on the Vercel Speed Insights script (loaded from index.html). */
export default function VercelSpeedInsights() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (isLocalHost()) return;

    const script = document.querySelector(SCRIPT_SELECTOR) as HTMLScriptElement | null;
    if (script) {
      script.dataset.route = pathname;
    }
  }, [pathname]);

  return null;
}
