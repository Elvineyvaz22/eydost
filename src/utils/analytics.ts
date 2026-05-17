/**
 * Global analytics utility for tracking user events.
 * Respects GDPR consent (analytics only when user accepted all cookies).
 */

import { getStoredConsent } from './cookieConsent';

export const trackEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window === 'undefined') return;
  if (getStoredConsent() !== 'all') return;
  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtag) return;
  gtag('event', eventName, params);
};

// Common event names for the Super App
export const EVENTS = {
  WHATSAPP_TAXI_ORDER: 'whatsapp_taxi_order',
  WHATSAPP_ESIM_ORDER: 'whatsapp_esim_order',
  WHATSAPP_CHAT_GENERAL: 'whatsapp_chat_general',
  ESIM_SEARCH: 'esim_search',
  CAR_CLASS_SELECTED: 'car_class_selected',
  TAB_SWITCH: 'tab_switch',
};
