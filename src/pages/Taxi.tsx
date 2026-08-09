import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Navigation, Car, MessageCircle, Star, Users, Briefcase, ArrowLeft, LocateFixed, CheckCircle, XCircle } from 'lucide-react';
import { useLoadScript, GoogleMap, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';
import Header from '../components/Header';
import Seo from '../components/Seo';
import { useLanguage } from '../contexts/LanguageContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import { getWaId, createOrder } from '../utils/whatsapp';
import {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_LOADER_ID,
  TAXI_MOBILE_MAP_STYLES,
  TAXI_DESKTOP_MAP_STYLES,
} from '../utils/googleMaps';
import { formatGeocoderResult, formatPlaceAddress, extractCountry, isSameCountry } from '../utils/addressFormat';
import PlaceSearchInput, { type PlaceSearchInputHandle } from '../components/PlaceSearchInput';
import TaxiOrderBottomNav from '../components/TaxiOrderBottomNav';
import TaxiRequestsPanel from '../components/TaxiRequestsPanel';
import { resolveTaxiLinkId, resolveTaxiWaId } from '../utils/taxiLinkSession';
import { useTaxiLinkStorage } from '../hooks/useTaxiLinkStorage';
import type { TaxiOrderRecord } from '../services/taxiSessionApi';

const WA_LINK = 'https://wa.me/994992000444';
const MOBILE_NAV_H = '3.75rem';

const defaultCenter = { lat: 40.409264, lng: 49.867092 }; // Baku

const CAR_CLASSES = [
  { id: 'economy',  name: 'Economy',  desc: 'Affordable everyday rides',      icon: Car,      priceStr: 'from €8' },
  { id: 'comfort',  name: 'Comfort',  desc: 'Newer cars with extra legroom',   icon: Star,     priceStr: 'from €14' },
  { id: 'business', name: 'Business', desc: 'Premium luxury vehicles',          icon: Briefcase, priceStr: 'from €22' },
  { id: 'minivan',  name: 'Minivan',  desc: 'Groups up to 6 people',           icon: Users,    priceStr: 'from €20' },
];

export default function Taxi() {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const linkId = resolveTaxiLinkId(searchParams);
  const paymentStatus = searchParams.get('status');

  const { isLoaded } = useLoadScript({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: 'en',
  });

  // Responsive — ilk renderdə desktop flash olmasın (mobil layout bir dəfə seçilir)
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [activeInput, setActiveInput] = useState<'pickup' | 'dropoff'>('pickup');
  const [mobileStep, setMobileStep] = useState<'select_pickup' | 'select_dropoff' | 'confirm_ride'>('select_pickup');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  
  // Coordinates
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [pickupCoords, setPickupCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<google.maps.LatLngLiteral | null>(null);
  
  // Addresses
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupCountryCode, setPickupCountryCode] = useState<string | null>(null);
  const [pickupCountryName, setPickupCountryName] = useState<string | null>(null);
  
  const [selectedCar, setSelectedCar] = useState('economy');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const [pickupAutocomplete, setPickupAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [dropoffListTop, setDropoffListTop] = useState(140);

  const mapRef = useRef<google.maps.Map | null>(null);
  const dropoffTopBarRef = useRef<HTMLDivElement>(null);
  const dropoffSearchRef = useRef<PlaceSearchInputHandle>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const initialLocateLinkRef = useRef<string | null>(linkId);
  const initialLocateHandledRef = useRef(false);

  const tabLabels =
    language === 'az'
      ? { home: 'Ana səhifə', requests: 'Keçmiş', requestsTitle: 'Keçmiş sifarişlər', requestsEmpty: 'Hələ sifariş yoxdur.', repeat: 'Təkrarla' }
      : language === 'ru'
        ? { home: 'Главная', requests: 'Заказы', requestsTitle: 'История заказов', requestsEmpty: 'Заказов пока нет.', repeat: 'Повторить' }
        : { home: 'Home', requests: 'Requests', requestsTitle: 'Past orders', requestsEmpty: 'No orders yet.', repeat: 'Repeat' };

  const { orders, activeTab, setActiveTab, profileReady, saveOrderToHistory } = useTaxiLinkStorage(
    linkId,
    resolveTaxiWaId(searchParams) || getWaId(),
    {
      step: mobileStep,
      pickupAddress,
      dropoffAddress,
      pickupCoords,
      dropoffCoords,
      pickupCountryCode,
    },
    {
      setPickupAddress,
      setDropoffAddress,
      setPickupCoords,
      setDropoffCoords,
      setPickupCountryCode,
      setMapCenter,
      setMobileStep,
    }
  );

  const locateUser = useCallback((map?: google.maps.Map) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setMapCenter(userPos);
          setPickupCoords(userPos);
          if (map) map.panTo(userPos);
          else mapRef.current?.panTo(userPos);
          geocodeLatLng(userPos, 'pickup');
        },
        (error) => {
          console.warn("Location error:", error);
          setPickupCoords(defaultCenter);
          if (map) geocodeLatLng(defaultCenter, 'pickup');
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    } else {
      setPickupCoords(defaultCenter);
      if (map) geocodeLatLng(defaultCenter, 'pickup');
    }
  }, []);

  const maybeLocateInitialPickup = useCallback((map: google.maps.Map) => {
    if (initialLocateLinkRef.current !== linkId) {
      initialLocateLinkRef.current = linkId;
      initialLocateHandledRef.current = false;
    }
    if (initialLocateHandledRef.current) return;
    if (linkId && !profileReady) return;

    initialLocateHandledRef.current = true;
    if (!linkId || (!pickupCoords && pickupAddress.trim().length === 0)) {
      locateUser(map);
    }
  }, [linkId, locateUser, pickupAddress, pickupCoords, profileReady]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
    maybeLocateInitialPickup(map);
  }, [maybeLocateInitialPickup]);

  useEffect(() => {
    if (!mapRef.current || !geocoderRef.current) return;
    maybeLocateInitialPickup(mapRef.current);
  }, [maybeLocateInitialPickup]);

  const applyPickupCountry = (components?: google.maps.GeocoderAddressComponent[]) => {
    const { code, name } = extractCountry(components);
    if (code && pickupCountryCode && code !== pickupCountryCode) {
      setDropoffAddress('');
      setDropoffCoords(null);
      setDirections(null);
    }
    setPickupCountryCode(code);
    setPickupCountryName(name);
  };

  const geocodeLatLng = (latlng: google.maps.LatLngLiteral, target: 'pickup' | 'dropoff') => {
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
  };

  const onMapDragEnd = () => {
    if (!mapRef.current) return;
    if (isMobile && mobileStep === 'confirm_ride') return;
    
    const center = mapRef.current.getCenter();
    if (!center) return;
    
    const latlng = { lat: center.lat(), lng: center.lng() };
    setMapCenter(latlng);

    const currentTarget = isMobile 
      ? (mobileStep === 'select_pickup' ? 'pickup' : 'dropoff') 
      : activeInput;

    if (currentTarget === 'pickup') {
      geocodeLatLng(latlng, 'pickup');
      setPickupCoords(latlng);
    } else {
      geocodeLatLng(latlng, 'dropoff');
      setDropoffCoords(latlng);
    }
  };

  const handlePickupPlaceChanged = () => {
    if (pickupAutocomplete !== null) {
      const place = pickupAutocomplete.getPlace();
      setPickupAddress(formatPlaceAddress(place));
      applyPickupCountry(place.address_components);
      
      if (place.geometry && place.geometry.location) {
        const location = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
        setPickupCoords(location);
        setMapCenter(location);
        mapRef.current?.panTo(location);
      }
    }
  };

  const handleDropoffPlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (!isSameCountry(place.address_components, pickupCountryCode)) {
      alert(
        language === 'az'
          ? 'Təyinat pickup ilə eyni ölkədə olmalıdır.'
          : language === 'ru'
          ? 'Пункт назначения должен быть в той же стране, что и посадка.'
          : 'Drop-off must be in the same country as pickup.'
      );
      return;
    }
    setDropoffAddress(formatPlaceAddress(place));
    if (place.geometry?.location) {
      const location = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
      setDropoffCoords(location);
      setMapCenter(location);
      mapRef.current?.panTo(location);
    }
  };

  const calculateRoute = useCallback((origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral) => {
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          setDirections(null);
        }
      }
    );
  }, []);

  const applyOrder = useCallback(
    (order: TaxiOrderRecord) => {
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
      if (isMobile) setMobileStep('confirm_ride');
      if (origin && dest) calculateRoute(origin, dest);
      setActiveTab('home');
    },
    [isMobile, calculateRoute, setActiveTab]
  );

  useEffect(() => {
    if (!isMobile) {
      if (pickupCoords && dropoffCoords) {
        calculateRoute(pickupCoords, dropoffCoords);
      } else {
        setDirections(null);
      }
    }
  }, [pickupCoords, dropoffCoords, isMobile]);

  const isTelegramWebApp = typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData;
  const waId = resolveTaxiWaId(searchParams) || getWaId();

  const handleBooking = async () => {
      if (!pickupAddress || !dropoffAddress) {
        alert(language === 'az' ? "Zəhmət olmasa Haradan və Haraya ünvanlarını tam seçin." : (language === 'ru' ? "Пожалуйста, выберите пункты отправления и назначения." : "Please select both pickup and drop-off locations."));
        return;
      }
      if (!pickupCountryCode) {
        alert(language === 'az' ? 'Pickup ölkəsi təyin olunmayıb.' : language === 'ru' ? 'Страна отправления не определена.' : 'Pickup country not set.');
        return;
      }
      const car = CAR_CLASSES.find(c => c.id === selectedCar);
      let priceText = "";
      
      if (directions && directions.routes[0]?.legs[0]) {
        const leg = directions.routes[0].legs[0];
        const distanceKm = (leg.distance?.value || 0) / 1000;
        const durationMin = (leg.duration?.value || 0) / 60;
        
        let baseFare = 2.0 + (distanceKm * 0.8) + (durationMin * 0.15);
        const isAirport = pickupAddress.toLowerCase().match(/airport|aeroport|hava liman/i) || dropoffAddress.toLowerCase().match(/airport|aeroport|hava liman/i);
        if (isAirport) baseFare *= 1.15;
        
        let multiplier = 1;
        if (selectedCar === 'comfort') multiplier = 1.4;
        if (selectedCar === 'business') multiplier = 2.2;
        if (selectedCar === 'minivan') multiplier = 1.8;
        
        const totalFare = baseFare * multiplier;
        priceText = ` (~$${(totalFare * 0.9).toFixed(2)} - $${(totalFare * 1.2).toFixed(2)})`;
      }

      trackEvent(EVENTS.WHATSAPP_TAXI_ORDER, {
        car_class: car?.id,
        pickup: pickupAddress,
        dropoff: dropoffAddress,
        estimated_price: priceText
      });

      setIsOrdering(true);
      try {
      if (linkId) {
        try {
          await saveOrderToHistory();
        } catch (e) {
          console.warn('[taxi] save order history', e);
        }
      }

      const bookingId = linkId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      try {
        const res = await fetch('/api/taxi-webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingId,
            pickup: {
              display_name: pickupAddress.split(',')[0] || pickupAddress,
              formatted_address: pickupAddress,
              lat: pickupCoords?.lat ?? 0,
              lng: pickupCoords?.lng ?? 0,
            },
            destination: {
              display_name: dropoffAddress.split(',')[0] || dropoffAddress,
              formatted_address: dropoffAddress,
              lat: dropoffCoords?.lat ?? 0,
              lng: dropoffCoords?.lng ?? 0,
            },
            confirmed_at: new Date().toISOString(),
          }),
        });
        console.log('[TAXI_WEBHOOK] status:', res.status, 'ok:', res.ok);
        if (!res.ok) {
          const body = await res.text();
          console.warn('[TAXI_WEBHOOK] error body:', body);
        }
      } catch (e) {
        console.warn('Taxi webhook failed:', e);
      }
      } finally {
        setIsOrdering(false);
      }

      setIsSuccess(true);

      setTimeout(() => {
        if (isTelegramWebApp) {
          const tg = (window as any).Telegram.WebApp;
          
          tg.MainButton.setText("TAKSi SIFARISINI TESTDIQLE");
          tg.MainButton.show();
          tg.MainButton.offClick(() => {}); 
          
          const handleTaxiClick = () => {
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            tg.MainButton.setText("SİFARİŞ GÖNDƏRİLİR...");
            try {
              tg.sendData('');
              tg.MainButton.hide();
              setTimeout(() => tg.close(), 1000);
            } catch {
              tg.openTelegramLink('https://t.me/eydost_esim_bot');
              tg.close();
            }
          };

          tg.MainButton.onClick(handleTaxiClick);
        } else if (waId) {
          const waLang = language === 'ar' ? 'en' : language;
          const details =
            waLang === 'az'
              ? 'Salam! Taksi sifariş etmək istəyirəm.'
              : waLang === 'ru'
                ? 'Здравствуйте! Я хочу заказать такси.'
                : waLang === 'tr'
                  ? 'Merhaba! Taksi çağırmak istiyorum.'
                  : waLang === 'es'
                      ? '¡Hola! Quiero pedir un taxi.'
                      : waLang === 'zh'
                        ? '你好！我想叫车。'
                        : 'Hi! I want to book a taxi.';
          createOrder({
            wa_id: waId,
            type: 'taxi',
            details,
          }).catch(console.error);
          window.location.replace(WA_LINK);
        } else {
          window.location.replace(WA_LINK);
        }
      }, 800);
    };

  // Mobile Handlers
  const handleMobileNext = () => {
    if (mobileStep === 'select_pickup') {
      setActiveTab('home');
      setMobileStep('select_dropoff');
    } else if (mobileStep === 'select_dropoff') {
      setActiveTab('home');
      setMobileStep('confirm_ride');
      if (pickupCoords && dropoffCoords) {
        calculateRoute(pickupCoords, dropoffCoords);
      }
    }
  };

  useEffect(() => {
    if (mobileStep !== 'select_dropoff') return;

    const updateListTop = () => {
      if (dropoffTopBarRef.current) {
        setDropoffListTop(dropoffTopBarRef.current.getBoundingClientRect().bottom);
      }
    };

    updateListTop();
    const t = setTimeout(() => {
      updateListTop();
      dropoffSearchRef.current?.focus();
    }, 350);

    window.addEventListener('resize', updateListTop);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updateListTop);
    };
  }, [mobileStep]);

  const handleMobileBack = () => {
    if (mobileStep === 'select_dropoff') {
      setMobileStep('select_pickup');
      if (pickupCoords) mapRef.current?.panTo(pickupCoords);
    } else if (mobileStep === 'confirm_ride') {
      setMobileStep('select_dropoff');
      setDirections(null);
      if (dropoffCoords) mapRef.current?.panTo(dropoffCoords);
    }
  };

  // Taxibooker ödəniş nəticəsi ekranları
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-28 h-28 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-green-500/30 animate-bounce">
          <CheckCircle className="w-14 h-14 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {language === 'az' ? 'Ödəniş Uğurlu Oldu!' : (language === 'ru' ? 'Оплата прошла успешно!' : 'Payment Successful!')}
        </h2>
        <p className="text-gray-500 text-lg mb-10 max-w-sm mx-auto leading-relaxed">
          {language === 'az' 
            ? 'Sifarişiniz təsdiqləndi. Tezliklə sizinlə əlaqə saxlanılacaq.' 
            : language === 'ru' 
            ? 'Ваш заказ подтверждён. Скоро с вами свяжутся.' 
            : 'Your order has been confirmed. You will be contacted shortly.'}
        </p>
        
        <a 
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-sm mx-auto bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#25D366]/30"
        >
          <MessageCircle className="w-5 h-5" />
          {language === 'az' ? 'WhatsApp-la Əlaqə' : (language === 'ru' ? 'Связаться в WhatsApp' : 'Contact on WhatsApp')}
        </a>
        <p className="text-gray-400 text-sm mt-3">
          {language === 'az' ? '← Geri qayıt' : language === 'ru' ? '← Вернуться' : '← Go Back'}
        </p>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-28 h-28 bg-red-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-red-500/30">
          <XCircle className="w-14 h-14 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {language === 'az' ? 'Ödəniş Baş Tutmadı' : (language === 'ru' ? 'Оплата не прошла' : 'Payment Failed')}
        </h2>
        <p className="text-gray-500 text-lg mb-10 max-w-sm mx-auto leading-relaxed">
          {language === 'az' 
            ? 'Ödəniş prosesində xəta baş verdi. Zəhmət olmasa bir daha cəhd edin.' 
            : language === 'ru' 
            ? 'Произошла ошибка при оплате. Пожалуйста, попробуйте ещё раз.' 
            : 'An error occurred during payment. Please try again.'}
        </p>

        <a 
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-sm mx-auto bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#25D366]/30 mb-4"
        >
          <MessageCircle className="w-5 h-5" />
          {language === 'az' ? 'Dəstək Al' : (language === 'ru' ? 'Получить поддержку' : 'Get Support')}
        </a>
        <p className="text-gray-400 text-sm mt-3">
          {language === 'az' ? '← Geri qayıt' : language === 'ru' ? '← Вернуться' : '← Go Back'}
        </p>
      </div>
    );
  }

  // Köhnə WhatsApp axını — sifariş ötürüldükdən sonra
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 animate-bounce">
           <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
           {language === 'az' ? 'Sifariş Ötürüldü!' : (language === 'ru' ? 'Заказ отправлен!' : 'Order Sent!')}
        </h2>
        <p className="text-gray-600 text-lg max-w-sm mx-auto">
           {language === 'az' ? 'Məlumatlar WhatsApp-a uğurla ötürüldü. Zəhmət olmasa çat bölməsinə keçin.' : (language === 'ru' ? 'Информация успешно отправлена в WhatsApp. Пожалуйста, перейдите в чат.' : 'Information successfully sent to WhatsApp. Please return to your chat.')}
        </p>
      </div>
    );
  }

  const routeDetails = directions?.routes[0]?.legs[0];

  if (isMobile === null) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isMobile) {
    return (
      <div className="h-[100dvh] bg-[#0A0F1C] flex flex-col font-sans overflow-hidden">
        <Seo
          title="Global Taxi Booking via WhatsApp"
          description="Book reliable taxi rides in 850+ cities across 50+ countries — wherever Bolt-style ride-hailing is active. All via WhatsApp. No app needed."
          canonicalPath="/taxi"
        />
        <Header />
        <main className="flex-1 min-h-0 pt-20 pb-4">
          <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-stretch">
              <div className="lg:col-span-5 flex flex-col">
                <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 shadow-2xl flex-1 flex flex-col min-h-0">
                  {linkId && (
                    <div className="flex gap-2 mb-4 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveTab('home')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                          activeTab === 'home' ? 'bg-[#f5c518] text-gray-900' : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {tabLabels.home}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('requests')}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                          activeTab === 'requests' ? 'bg-[#f5c518] text-gray-900' : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {tabLabels.requests}
                      </button>
                    </div>
                  )}

                  {linkId && activeTab === 'requests' ? (
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <TaxiRequestsPanel
                        orders={orders}
                        language={language}
                        title={tabLabels.requestsTitle}
                        emptyText={tabLabels.requestsEmpty}
                        repeatLabel={tabLabels.repeat}
                        onSelect={applyOrder}
                        variant="dark"
                      />
                    </div>
                  ) : (
                  <>
                    <div className="space-y-4">
                      <div
                        onClick={() => {
                          setActiveInput('pickup');
                          if (pickupCoords) mapRef.current?.panTo(pickupCoords);
                        }}
                        className={`relative p-3 rounded-xl border-2 transition-all cursor-text ${
                          activeInput === 'pickup' ? 'border-blue-500 bg-gray-800' : 'border-gray-700 bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Navigation className="w-5 h-5 text-blue-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">{t.taxi.pickupLabel}</p>
                            {isLoaded && (
                              <Autocomplete onLoad={(auto) => setPickupAutocomplete(auto)} onPlaceChanged={handlePickupPlaceChanged}>
                                <input
                                  type="text"
                                  value={pickupAddress}
                                  onChange={(e) => setPickupAddress(e.target.value)}
                                  placeholder={t.taxi.pickupPlaceholder}
                                  className="w-full bg-transparent text-white font-medium focus:outline-none truncate placeholder-gray-500 text-sm"
                                />
                              </Autocomplete>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          setActiveInput('dropoff');
                          if (dropoffCoords) mapRef.current?.panTo(dropoffCoords);
                        }}
                        className={`relative p-3 rounded-xl border-2 transition-all cursor-text ${
                          activeInput === 'dropoff' ? 'border-red-500 bg-gray-800' : 'border-gray-700 bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-red-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">{t.taxi.dropoffLabel}</p>
                            {isLoaded && (
                              <PlaceSearchInput
                                value={dropoffAddress}
                                onChange={setDropoffAddress}
                                onPlaceSelect={handleDropoffPlaceSelect}
                                restrictCountryCode={pickupCountryCode}
                                restrictCountryName={pickupCountryName}
                                locationBias={pickupCoords}
                                placeholder={t.taxi.dropoffPlaceholder}
                                variant="dark"
                                inputClassName="w-full bg-transparent text-white font-medium focus:outline-none truncate placeholder-gray-500 text-sm"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {routeDetails && (
                      <div className="mt-8">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{t.taxi.distance} & {t.taxi.duration}</h3>
                          <span className="text-sm font-bold text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                            {routeDetails.distance?.text} • {routeDetails.duration?.text}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 text-center">{t.taxi.airportNote}</p>
                      </div>
                    )}

                    <button
                      onClick={handleBooking}
                      disabled={isOrdering}
                      className={`w-full mt-6 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg ${
                        isOrdering ? 'opacity-70 cursor-not-allowed' : ''
                      } ${
                        isTelegramWebApp ? 'bg-[#24A1DE] hover:bg-[#1f8ec4]' : 'bg-[#25D366] hover:bg-[#20bd5a]'
                      }`}
                    >
                      <MessageCircle className="w-5 h-5" />
                      {isOrdering ? '...' : t.taxi.continueOrder}
                    </button>
                  </>
                  )}
                </div>
              </div>

              <div className="lg:col-span-7 relative min-h-[400px] h-full rounded-3xl overflow-hidden border border-gray-700 shadow-2xl">
                <div className="absolute inset-0">
                  {!isLoaded ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                    </div>
                  ) : (
                  <>
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      zoom={15}
                      center={mapCenter}
                      onLoad={onMapLoad}
                      onDragEnd={onMapDragEnd}
                      options={{
                        disableDefaultUI: true, zoomControl: true, gestureHandling: "greedy",
                        styles: TAXI_DESKTOP_MAP_STYLES,
                      }}
                    >
                      {directions && (
                        <DirectionsRenderer 
                          directions={directions} 
                          options={{ polylineOptions: { strokeColor: '#22c55e', strokeWeight: 5 }, suppressMarkers: false }}
                        />
                      )}
                    </GoogleMap>
                  
                  <button 
                    onClick={() => locateUser()}
                    className="absolute bottom-6 right-6 bg-white p-3 rounded-full shadow-lg text-gray-800 hover:bg-gray-50 transition-colors z-10"
                    title="Məkanımı tap"
                  >
                    <LocateFixed className="w-6 h-6 text-blue-600" />
                  </button>
                    
                    {!directions && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-10 pointer-events-none pb-2 flex flex-col items-center">
                        <div className="bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg mb-1 animate-bounce">
                          {activeInput === 'pickup' ? t.taxi.pickupLabel : t.taxi.dropoffLabel}?
                        </div>
                        <div className="w-8 h-10 flex flex-col items-center justify-end relative">
                           <div className={`w-5 h-5 rounded-full border-[3px] border-white shadow-md z-10 ${activeInput === 'pickup' ? 'bg-blue-600' : 'bg-red-600'}`}></div>
                           <div className="w-0.5 h-4 bg-black"></div>
                        </div>
                      </div>
                    )}
                  </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isDropoffSearch = mobileStep === 'select_dropoff';
  const hideBottomNav =
    mobileStep === 'select_dropoff' || mobileStep === 'confirm_ride' || isDropoffSearch;
  const showMobileNav = Boolean(linkId) && !hideBottomNav;
  const showMobileRequests =
    Boolean(linkId) && activeTab === 'requests' && mobileStep === 'select_pickup' && !isDropoffSearch;

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-gray-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full z-50">
        <Header />
      </div>

      {isDropoffSearch && (
        <div
          ref={dropoffTopBarRef}
          className="fixed top-16 left-0 right-0 z-40 flex items-center gap-2 px-3 py-3 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
        >
          <button
            type="button"
            onClick={handleMobileBack}
            className="shrink-0 p-2.5 rounded-full bg-gray-100 text-gray-800"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-red-50 rounded-xl border border-red-100 px-3 py-2.5 min-w-0">
            <div className="w-2.5 h-2.5 rounded-sm bg-red-600 shrink-0" />
            {isLoaded && (
              <PlaceSearchInput
                ref={dropoffSearchRef}
                value={dropoffAddress}
                onChange={setDropoffAddress}
                onPlaceSelect={handleDropoffPlaceSelect}
                restrictCountryCode={pickupCountryCode}
                restrictCountryName={pickupCountryName}
                locationBias={pickupCoords}
                placeholder={t.taxi.dropoffPlaceholder}
                suggestionsPlacement="above-keyboard"
                listTop={dropoffListTop}
                inputClassName="w-full bg-transparent text-gray-900 font-semibold focus:outline-none text-base placeholder-gray-400"
              />
            )}
          </div>
        </div>
      )}

      {showMobileRequests && (
        <div
          className="fixed inset-0 z-30 bg-white flex flex-col pt-16"
          style={{ paddingBottom: MOBILE_NAV_H }}
        >
          <div className="flex-1 min-h-0 px-4 py-4">
            <TaxiRequestsPanel
              orders={orders}
              language={language}
              title={tabLabels.requestsTitle}
              emptyText={tabLabels.requestsEmpty}
              repeatLabel={tabLabels.repeat}
              onSelect={applyOrder}
              variant="light"
            />
          </div>
        </div>
      )}

      <main className="relative h-[100dvh] w-full flex-shrink-0">
        <div className={`absolute inset-0 z-0 ${isDropoffSearch ? 'pt-[7.25rem]' : 'pt-16'}`}>
          {!isLoaded ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              zoom={16}
              center={mapCenter}
              onLoad={onMapLoad}
              onDragEnd={onMapDragEnd}
              options={{
                disableDefaultUI: true,
                zoomControl: false,
                gestureHandling: 'greedy',
                styles: TAXI_MOBILE_MAP_STYLES,
              }}
            >
              {directions && (
                <DirectionsRenderer 
                  directions={directions} 
                  options={{ polylineOptions: { strokeColor: '#000000', strokeWeight: 4 }, suppressMarkers: false }}
                />
              )}
            </GoogleMap>
          )}
        </div>

        {isLoaded && mobileStep === 'select_pickup' && !showMobileRequests && (
          <button 
            onClick={() => locateUser()}
            className="absolute right-4 bg-white p-3 rounded-full shadow-lg text-gray-800 hover:bg-gray-50 transition-colors z-20"
            style={{ bottom: showMobileNav ? `calc(${MOBILE_NAV_H} + 300px)` : '360px' }}
          >
            <LocateFixed className="w-6 h-6 text-blue-600" />
          </button>
        )}

        {isLoaded && mobileStep === 'select_pickup' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-10 pointer-events-none pb-6 flex flex-col items-center">
            <div className="bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg mb-2 whitespace-nowrap animate-bounce">
              {t.taxi.pickupLabel}?
            </div>
            <div className="w-8 h-12 flex items-center justify-center relative">
               <div className="w-6 h-6 rounded-full border-4 border-white bg-blue-600 absolute bottom-0 shadow-md z-10"></div>
               <div className="w-1 h-8 bg-black absolute bottom-3 z-0"></div>
            </div>
          </div>
        )}

        {isLoaded && isDropoffSearch && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-10 pointer-events-none pb-6 flex flex-col items-center">
            <div className="bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg mb-2 whitespace-nowrap animate-bounce">
              {t.taxi.dropoffLabel}?
            </div>
            <div className="w-8 h-12 flex items-center justify-center relative">
              <div className="w-6 h-6 rounded-sm border-4 border-white bg-red-600 absolute bottom-0 shadow-md z-10 rotate-45" />
              <div className="w-1 h-8 bg-black absolute bottom-3 z-0" />
            </div>
          </div>
        )}

        {isLoaded && isDropoffSearch && (
          <button
            type="button"
            onClick={() => locateUser()}
            className="absolute bottom-24 right-4 bg-white p-3 rounded-full shadow-lg text-gray-800 z-20"
          >
            <LocateFixed className="w-6 h-6 text-blue-600" />
          </button>
        )}

        {mobileStep === 'confirm_ride' && (
          <button 
            onClick={handleMobileBack}
            className="absolute top-28 left-4 z-20 bg-white p-3 rounded-full shadow-lg text-gray-800 hover:bg-gray-50 transition-colors border border-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {isDropoffSearch && dropoffAddress.trim() && (
          <div className="absolute bottom-0 left-0 right-0 z-40 p-4 pointer-events-none pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={handleMobileNext}
              className="pointer-events-auto w-full bg-black text-white py-4 rounded-xl font-bold text-base shadow-lg active:scale-95"
            >
              {t.taxi.confirmDestination}
            </button>
          </div>
        )}

        {!isDropoffSearch && !showMobileRequests && (
        <div
          className="absolute left-0 w-full z-40 pointer-events-none px-4"
          style={{
            bottom: showMobileNav ? MOBILE_NAV_H : 0,
            paddingBottom: showMobileNav ? '0.5rem' : '1rem',
          }}
        >
          <div className="bg-white rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] p-5 pointer-events-auto w-full overflow-visible">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5"></div>

            {mobileStep === 'select_pickup' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t.taxi.pickupLabel}?</h2>
                <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-5 relative">
                  <div className="w-3 h-3 rounded-full bg-blue-600 shrink-0"></div>
                  {isLoaded && (
                    <Autocomplete onLoad={(auto) => setPickupAutocomplete(auto)} onPlaceChanged={handlePickupPlaceChanged} className="w-full">
                      <input
                        type="text"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        placeholder={t.taxi.pickupPlaceholder}
                        className="w-full bg-transparent text-gray-900 font-bold focus:outline-none truncate text-base placeholder-gray-400"
                      />
                    </Autocomplete>
                  )}
                </div>
                <button onClick={handleMobileNext} className="w-full bg-black text-white py-4 rounded-xl font-bold text-base shadow-md active:scale-95 transition-all">
                  {t.taxi.confirmLocation}
                </button>
              </div>
            )}

            {mobileStep === 'confirm_ride' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col gap-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></div>
                    <p className="text-sm text-gray-700 truncate font-medium">{pickupAddress}</p>
                  </div>
                  <div className="w-px h-2 bg-gray-300 ml-1"></div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-sm bg-red-600 shrink-0"></div>
                    <p className="text-sm text-gray-700 truncate font-medium">{dropoffAddress}</p>
                  </div>
                </div>

                {routeDetails && (
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-sm">{t.taxi.distance} & {t.taxi.duration}</h3>
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">
                      {routeDetails.distance?.text} • {routeDetails.duration?.text}
                    </span>
                  </div>
                )}

                <button onClick={handleBooking} disabled={isOrdering} className={`w-full text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${
                  isOrdering ? 'opacity-70 cursor-not-allowed' : ''
                } ${
                  isTelegramWebApp ? 'bg-[#24A1DE] shadow-[#24A1DE]/30' : 'bg-[#25D366] shadow-[#25D366]/30'
                }`}>
                  <MessageCircle className="w-5 h-5" />
                  {isOrdering ? '...' : t.taxi.continueOrder}
                </button>
              </div>
            )}
          </div>
        </div>
        )}
      </main>

      {showMobileNav && (
        <TaxiOrderBottomNav
          active={activeTab}
          onChange={setActiveTab}
          labels={{ home: tabLabels.home, requests: tabLabels.requests }}
          variant="light"
        />
      )}
    </div>
  );
}
