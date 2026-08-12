import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getStoredConsent } from '../utils/cookieConsent';

const TIKTOK_PIXEL_ID = 'D9U4UCBC77U8CMCCG18G';

type TikTokQueue = unknown[][] & {
  methods?: string[];
  setAndDefer?: (target: TikTokQueue, method: string) => void;
  instance?: (pixelId: string) => TikTokQueue;
  load?: (pixelId: string, options?: Record<string, unknown>) => void;
  page?: () => void;
  track?: (eventName: string, params?: Record<string, unknown>) => void;
  _i?: Record<string, TikTokQueue>;
  _t?: Record<string, number>;
  _o?: Record<string, Record<string, unknown>>;
  _u?: string;
};

declare global {
  interface Window {
    TiktokAnalyticsObject?: string;
    ttq?: TikTokQueue;
    __eydostTikTokPixelLoaded?: boolean;
    __eydostTikTokLastPage?: string;
  }
}

function loadTikTokPixel() {
  if (typeof window === 'undefined') return;
  if (window.__eydostTikTokPixelLoaded) return;

  window.__eydostTikTokPixelLoaded = true;
  const analyticsObject = 'ttq';
  window.TiktokAnalyticsObject = analyticsObject;

  const ttq = (window.ttq = window.ttq || ([] as unknown as TikTokQueue));
  ttq.methods = [
    'page',
    'track',
    'identify',
    'instances',
    'debug',
    'on',
    'off',
    'once',
    'ready',
    'alias',
    'group',
    'enableCookie',
    'disableCookie',
    'holdConsent',
    'revokeConsent',
    'grantConsent',
  ];

  ttq.setAndDefer = (target, method) => {
    target[method as keyof TikTokQueue] = ((...args: unknown[]) => {
      target.push([method, ...args]);
    }) as never;
  };

  for (let i = 0; i < ttq.methods.length; i += 1) {
    ttq.setAndDefer(ttq, ttq.methods[i]);
  }

  ttq.instance = (pixelId) => {
    ttq._i = ttq._i || {};
    const instance = ttq._i[pixelId] || ([] as unknown as TikTokQueue);
    for (let i = 0; i < (ttq.methods || []).length; i += 1) {
      ttq.setAndDefer?.(instance, ttq.methods[i]);
    }
    ttq._i[pixelId] = instance;
    return instance;
  };

  ttq.load = (pixelId, options = {}) => {
    const url = 'https://analytics.tiktok.com/i18n/pixel/events.js';
    ttq._i = ttq._i || {};
    ttq._i[pixelId] = [] as unknown as TikTokQueue;
    ttq._i[pixelId]._u = url;
    ttq._t = ttq._t || {};
    ttq._t[pixelId] = +new Date();
    ttq._o = ttq._o || {};
    ttq._o[pixelId] = options;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `${url}?sdkid=${pixelId}&lib=${analyticsObject}`;
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(script, firstScript);
  };

  ttq.load(TIKTOK_PIXEL_ID);
}

export default function TikTokPixel() {
  const location = useLocation();
  const [enabled, setEnabled] = useState(() => getStoredConsent() === 'all');

  useEffect(() => {
    const sync = () => setEnabled(getStoredConsent() === 'all');
    window.addEventListener('eydost:consent', sync);
    return () => window.removeEventListener('eydost:consent', sync);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    loadTikTokPixel();

    const page = `${location.pathname}${location.search}${location.hash}`;
    if (window.__eydostTikTokLastPage === page) return;
    window.__eydostTikTokLastPage = page;
    window.ttq?.page?.();
  }, [enabled, location.pathname, location.search, location.hash]);

  return null;
}
