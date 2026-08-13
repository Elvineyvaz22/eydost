import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getStoredConsent } from '../utils/cookieConsent';

const META_PIXEL_ID = '1022692430421325';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
    __eydostMetaPixelLoaded?: boolean;
    __eydostMetaLastPage?: string;
  }
}

function loadMetaPixel() {
  if (typeof window === 'undefined') return;
  if (window.__eydostMetaPixelLoaded) return;

  window.__eydostMetaPixelLoaded = true;

  if (window.fbq) return;

  const fbq = (window.fbq = function (...args: unknown[]) {
    (fbq as any).callMethod
      ? (fbq as any).callMethod.apply(fbq, args)
      : (fbq as any).queue.push(args);
  } as any);

  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  const firstScript = document.getElementsByTagName('script')[0];
  firstScript.parentNode?.insertBefore(script, firstScript);

  fbq('init', META_PIXEL_ID);
  fbq('track', 'PageView');
}

export default function MetaPixel() {
  const location = useLocation();
  const [enabled, setEnabled] = useState(() => getStoredConsent() === 'all');

  useEffect(() => {
    const sync = () => setEnabled(getStoredConsent() === 'all');
    window.addEventListener('eydost:consent', sync);
    return () => window.removeEventListener('eydost:consent', sync);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    loadMetaPixel();

    const page = `${location.pathname}${location.search}${location.hash}`;
    if (window.__eydostMetaLastPage === page) return;
    window.__eydostMetaLastPage = page;
    window.fbq?.('track', 'PageView');
  }, [enabled, location.pathname, location.search, location.hash]);

  return null;
}
