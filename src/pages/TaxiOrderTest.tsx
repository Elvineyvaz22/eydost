/**
 * Maxim-style taxi order UI (test only). Not linked to /taxi or production webhook flow.
 * Route: /taxi-order
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Flag, ChevronRight, LocateFixed } from 'lucide-react';
import { useLoadScript, GoogleMap, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';
import Seo from '../components/Seo';
import { useLanguage } from '../contexts/LanguageContext';

const libraries: ('places' | 'geocoding')[] = ['places', 'geocoding'];
const defaultCenter = { lat: 40.409264, lng: 49.867092 };
const MAP_HEIGHT = '52vh';
const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

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
    eta: 'təxminən',
    mapLoading: 'Xəritə yüklənir...',
    mapError: 'Google Maps açılmadı. Vercel-də VITE_GOOGLE_MAPS_API_KEY təyin edin.',
  },
  en: {
    pickupHint: 'Pickup',
    dropoffHint: 'Drop-off',
    pickupPh: 'Pickup address',
    dropoffPh: 'Destination',
    order: 'Order ride',
    selectBoth: 'Select both addresses',
    eta: 'approx.',
    mapLoading: 'Loading map...',
    mapError: 'Google Maps failed to load. Set VITE_GOOGLE_MAPS_API_KEY on Vercel.',
  },
  ru: {
    pickupHint: 'Откуда',
    dropoffHint: 'Куда',
    pickupPh: 'Адрес посадки',
    dropoffPh: 'Пункт назначения',
    order: 'Заказать',
    selectBoth: 'Выберите оба адреса',
    eta: 'примерно',
    mapLoading: 'Загрузка карты...',
    mapError: 'Карта не загрузилась. Укажите VITE_GOOGLE_MAPS_API_KEY в Vercel.',
  },
};

export default function TaxiOrderTest() {
  const { language } = useLanguage();
  const t = copy[language] ?? copy.az;
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('id') || searchParams.get('bookingId');
  const waId = searchParams.get('wa_id');

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: mapsApiKey,
    libraries,
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

  const syncMapCenterToField = useCallback(() => {
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
  const etaText = routeLeg?.duration?.text;

  const handleOrder = () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      alert(t.selectBoth);
      return;
    }
    console.log('[taxi-order test]', {
      customerId,
      waId,
      pickup: pickupAddress,
      dropoff: dropoffAddress,
      pickupCoords,
      dropoffCoords,
    });
    alert(language === 'az' ? 'Test sifarişi qeydə alındı (konsol).' : 'Test order logged (console).');
  };

  const mapReady = isLoaded && !loadError && Boolean(mapsApiKey);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#121212] text-white flex flex-col">
      <Seo title="Taxi order (test)" noIndex canonicalPath="/taxi-order" />

      {/* Map — fixed height so Google Maps always renders */}
      <div
        className="relative w-full shrink-0"
        style={{ height: MAP_HEIGHT, minHeight: 280 }}
      >
        {mapReady ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={16}
            onLoad={onMapLoad}
            onDragEnd={syncMapCenterToField}
            onIdle={syncMapCenterToField}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              styles: darkMapStyle,
              gestureHandling: 'greedy',
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
        ) : (
          <div className="w-full h-full bg-[#1a1a1a] flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="w-10 h-10 border-2 border-[#f5c518] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">
              {loadError || !mapsApiKey ? t.mapError : t.mapLoading}
            </p>
          </div>
        )}

        {/* Center pin */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="mb-8 flex flex-col items-center">
            {etaText && (
              <span className="mb-1 rounded-md bg-[#2a2a2a] px-2 py-0.5 text-xs font-semibold text-[#f5c518]">
                {etaText}
              </span>
            )}
            <MapPin
              className={`w-10 h-10 drop-shadow-lg ${activeField === 'pickup' ? 'text-red-500' : 'text-sky-400'}`}
              fill="currentColor"
            />
          </div>
        </div>

        {mapReady && (
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
          className="absolute right-3 top-3 rounded-full bg-[#2a2a2a]/90 p-3 shadow-lg border border-white/10"
          aria-label="My location"
        >
          <LocateFixed className="w-5 h-5 text-white" />
        </button>
        )}
      </div>

      {/* Bottom panel — no service type row (Maxim sarı taxi / teslimat / kamyon) */}
      <div className="shrink-0 rounded-t-3xl bg-[#1e1e1e] border-t border-white/5 px-4 pt-4 pb-8 space-y-3 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setActiveField('pickup');
            if (pickupCoords) mapRef.current?.panTo(pickupCoords);
          }}
          onKeyDown={(e) => e.key === 'Enter' && setActiveField('pickup')}
          className={`w-full text-left rounded-2xl px-4 py-3.5 transition-colors cursor-pointer ${
            activeField === 'pickup' ? 'bg-[#2d2d2d] ring-1 ring-red-500/40' : 'bg-[#252525]'
          }`}
        >
          <p className="text-[11px] text-gray-500 mb-1">{t.pickupHint}</p>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 shrink-0 ring-2 ring-red-500/30" />
            {isLoaded ? (
              <Autocomplete
                onLoad={setPickupAutocomplete}
                onPlaceChanged={() => pickupAutocomplete && applyPlace(pickupAutocomplete.getPlace(), 'pickup')}
              >
                <input
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  onFocus={() => setActiveField('pickup')}
                  placeholder={t.pickupPh}
                  className="flex-1 bg-transparent text-[15px] font-medium text-white placeholder-gray-600 outline-none min-w-0"
                />
              </Autocomplete>
            ) : (
              <span className="text-gray-600 text-sm">...</span>
            )}
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setActiveField('dropoff');
            if (dropoffCoords) mapRef.current?.panTo(dropoffCoords);
          }}
          onKeyDown={(e) => e.key === 'Enter' && setActiveField('dropoff')}
          className={`w-full text-left rounded-2xl px-4 py-3.5 transition-colors cursor-pointer ${
            activeField === 'dropoff' ? 'bg-[#2d2d2d] ring-1 ring-sky-500/40' : 'bg-[#252525]'
          }`}
        >
          <p className="text-[11px] text-gray-500 mb-1">{t.dropoffHint}</p>
          <div className="flex items-center gap-3">
            <Flag className="w-4 h-4 text-sky-400 shrink-0" />
            {isLoaded ? (
              <Autocomplete
                onLoad={setDropoffAutocomplete}
                onPlaceChanged={() => dropoffAutocomplete && applyPlace(dropoffAutocomplete.getPlace(), 'dropoff')}
              >
                <input
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  onFocus={() => setActiveField('dropoff')}
                  placeholder={t.dropoffPh}
                  className="flex-1 bg-transparent text-[15px] font-medium text-white placeholder-gray-600 outline-none min-w-0"
                />
              </Autocomplete>
            ) : (
              <span className="text-gray-600 text-sm">...</span>
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
          className="w-full rounded-2xl bg-[#f5c518] hover:bg-[#e6b616] text-[#1a1a1a] font-bold text-base py-4 transition-colors active:scale-[0.98]"
        >
          {t.order}
        </button>

        {(customerId || waId) && (
          <p className="text-center text-[10px] text-gray-600 truncate">
            test id: {customerId || '—'} {waId ? `· wa: ${waId}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
