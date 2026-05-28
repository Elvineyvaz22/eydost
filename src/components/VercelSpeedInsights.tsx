import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';

/**
 * Core Web Vitals (RUM) — always on in production.
 * Not gated by marketing cookie consent (aggregated performance only).
 * Data is sent on tab blur/unload — navigate between pages after visiting.
 */
export default function VercelSpeedInsights() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.info(
        '[Speed Insights] Disabled in local dev. Deploy to Vercel and browse the live site to collect vitals.',
      );
    }
  }, []);

  if (import.meta.env.DEV) {
    return null;
  }

  return <SpeedInsights route={pathname} sampleRate={1} />;
}
