/**
 * Maxim-style taxi order (test). Mobile app flow: pickup → dropoff → confirm.
 * Route: /taxi-order
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, LocateFixed } from 'lucide-react';
import { useLoadScript, GoogleMap, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';
import Seo from '../components/Seo';
import { useLanguage } from '../contexts/LanguageContext';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_LOADER_ID } from '../utils/googleMaps';
import { formatGeocoderResult, formatPlaceAddress } from '../utils/addressFormat';

const defaultCenter = { lat: 40.409264, lng: 49.867092 };

const darkMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
];

type Step = 'select_pickup' | 'select_dropoff' | 'confirm_ride';

const copy = {
  az: {
    pickupQ: 'Haradan?',
    dropoffQ: 'Haraya?',
    pickupPh: 'Götürülmə ünvanı',
    dropoffPh: 'Təyinat ünvanı',
    confirmPickup: 'Götürmə yerini təsdiqlə',
    confirmDropoff: 'Təyinatı təsdiqlə',
    order: 'Sifariş et',
    mapLoading: 'Xəritə yüklənir...',
    distance: 'Məsafə',
  },
  en: {
    pickupQ: 'Pickup?',
    dropoffQ: 'Drop-off?',
    pickupPh: 'Pickup address',
    dropoffPh: 'Destination',
    confirmPickup: 'Confirm pickup',
    confirmDropoff: 'Confirm destination',
    order: 'Order ride',
    mapLoading: 'Loading map...',
    distance: 'Distance',
  },
  ru: {
    pickupQ: 'Откуда?',
    dropoffQ: 'Куда?',
    pickupPh: 'Адрес посадки',
    dropoffPh: 'Пункт назначения',
    confirmPickup: 'Подтвердить посадку',
    confirmDropoff: 'Подтвердить назначение',
    order: 'Заказать',
    mapLoading: 'Загрузка карты...',
    distance: 'Расстояние',
  },
};

export default function TaxiOrderTest() {
  const { language } = useLanguage();
  const t = copy[language] ?? copy.az;
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('id') || searchParams.get('bookingId');
  const waId = searchParams.get('wa_id');

  const { isLoaded, loadError } = useLoadScript({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [step, setStep] = useState<Step>('select_pickup');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [pickupAutocomplete, setPickupAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [dropoffAutocomplete, setDropoffAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const geocodeLatLng = useCallback((latlng: google.maps.LatLngLiteral, target: 'pickup' | 'dropoff') => {
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const address = formatGeocoderResult(results[0]);
        if (target === 'pickup') setPickupAddress(address);
        else setDropoffAddress(address);
      }
    });
  }, []);

  const calculateRoute = useCallback((origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral) => {
    const ds = new google.maps.DirectionsService();
    ds.route(
      { origin, destination, travelMode: google.maps.TravelMode.DRIVING },
      (result, status) => {
        setDirections(status === google.maps.DirectionsStatus.OK && result ? result : null);
      }
    );
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMapCenter(userPos);
          setPickupCoords(userPos);
          map.panTo(userPos);
          geocodeLatLng(userPos, 'pickup');
        },
        () => {
          setPickupCoords(defaultCenter);
          geocodeLatLng(defaultCenter, 'pickup');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [geocodeLatLng]);

  const onMapDragEnd = useCallback(() => {
    if (!mapRef.current || step === 'confirm_ride') return;
    const center = mapRef.current.getCenter();
    if (!center) return;
    const latlng = { lat: center.lat(), lng: center.lng() };
    setMapCenter(latlng);
    const target = step === 'select_pickup' ? 'pickup' : 'dropoff';
    if (target === 'pickup') {
      setPickupCoords(latlng);
      geocodeLatLng(latlng, 'pickup');
    } else {
      setDropoffCoords(latlng);
      geocodeLatLng(latlng, 'dropoff');
    }
  }, [step, geocodeLatLng]);

  const handlePickupPlaceChanged = () => {
    if (!pickupAutocomplete) return;
    const place = pickupAutocomplete.getPlace();
    setPickupAddress(formatPlaceAddress(place));
    if (place.geometry?.location) {
      const loc = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
      setPickupCoords(loc);
      setMapCenter(loc);
      mapRef.current?.panTo(loc);
    }
  };

  const handleDropoffPlaceChanged = () => {
    if (!dropoffAutocomplete) return;
    const place = dropoffAutocomplete.getPlace();
    setDropoffAddress(formatPlaceAddress(place));
    if (place.geometry?.location) {
      const loc = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
      setDropoffCoords(loc);
      setMapCenter(loc);
      mapRef.current?.panTo(loc);
    }
  };

  const handleNext = () => {
    if (step === 'select_pickup') {
      if (!pickupAddress.trim()) return;
      setStep('select_dropoff');
      if (dropoffCoords) mapRef.current?.panTo(dropoffCoords);
      else if (pickupCoords) mapRef.current?.panTo(pickupCoords);
    } else if (step === 'select_dropoff') {
      if (!dropoffAddress.trim()) return;
      setStep('confirm_ride');
      if (pickupCoords && dropoffCoords) calculateRoute(pickupCoords, dropoffCoords);
    }
  };

  const handleBack = () => {
    if (step === 'select_dropoff') {
      setStep('select_pickup');
      if (pickupCoords) mapRef.current?.panTo(pickupCoords);
    } else if (step === 'confirm_ride') {
      setStep('select_dropoff');
      setDirections(null);
      if (dropoffCoords) mapRef.current?.panTo(dropoffCoords);
    }
  };

  const locateUser = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      mapRef.current?.panTo(p);
      setMapCenter(p);
      if (step === 'select_pickup') {
        setPickupCoords(p);
        geocodeLatLng(p, 'pickup');
      } else if (step === 'select_dropoff') {
        setDropoffCoords(p);
        geocodeLatLng(p, 'dropoff');
      }
    });
  };

  const handleOrder = () => {
    console.log('[taxi-order]', { customerId, waId, pickupAddress, dropoffAddress, pickupCoords, dropoffCoords });
    alert(language === 'az' ? 'Sifariş qeydə alındı (test).' : 'Order logged (test).');
  };

  const routeLeg = directions?.routes[0]?.legs[0];
  const pinPickup = step === 'select_pickup';
  const showMapPin = step !== 'confirm_ride';

  if (loadError) {
    return (
      <div className="min-h-[100dvh] bg-[#121212] text-white flex items-center justify-center p-6 text-center text-sm text-gray-400">
        Google Maps yüklənmədi.
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#121212] text-white">
      <Seo title="Taxi order (test)" noIndex canonicalPath="/taxi-order" />

      {/* Full-screen map */}
      <div className="absolute inset-0 z-0">
        {!isLoaded ? (
          <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
            <div className="w-12 h-12 border-4 border-[#f5c518] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={16}
            onLoad={onMapLoad}
            onDragEnd={onMapDragEnd}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              gestureHandling: 'greedy',
              styles: darkMapStyle,
            }}
          >
            {step === 'confirm_ride' && directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  polylineOptions: { strokeColor: '#f5c518', strokeWeight: 5 },
                  suppressMarkers: false,
                }}
              />
            )}
          </GoogleMap>
        )}
      </div>

      {/* Map pin (steps 1–2: drag map to set point) */}
      {isLoaded && showMapPin && (
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full flex flex-col items-center pb-6">
          <span className="mb-2 rounded-full bg-black/80 px-3 py-1.5 text-xs font-bold whitespace-nowrap">
            {pinPickup ? t.pickupQ : t.dropoffQ}
          </span>
          <div className="relative flex flex-col items-center">
            <div
              className={`w-6 h-6 rounded-full border-4 border-white shadow-lg z-10 ${
                pinPickup ? 'bg-red-500' : 'bg-sky-500'
              }`}
            />
            <div className="w-1 h-8 bg-black" />
          </div>
        </div>
      )}

      {step !== 'select_pickup' && (
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-4 left-4 z-20 rounded-full bg-[#2a2a2a] p-3 shadow-lg border border-white/10"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {isLoaded && step !== 'confirm_ride' && (
        <button
          type="button"
          onClick={locateUser}
          className="absolute bottom-[300px] right-4 z-20 rounded-full bg-[#2a2a2a] p-3 shadow-lg border border-white/10"
          aria-label="My location"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      )}

      {/* Bottom sheet — one step at a time (like Maxim app) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 pointer-events-none">
        <div className="pointer-events-auto rounded-t-3xl bg-[#1e1e1e] border border-white/10 p-5 shadow-[0_-12px_40px_rgba(0,0,0,0.65)]">
          <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />

          {step === 'select_pickup' && (
            <div>
              <h2 className="text-xl font-bold mb-4">{t.pickupQ}</h2>
              <div className="flex items-center gap-3 bg-[#252525] rounded-2xl px-4 py-3 mb-5 border border-red-500/20">
                <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                {isLoaded && (
                  <Autocomplete onLoad={setPickupAutocomplete} onPlaceChanged={handlePickupPlaceChanged} className="flex-1 min-w-0">
                    <input
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder={t.pickupPh}
                      className="w-full bg-transparent text-base font-semibold outline-none placeholder-gray-600"
                    />
                  </Autocomplete>
                )}
              </div>
              <button
                type="button"
                onClick={handleNext}
                disabled={!pickupAddress.trim()}
                className="w-full py-4 rounded-xl bg-[#f5c518] text-[#1a1a1a] font-bold disabled:opacity-40 active:scale-[0.98]"
              >
                {t.confirmPickup}
              </button>
            </div>
          )}

          {step === 'select_dropoff' && (
            <div>
              <h2 className="text-xl font-bold mb-4">{t.dropoffQ}</h2>
              <div className="flex items-center gap-3 bg-[#252525] rounded-2xl px-4 py-3 mb-5 border border-sky-500/20">
                <span className="w-3 h-3 rounded-sm bg-sky-500 shrink-0" />
                {isLoaded && (
                  <Autocomplete onLoad={setDropoffAutocomplete} onPlaceChanged={handleDropoffPlaceChanged} className="flex-1 min-w-0">
                    <input
                      value={dropoffAddress}
                      onChange={(e) => setDropoffAddress(e.target.value)}
                      placeholder={t.dropoffPh}
                      className="w-full bg-transparent text-base font-semibold outline-none placeholder-gray-600"
                    />
                  </Autocomplete>
                )}
              </div>
              <button
                type="button"
                onClick={handleNext}
                disabled={!dropoffAddress.trim()}
                className="w-full py-4 rounded-xl bg-[#f5c518] text-[#1a1a1a] font-bold disabled:opacity-40 active:scale-[0.98]"
              >
                {t.confirmDropoff}
              </button>
            </div>
          )}

          {step === 'confirm_ride' && (
            <div>
              <div className="space-y-2 mb-4 bg-[#252525] rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <p className="text-sm font-medium leading-snug">{pickupAddress}</p>
                </div>
                <div className="w-px h-3 bg-gray-600 ml-1" />
                <div className="flex items-start gap-3">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 mt-1.5 shrink-0" />
                  <p className="text-sm font-medium leading-snug">{dropoffAddress}</p>
                </div>
              </div>
              {routeLeg && (
                <p className="text-center text-sm text-gray-400 mb-4">
                  {routeLeg.distance?.text} · {routeLeg.duration?.text}
                </p>
              )}
              <button
                type="button"
                onClick={handleOrder}
                className="w-full py-4 rounded-xl bg-[#f5c518] text-[#1a1a1a] font-bold active:scale-[0.98]"
              >
                {t.order}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
