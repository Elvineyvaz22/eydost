/** Shared Google Maps loader config — same id on all pages so the script loads once. */
export const GOOGLE_MAPS_LIBRARIES: ('places' | 'geocoding')[] = ['places', 'geocoding'];
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
export const GOOGLE_MAPS_LOADER_ID = 'eydost-google-maps';

/** Mobile taxi — açıq fon, klinika/məktəb/POI adları görünsün */
export const TAXI_MOBILE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#eef0f3' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4b5563' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#1d4ed8' }] },
  { featureType: 'poi.medical', elementType: 'labels.text.fill', stylers: [{ color: '#dc2626' }] },
  { featureType: 'poi.school', elementType: 'labels.text.fill', stylers: [{ color: '#7c3aed' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'on' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#374151' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'on' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c8d8e8' }] },
];

/** Desktop taxi panel — tünd tema */
export const TAXI_DESKTOP_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#93c5fd' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
];

/** /taxi-order — tünd, POI ilə */
export const TAXI_ORDER_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#60a5fa' }] },
  { featureType: 'poi.medical', elementType: 'labels.text.fill', stylers: [{ color: '#f87171' }] },
  { featureType: 'poi.school', elementType: 'labels.text.fill', stylers: [{ color: '#a78bfa' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
];
