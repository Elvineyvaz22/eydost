/** Shared Google Maps loader config — same id on all pages so the script loads once. */
export const GOOGLE_MAPS_LIBRARIES: ('places' | 'geocoding')[] = ['places', 'geocoding'];
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
export const GOOGLE_MAPS_LOADER_ID = 'eydost-google-maps';
