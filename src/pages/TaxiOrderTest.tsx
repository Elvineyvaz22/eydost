/**
 * Maxim-style taxi order (test). Mobile app flow: pickup → dropoff → confirm.
 * Route: /taxi-order
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, LocateFixed, Trash2, MapPin } from 'lucide-react';
import { useLoadScript, GoogleMap, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';
import Seo from '../components/Seo';
import { useLanguage } from '../contexts/LanguageContext';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_LOADER_ID } from '../utils/googleMaps';
import { formatGeocoderResult, formatPlaceAddress, extractCountry, isSameCountry } from '../utils/addressFormat';
import PlaceSearchInput from '../components/PlaceSearchInput';
import { resolveTaxiLinkId, resolveTaxiWaId, type TaxiOrderDraft } from '../utils/taxiLinkSession';
import {
  fetchTaxiProfile,
  saveTaxiSession,
  addTaxiOrder,
  addTaxiFavorite,
  removeTaxiFavorite,
  formatOrderDate,
  type TaxiOrderRecord,
  type TaxiFavorite,
} from '../services/taxiSessionApi';
import { showToast } from '../components/Toast';
import TaxiOrderBottomNav, { type TaxiOrderTab } from '../components/TaxiOrderBottomNav';

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
    linkRequiredTitle: 'Şəxsi link lazımdır',
    linkRequiredBody: 'Bu səhifə yalnız sizə göndərilmiş taksi linki ilə açılır. WhatsApp botundan linkə toxunun.',
    linkRequiredHint: 'Nümunə: /taxi-order?id=SİZİN-ID',
    sessionLoading: 'Sizin sifarişiniz yüklənir...',
    sessionError: 'Məlumat yüklənmədi. Yenidən cəhd edin.',
    saving: 'Saxlanılır...',
    orderSaved: 'Ünvan seçiminiz qeydə alındı.',
    orderSavedHint: 'Eyni linklə yenidən açanda görünəcək.',
    sameCountryError: 'Təyinat götürmə ilə eyni ölkədə olmalıdır.',
    tabHome: 'Ana səhifə',
    tabRequests: 'Tələblər',
    tabFavorites: 'Favorilər',
    requestsTitle: 'Keçmiş sifarişlər',
    requestsEmpty: 'Hələ sifariş yoxdur.',
    favoritesTitle: 'Saxlanmış ünvanlar',
    favoritesEmpty: 'Favorit ünvan əlavə edin.',
    addPickupFav: 'Götürməni favoritə əlavə et',
    addDropoffFav: 'Təyinatı favoritə əlavə et',
    usePickup: 'Götürmə kimi istifadə et',
    useDropoff: 'Təyinat kimi istifadə et',
    favAdded: 'Favoritə əlavə olundu.',
    favRemoved: 'Silindi.',
    repeatOrder: 'Təkrarla',
    orderHistoryFailed:
      'Ünvan saxlanıldı, amma Tələblər siyahısına yazılmadı. Supabase-də taxi_link_orders cədvəlini yaradın.',
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
    linkRequiredTitle: 'Personal link required',
    linkRequiredBody: 'This page opens only from your private taxi link sent in chat. Tap the link from the bot.',
    linkRequiredHint: 'Example: /taxi-order?id=YOUR-ID',
    sessionLoading: 'Loading your order...',
    sessionError: 'Could not load your data. Please try again.',
    saving: 'Saving...',
    orderSaved: 'Your addresses were saved.',
    orderSavedHint: 'Open the same link again to see them.',
    sameCountryError: 'Drop-off must be in the same country as pickup.',
    tabHome: 'Home',
    tabRequests: 'Requests',
    tabFavorites: 'Favorites',
    requestsTitle: 'Past orders',
    requestsEmpty: 'No orders yet.',
    favoritesTitle: 'Saved places',
    favoritesEmpty: 'Add a favorite address.',
    addPickupFav: 'Save pickup to favorites',
    addDropoffFav: 'Save drop-off to favorites',
    usePickup: 'Use as pickup',
    useDropoff: 'Use as drop-off',
    favAdded: 'Added to favorites.',
    favRemoved: 'Removed.',
    repeatOrder: 'Repeat',
    orderHistoryFailed:
      'Addresses saved, but Requests list failed. Create taxi_link_orders table in Supabase.',
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
    linkRequiredTitle: 'Нужна персональная ссылка',
    linkRequiredBody: 'Страница открывается только по вашей ссылке из чата. Нажмите ссылку от бота.',
    linkRequiredHint: 'Пример: /taxi-order?id=ВАШ-ID',
    sessionLoading: 'Загрузка заказа...',
    sessionError: 'Не удалось загрузить данные. Попробуйте снова.',
    saving: 'Сохранение...',
    orderSaved: 'Адреса сохранены.',
    orderSavedHint: 'Откройте ту же ссылку снова, чтобы увидеть их.',
    sameCountryError: 'Пункт назначения должен быть в той же стране, что и посадка.',
    tabHome: 'Главная',
    tabRequests: 'Заказы',
    tabFavorites: 'Избранное',
    requestsTitle: 'История заказов',
    requestsEmpty: 'Заказов пока нет.',
    favoritesTitle: 'Сохранённые адреса',
    favoritesEmpty: 'Добавьте адрес в избранное.',
    addPickupFav: 'Сохранить посадку',
    addDropoffFav: 'Сохранить назначение',
    usePickup: 'Как посадка',
    useDropoff: 'Как назначение',
    favAdded: 'Добавлено в избранное.',
    favRemoved: 'Удалено.',
    repeatOrder: 'Повторить',
    orderHistoryFailed:
      'Адреса сохранены, но список заказов не обновился. Создайте таблицу taxi_link_orders в Supabase.',
  },
};

const NAV_H = '5.5rem';

export default function TaxiOrderTest() {
  const { language } = useLanguage();
  const t = copy[language] ?? copy.az;
  const [searchParams] = useSearchParams();
  const linkId = resolveTaxiLinkId(searchParams);
  const waIdFromUrl = resolveTaxiWaId(searchParams);

  const [sessionLoading, setSessionLoading] = useState(!!linkId);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [activeTab, setActiveTab] = useState<TaxiOrderTab>('home');
  const [orders, setOrders] = useState<TaxiOrderRecord[]>([]);
  const [favorites, setFavorites] = useState<TaxiFavorite[]>([]);

  const { isLoaded, loadError } = useLoadScript({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [step, setStep] = useState<Step>('select_pickup');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupCountryCode, setPickupCountryCode] = useState<string | null>(null);
  const [pickupCountryName, setPickupCountryName] = useState<string | null>(null);
  const [pickupCoords, setPickupCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [pickupAutocomplete, setPickupAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSaveRef = useRef(true);

  const buildDraft = useCallback(
    (): TaxiOrderDraft => ({
      step,
      pickupAddress,
      dropoffAddress,
      pickupCoords: pickupCoords ?? undefined,
      dropoffCoords: dropoffCoords ?? undefined,
      pickupCountryCode,
    }),
    [step, pickupAddress, dropoffAddress, pickupCoords, dropoffCoords, pickupCountryCode]
  );

  const persistDraftNow = useCallback(
    async (patch?: Partial<TaxiOrderDraft>) => {
      if (!linkId) return;
      setIsSaving(true);
      try {
        await saveTaxiSession(linkId, { ...buildDraft(), ...patch }, { waId: waIdFromUrl });
        setSessionError(null);
      } catch (e) {
        console.warn('[taxi-order] save failed', e);
        setSessionError(t.sessionError);
      } finally {
        setIsSaving(false);
      }
    },
    [linkId, buildDraft, waIdFromUrl, t.sessionError]
  );

  useEffect(() => {
    if (!linkId) return;
    let cancelled = false;
    setSessionLoading(true);
    setSessionError(null);
    fetchTaxiProfile(linkId)
      .then((profile) => {
        if (cancelled) return;
        setOrders(profile.orders.slice(0, 4));
        setFavorites(profile.favorites);
        const session = profile.session;
        if (!session) return;
        if (session.pickupAddress) setPickupAddress(session.pickupAddress);
        if (session.dropoffAddress) setDropoffAddress(session.dropoffAddress);
        if (session.pickupCoords) setPickupCoords(session.pickupCoords);
        if (session.dropoffCoords) setDropoffCoords(session.dropoffCoords);
        if (session.pickupCountryCode !== undefined) setPickupCountryCode(session.pickupCountryCode);
        if (
          session.step === 'select_dropoff' ||
          session.step === 'confirm_ride' ||
          session.step === 'select_pickup'
        ) {
          setStep(session.step);
        }
        if (session.pickupCoords) setMapCenter(session.pickupCoords);
      })
      .catch((e) => {
        if (!cancelled) {
          console.warn('[taxi-order] load failed', e);
          setSessionError(t.sessionError);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSessionLoading(false);
          skipSaveRef.current = false;
        }
      });
    return () => {
      cancelled = true;
    };
  }, [linkId, t.sessionError]);

  useEffect(() => {
    if (!linkId || skipSaveRef.current || sessionLoading) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistDraftNow();
    }, 600);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    linkId,
    sessionLoading,
    step,
    pickupAddress,
    dropoffAddress,
    pickupCoords,
    dropoffCoords,
    pickupCountryCode,
    persistDraftNow,
  ]);

  const applyPickupCountry = (components?: google.maps.GeocoderAddressComponent[]) => {
    const { code, name } = extractCountry(components);
    if (pickupCountryCode && code && code !== pickupCountryCode) {
      setDropoffAddress('');
      setDropoffCoords(null);
      setDirections(null);
    }
    setPickupCountryCode(code);
    setPickupCountryName(name);
  };

  const geocodeLatLng = useCallback(
    (latlng: google.maps.LatLngLiteral, target: 'pickup' | 'dropoff') => {
      if (!geocoderRef.current) return;
      geocoderRef.current.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const address = formatGeocoderResult(results[0]);
          const components = results[0].address_components;
          if (target === 'pickup') {
            setPickupAddress(address);
            applyPickupCountry(components);
          } else if (isSameCountry(components, pickupCountryCode)) {
            setDropoffAddress(address);
          }
        }
      });
    },
    [pickupCountryCode]
  );

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
    applyPickupCountry(place.address_components);
    if (place.geometry?.location) {
      const loc = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
      setPickupCoords(loc);
      setMapCenter(loc);
      mapRef.current?.panTo(loc);
    }
  };

  const handleDropoffPlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (!isSameCountry(place.address_components, pickupCountryCode)) {
      showToast(t.sameCountryError, 'error');
      return;
    }
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

  const applyOrder = (order: TaxiOrderRecord) => {
    setPickupAddress(order.pickup_address);
    setDropoffAddress(order.dropoff_address);
    let origin: google.maps.LatLngLiteral | null = null;
    let dest: google.maps.LatLngLiteral | null = null;
    if (order.pickup_lat != null && order.pickup_lng != null) {
      origin = { lat: order.pickup_lat, lng: order.pickup_lng };
      setPickupCoords(origin);
      setMapCenter(origin);
    }
    if (order.dropoff_lat != null && order.dropoff_lng != null) {
      dest = { lat: order.dropoff_lat, lng: order.dropoff_lng };
      setDropoffCoords(dest);
    }
    setStep('confirm_ride');
    if (origin && dest) calculateRoute(origin, dest);
    setActiveTab('home');
  };

  const applyFavorite = (fav: TaxiFavorite, as: 'pickup' | 'dropoff') => {
    if (as === 'pickup') {
      setPickupAddress(fav.address);
      if (fav.lat != null && fav.lng != null) {
        const p = { lat: fav.lat, lng: fav.lng };
        setPickupCoords(p);
        setMapCenter(p);
        mapRef.current?.panTo(p);
      }
      setStep('select_dropoff');
    } else {
      setDropoffAddress(fav.address);
      if (fav.lat != null && fav.lng != null) {
        const p = { lat: fav.lat, lng: fav.lng };
        setDropoffCoords(p);
        setMapCenter(p);
        mapRef.current?.panTo(p);
      }
      setStep('select_dropoff');
    }
    setActiveTab('home');
  };

  const handleAddFavorite = async (kind: 'pickup' | 'dropoff') => {
    if (!linkId) return;
    const address = kind === 'pickup' ? pickupAddress : dropoffAddress;
    const coords = kind === 'pickup' ? pickupCoords : dropoffCoords;
    if (!address.trim()) return;
    try {
      const fav = await addTaxiFavorite(linkId, {
        address,
        lat: coords?.lat,
        lng: coords?.lng,
        kind,
        label: address.split(',')[0],
      });
      setFavorites((prev) => [fav, ...prev]);
      showToast(t.favAdded);
    } catch {
      showToast(t.sessionError, 'error');
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    if (!linkId) return;
    try {
      await removeTaxiFavorite(linkId, id);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      showToast(t.favRemoved);
    } catch {
      showToast(t.sessionError, 'error');
    }
  };

  const handleOrder = async () => {
    if (!linkId || isOrdering) return;
    const draft = { ...buildDraft(), step: 'confirm_ride' as const };
    if (!draft.pickupAddress?.trim() || !draft.dropoffAddress?.trim()) return;

    setIsOrdering(true);
    setIsSaving(true);
    try {
      await saveTaxiSession(linkId, draft, { waId: waIdFromUrl });

      try {
        await addTaxiOrder(linkId, draft);
      } catch (orderErr) {
        console.warn('[taxi-order] addTaxiOrder failed', orderErr);
        showToast(t.orderHistoryFailed, 'error');
      }

      const profile = await fetchTaxiProfile(linkId);
      setOrders(profile.orders.slice(0, 4));

      setSessionError(null);
      showToast(`${t.orderSaved} ${t.orderSavedHint}`);
    } catch {
      setSessionError(t.sessionError);
      showToast(t.sessionError, 'error');
    } finally {
      setIsSaving(false);
      setIsOrdering(false);
    }
  };

  const navLabels = { home: t.tabHome, requests: t.tabRequests, favorites: t.tabFavorites };

  const routeLeg = directions?.routes[0]?.legs[0];
  const pinPickup = step === 'select_pickup';
  const showMapPin = step !== 'confirm_ride';

  if (!linkId) {
    return (
      <div className="min-h-[100dvh] bg-[#121212] text-white flex flex-col items-center justify-center p-8 text-center">
        <Seo title="Taxi order" noIndex canonicalPath="/taxi-order" />
        <h1 className="text-xl font-bold mb-3">{t.linkRequiredTitle}</h1>
        <p className="text-gray-400 text-sm max-w-sm mb-4">{t.linkRequiredBody}</p>
        <p className="text-gray-600 text-xs font-mono">{t.linkRequiredHint}</p>
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#121212] text-white flex flex-col items-center justify-center p-8 text-center">
        <Seo title="Taxi order (test)" noIndex canonicalPath="/taxi-order" />
        <div className="w-12 h-12 border-4 border-[#f5c518] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm">{t.sessionLoading}</p>
      </div>
    );
  }

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

      {sessionError && (
        <div className="absolute top-4 left-4 right-4 z-30 rounded-xl bg-red-950/90 border border-red-500/40 px-4 py-2 text-xs text-red-200">
          {sessionError}
        </div>
      )}
      {isSaving && (
        <div className="absolute top-4 right-4 z-30 rounded-full bg-black/70 px-3 py-1 text-[10px] text-gray-400">
          {t.saving}
        </div>
      )}

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

      {activeTab === 'home' && step !== 'select_pickup' && (
        <button
          type="button"
          onClick={handleBack}
          className="absolute top-4 left-4 z-20 rounded-full bg-[#2a2a2a] p-3 shadow-lg border border-white/10"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {activeTab === 'home' && isLoaded && step !== 'confirm_ride' && (
        <button
          type="button"
          onClick={locateUser}
          className="absolute right-4 z-20 rounded-full bg-[#2a2a2a] p-3 shadow-lg border border-white/10"
          style={{ bottom: `calc(${NAV_H} + 280px)` }}
          aria-label="My location"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
      )}

      {/* Tələblər */}
      {activeTab === 'requests' && (
        <div
          className="absolute inset-0 z-20 bg-[#121212] flex flex-col"
          style={{ paddingBottom: NAV_H }}
        >
          <div className="px-5 pt-6 pb-3">
            <h2 className="text-xl font-bold">{t.requestsTitle}</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {orders.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">{t.requestsEmpty}</p>
            ) : (
              orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => applyOrder(order)}
                  className="w-full text-left rounded-2xl bg-[#1e1e1e] border border-white/10 p-4 active:bg-[#252525]"
                >
                  <p className="text-[10px] text-gray-500 mb-2">{formatOrderDate(order.created_at, language)}</p>
                  <div className="flex gap-2 items-start mb-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <p className="text-sm font-medium line-clamp-2">{order.pickup_address}</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="w-2 h-2 rounded-sm bg-sky-500 mt-1.5 shrink-0" />
                    <p className="text-sm font-medium line-clamp-2">{order.dropoff_address}</p>
                  </div>
                  <p className="text-[#f5c518] text-xs font-semibold mt-3">{t.repeatOrder}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Favorilər */}
      {activeTab === 'favorites' && (
        <div
          className="absolute inset-0 z-20 bg-[#121212] flex flex-col"
          style={{ paddingBottom: NAV_H }}
        >
          <div className="px-5 pt-6 pb-3">
            <h2 className="text-xl font-bold">{t.favoritesTitle}</h2>
          </div>
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {pickupAddress.trim() && (
              <button
                type="button"
                onClick={() => handleAddFavorite('pickup')}
                className="text-xs font-semibold px-3 py-2 rounded-full bg-[#252525] border border-white/10 text-gray-300"
              >
                {t.addPickupFav}
              </button>
            )}
            {dropoffAddress.trim() && (
              <button
                type="button"
                onClick={() => handleAddFavorite('dropoff')}
                className="text-xs font-semibold px-3 py-2 rounded-full bg-[#252525] border border-white/10 text-gray-300"
              >
                {t.addDropoffFav}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {favorites.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">{t.favoritesEmpty}</p>
            ) : (
              favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="rounded-2xl bg-[#1e1e1e] border border-white/10 p-4"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#f5c518] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{fav.label || fav.address}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{fav.address}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(fav.id)}
                      className="p-2 text-gray-500 hover:text-red-400"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => applyFavorite(fav, 'pickup')}
                      className="flex-1 text-xs font-bold py-2 rounded-lg bg-[#252525] text-gray-200"
                    >
                      {t.usePickup}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFavorite(fav, 'dropoff')}
                      className="flex-1 text-xs font-bold py-2 rounded-lg bg-[#252525] text-gray-200"
                    >
                      {t.useDropoff}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Ana səhifə — bottom sheet */}
      {activeTab === 'home' && (
      <div
        className="absolute left-0 right-0 z-20 px-4 pointer-events-none"
        style={{ bottom: NAV_H, paddingBottom: '0.75rem' }}
      >
        <div className="pointer-events-auto rounded-t-3xl bg-[#1e1e1e] border border-white/10 p-5 shadow-[0_-12px_40px_rgba(0,0,0,0.65)] overflow-visible max-h-[55vh] overflow-y-auto">
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
            <div className="overflow-visible">
              <h2 className="text-xl font-bold mb-4">{t.dropoffQ}</h2>
              <div className="flex items-center gap-3 bg-[#252525] rounded-2xl px-4 py-3 mb-5 border border-sky-500/20 overflow-visible relative z-10">
                <span className="w-3 h-3 rounded-sm bg-sky-500 shrink-0" />
                {isLoaded && (
                  <PlaceSearchInput
                    value={dropoffAddress}
                    onChange={setDropoffAddress}
                    onPlaceSelect={handleDropoffPlaceSelect}
                    restrictCountryCode={pickupCountryCode}
                    restrictCountryName={pickupCountryName}
                    locationBias={pickupCoords}
                    placeholder={t.dropoffPh}
                    variant="dark"
                    className="flex-1 min-w-0"
                    inputClassName="w-full bg-transparent text-base font-semibold outline-none placeholder-gray-600"
                  />
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
                disabled={isOrdering}
                className="w-full py-4 rounded-xl bg-[#f5c518] text-[#1a1a1a] font-bold active:scale-[0.98] disabled:opacity-50"
              >
                {isOrdering ? t.saving : t.order}
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      <TaxiOrderBottomNav active={activeTab} onChange={setActiveTab} labels={navLabels} />
    </div>
  );
}
