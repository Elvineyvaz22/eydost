/**
 * Global analytics utility for tracking user events.
 * This wrapper ensures that gtag is called only if it's available.
 */

export const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
    console.log(`[Analytics] Tracked: ${eventName}`, params);
  }
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
