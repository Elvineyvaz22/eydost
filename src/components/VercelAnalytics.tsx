import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { getStoredConsent } from '../utils/cookieConsent';

/** Vercel Web Analytics + Speed Insights — only after user accepts all cookies (EU). */
export default function VercelAnalytics() {
  const [enabled, setEnabled] = useState(() => getStoredConsent() === 'all');

  useEffect(() => {
    const sync = () => setEnabled(getStoredConsent() === 'all');
    window.addEventListener('eydost:consent', sync);
    return () => window.removeEventListener('eydost:consent', sync);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Analytics mode="production" />
      <SpeedInsights />
    </>
  );
}
