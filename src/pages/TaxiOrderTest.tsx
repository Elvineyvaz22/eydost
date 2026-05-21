/**
 * Maxim-style taxi order UI (test). Route: /taxi-order — not linked to /taxi webhook.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Flag, ChevronRight, LocateFixed } from 'lucide-react';
import { useLoadScript, GoogleMap, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';
import Seo from '../components/Seo';
import { useLanguage } from '../contexts/LanguageContext';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_LOADER_ID } from '../utils/googleMaps';

const defaultCenter = { lat: 40.409264, lng: 49.867092 };

const darkMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
];

type ActiveField = 'pickup' | 'dropoff';

const copy = {
  az: {
    pickupHint: 'Haradan',
    dropoffHint: 'Haraya',
    pickupPh: 'Götürülmə ünvanı',
    dropoffPh: 'Təyinat ünvanı',
    order: 'Sifariş et',
    selectBoth: 'Hər iki ünvanı seçin',
    mapLoading: 'Xəritə yüklənir...',
  },
  en: {
    pickupHint: 'Pickup',
    dropoffHint: 'Drop-off',
    pickupPh: 'Pickup address',
    dropoffPh: 'Destination',
    order: 'Order ride',
    selectBoth: 'Select both addresses',
    mapLoading: 'Loading map...',
  },
  ru: {
    pickupHint: 'Откуда',
    dropoffHint: 'Куда',
    pickupPh: 'Адрес посадки',
    dropoffPh: 'Пункт назначения',
    order: 'Заказать',
    selectBoth: 'Выберите оба адреса',
    mapLoading: 'Загрузка карты...',
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

  const [activeField, setActiveField] = useState<ActiveField>('pickup');
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

  const geocodeLatLng = useCallback((latlng: google.maps.LatLngLiteral, target: ActiveField) => {
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const short = results[0].formatted_address.split(',').slice(0, 2).join(',');
        if (target === 'pickup') setPickupAddress(short);
        else setDropoffAddress(short);
      }
    });
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
    const center = mapRef.current?.getCenter();
    if (!center) return;
    const latlng = { lat: center.lat(), lng: center.lng() };
    setMapCenter(latlng);
    if (activeField === 'pickup') {
      setPickupCoords(latlng);
      geocodeLatLng(latlng, 'pickup');
    } else {
      setDropoffCoords(latlng);
      geocodeLatLng(latlng, 'dropoff');
    }
  }, [activeField, geocodeLatLng]);

  const applyPlace = (place: google.maps.places.PlaceResult, target: ActiveField) => {
    const addr = place.formatted_address || place.name || '';
    if (target === 'pickup') setPickupAddress(addr);
    else setDropoffAddress(addr);
    if (place.geometry?.location) {
      const loc = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      if (target === 'pickup') setPickupCoords(loc);
      else setDropoffCoords(loc);
      setMapCenter(loc);
      mapRef.current?.panTo(loc);
    }
  };

  useEffect(() => {
    if (!pickupCoords || !dropoffCoords) {
      setDirections(null);
      return;
    }
    const ds = new google.maps.DirectionsService();
    ds.route(
      { origin: pickupCoords, destination: dropoffCoords, travelMode: google.maps.TravelMode.DRIVING },
      (result, status) => {
        setDirections(status === google.maps.DirectionsStatus.OK && result ? result : null);
      }
    );
  }, [pickupCoords, dropoffCoords]);

  const routeLeg = directions?.routes[0]?.legs[0];

  const handleOrder = () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      alert(t.selectBoth);
      return;
    }
    console.log('[taxi-order test]', { customerId, waId, pickup: pickupAddress, dropoff: dropoffAddress, pickupCoords, dropoffCoords });
    alert(language === 'az' ? 'Test sifarişi qeydə alındı.' : 'Test order logged.');
  };

  if (loadError) {
    return (
      <div className="min-h-[100dvh] bg-[#121212] text-white flex items-center justify-center p-6 text-center text-sm text-gray-400">
        Google Maps yüklənmədi. /taxi işləyirsə, səhifəni yeniləyin (Ctrl+Shift+R).
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#121212] text-white">
      <Seo title="Taxi order (test)" noIndex canonicalPath="/taxi-order" />

      {/* Full-screen map — same pattern as /taxi mobile */}
      <div className="absolute inset-0 z-0">
        {!isLoaded ? (
          <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-[#f5c518] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">{t.mapLoading}</p>
            </div>
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
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  polylineOptions: { strokeColor: '#f5c518', strokeWeight: 5 },
                  suppressMarkers: true,
                }}
              />
            )}
          </GoogleMap>
        )}
      </div>

      {/* Center pin */}
      {isLoaded && (
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full flex flex-col items-center pb-6">
          {routeLeg?.duration?.text && (
            <span className="mb-2 rounded-full bg-[#2a2a2a] px-3 py-1 text-xs font-bold text-[#f5c518]">
              {routeLeg.duration.text}
            </span>
          )}
          <MapPin
            className={`w-9 h-9 drop-shadow-lg ${activeField === 'pickup' ? 'text-red-500' : 'text-sky-400'}`}
            fill="currentColor"
          />
        </div>
      )}

      {isLoaded && (
        <button
          type="button"
          onClick={() => {
            if (!mapRef.current || !navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition((pos) => {
              const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              mapRef.current?.panTo(p);
              setMapCenter(p);
              if (activeField === 'pickup') {
                setPickupCoords(p);
                geocodeLatLng(p, 'pickup');
              } else {
                setDropoffCoords(p);
                geocodeLatLng(p, 'dropoff');
              }
            });
          }}
          className="absolute bottom-[340px] right-4 z-20 rounded-full bg-[#2a2a2a] p-3 shadow-lg border border-white/10"
          aria-label="My location"
        >
          <LocateFixed className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Bottom sheet — Maxim style, no service type row */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 pointer-events-none">
        <div className="pointer-events-auto rounded-t-3xl bg-[#1e1e1e] border border-white/10 px-4 pt-4 pb-5 shadow-[0_-12px_40px_rgba(0,0,0,0.6)] space-y-3">
          <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-1" />

          <div
            className={`rounded-2xl px-4 py-3 transition-colors ${
              activeField === 'pickup' ? 'bg-[#2d2d2d] ring-1 ring-red-500/40' : 'bg-[#252525]'
            }`}
          >
            <p className="text-[11px] text-gray-500 mb-1">{t.pickupHint}</p>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              {isLoaded && (
                <Autocomplete
                  onLoad={setPickupAutocomplete}
                  onPlaceChanged={() => pickupAutocomplete && applyPlace(pickupAutocomplete.getPlace(), 'pickup')}
                  className="flex-1 min-w-0"
                >
                  <input
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    onFocus={() => setActiveField('pickup')}
                    placeholder={t.pickupPh}
                    className="w-full bg-transparent text-[15px] font-medium text-white placeholder-gray-600 outline-none"
                  />
                </Autocomplete>
              )}
            </div>
          </div>

          <div
            className={`rounded-2xl px-4 py-3 transition-colors ${
              activeField === 'dropoff' ? 'bg-[#2d2d2d] ring-1 ring-sky-500/40' : 'bg-[#252525]'
            }`}
          >
            <p className="text-[11px] text-gray-500 mb-1">{t.dropoffHint}</p>
            <div className="flex items-center gap-3">
              <Flag className="w-4 h-4 text-sky-400 shrink-0" />
              {isLoaded && (
                <Autocomplete
                  onLoad={setDropoffAutocomplete}
                  onPlaceChanged={() => dropoffAutocomplete && applyPlace(dropoffAutocomplete.getPlace(), 'dropoff')}
                  className="flex-1 min-w-0"
                >
                  <input
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    onFocus={() => setActiveField('dropoff')}
                    placeholder={t.dropoffPh}
                    className="w-full bg-transparent text-[15px] font-medium text-white placeholder-gray-600 outline-none"
                  />
                </Autocomplete>
              )}
              <ChevronRight className="w-5 h-5 text-gray-600 shrink-0" />
            </div>
          </div>

          {routeLeg && (
            <p className="text-center text-xs text-gray-500">
              {routeLeg.distance?.text} · {routeLeg.duration?.text}
            </p>
          )}

          <button
            type="button"
            onClick={handleOrder}
            className="w-full rounded-2xl bg-[#f5c518] hover:bg-[#e6b616] text-[#1a1a1a] font-bold text-base py-4 active:scale-[0.98] transition-transform"
          >
            {t.order}
          </button>
        </div>
      </div>
    </div>
  );
}
