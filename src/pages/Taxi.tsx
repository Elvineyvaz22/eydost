import { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Navigation, Car, MessageCircle, Star, Users, Briefcase, ArrowLeft, LocateFixed, CheckCircle } from 'lucide-react';
import { useLoadScript, GoogleMap, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../contexts/LanguageContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import { getWaId, createOrder } from '../utils/whatsapp';

const WA_LINK = 'https://wa.me/15551656616';

const libraries: ("places" | "geocoding")[] = ["places"];

const defaultCenter = { lat: 40.409264, lng: 49.867092 }; // Baku

const CAR_CLASSES = [
  { id: 'economy', name: 'Economy', desc: 'Affordable everyday rides', icon: Car, priceStr: '$$' },
  { id: 'comfort', name: 'Comfort', desc: 'Newer cars with extra legroom', icon: Star, priceStr: '$$$' },
  { id: 'business', name: 'Business', desc: 'Premium luxury vehicles', icon: Briefcase, priceStr: '$$$$' },
  { id: 'minivan', name: 'Minivan', desc: 'Groups up to 6 people', icon: Users, priceStr: '$$$$' },
];

export default function Taxi() {
  const { t, language } = useLanguage();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'en',
  });

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [activeInput, setActiveInput] = useState<'pickup' | 'dropoff'>('pickup');
  const [mobileStep, setMobileStep] = useState<'select_pickup' | 'select_dropoff' | 'confirm_ride'>('select_pickup');
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Coordinates
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [pickupCoords, setPickupCoords] = useState<google.maps.LatLngLiteral | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<google.maps.LatLngLiteral | null>(null);
  
  // Addresses
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  
  const [selectedCar, setSelectedCar] = useState('economy');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const [pickupAutocomplete, setPickupAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [dropoffAutocomplete, setDropoffAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

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

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
    locateUser(map);
  }, [locateUser]);

  const geocodeLatLng = (latlng: google.maps.LatLngLiteral, target: 'pickup' | 'dropoff') => {
    if (!geocoderRef.current) return;
    
    geocoderRef.current.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const addressParts = results[0].formatted_address.split(',');
        const address = addressParts.slice(0, isMobile ? 2 : 3).join(',');
        
        if (target === 'pickup') setPickupAddress(address);
        else setDropoffAddress(address);
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
      setPickupAddress(place.formatted_address || place.name || '');
      
      if (place.geometry && place.geometry.location) {
        const location = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
        setPickupCoords(location);
        setMapCenter(location);
        mapRef.current?.panTo(location);
      }
    }
  };

  const handleDropoffPlaceChanged = () => {
    if (dropoffAutocomplete !== null) {
      const place = dropoffAutocomplete.getPlace();
      setDropoffAddress(place.formatted_address || place.name || '');
      
      if (place.geometry && place.geometry.location) {
        const location = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
        setDropoffCoords(location);
        setMapCenter(location);
        mapRef.current?.panTo(location);
      }
    }
  };

  const calculateRoute = (origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral) => {
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
  };

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

    const [isOrdering, setIsOrdering] = useState(false);
    const waId = getWaId();

    const handleBooking = async () => {
      if (!pickupAddress || !dropoffAddress) {
        alert(language === 'az' ? "Zəhmət olmasa Haradan və Haraya ünvanlarını tam seçin." : (language === 'ru' ? "Пожалуйста, выберите пункты отправления и назначения." : "Please select both pickup and drop-off locations."));
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

      const msg = `[TAXI_ORDER]\nHi! I want to order a taxi.\n\n📍 ${t.taxi.pickupLabel}: ${pickupCoords?.lat}, ${pickupCoords?.lng}\n🏁 ${t.taxi.dropoffLabel}: ${dropoffCoords?.lat}, ${dropoffCoords?.lng}\n🚗 ${t.taxi.carClass}: ${car?.name}${priceText}`;
      
      trackEvent(EVENTS.WHATSAPP_TAXI_ORDER, {
        car_class: car?.id,
        pickup: pickupAddress,
        dropoff: dropoffAddress,
        estimated_price: priceText
      });

      setIsSuccess(true);

      setTimeout(() => {
        if (isTelegramWebApp) {
          const tg = (window as any).Telegram.WebApp;
          const userId = tg.initDataUnsafe?.user?.id;

          fetch('/api/telegram/mini-app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'taxi_order',
              user_id: userId,
              message: msg
            })
          }).finally(() => {
            try { tg.sendData(msg); } catch(e) {}
            setTimeout(() => tg.close(), 100);
          });
        } else if (waId) {
          createOrder({
            wa_id: waId,
            type: 'taxi',
            details: msg,
          }).catch(console.error);
          window.location.replace(`${WA_LINK}?text=${encodeURIComponent(msg)}`);
        } else {
          window.location.replace(`${WA_LINK}?text=${encodeURIComponent(msg)}`);
        }
      }, 800);
    };

  // Mobile Handlers
  const handleMobileNext = () => {
    if (mobileStep === 'select_pickup') {
      setMobileStep('select_dropoff');
    } else if (mobileStep === 'select_dropoff') {
      setMobileStep('confirm_ride');
      if (pickupCoords && dropoffCoords) {
        calculateRoute(pickupCoords, dropoffCoords);
      }
    }
  };

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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 animate-bounce">
           <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
           {language === 'az' ? 'Sifariş Ötürüldü!' : (language === 'ru' ? 'Заказ отправлен!' : 'Order Sent!')}
        </h2>
        <p className="text-gray-600 text-lg mb-10 max-w-sm mx-auto">
           {language === 'az' ? 'Məlumatlar WhatsApp-a uğurla ötürüldü. Zəhmət olmasa çat bölməsinə keçin.' : (language === 'ru' ? 'Информация успешно отправлена в WhatsApp. Пожалуйста, перейдите в чат.' : 'Information successfully sent to WhatsApp. Please return to your chat.')}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95"
        >
           {language === 'az' ? 'Yeni Sifariş' : (language === 'ru' ? 'Новый заказ' : 'New Order')}
        </button>
      </div>
    );
  }

  const routeDetails = directions?.routes[0]?.legs[0];

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex flex-col font-sans">
        <Header />
        <main className="flex-1 pt-24 pb-16 lg:pt-32 lg:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                {t.taxi.availableEverywhere}
              </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-4 tracking-tight">
                Fast Rides <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-200">
                  via WhatsApp.
                </span>
              </h1>
              <p className="text-gray-400 max-w-2xl text-lg mx-auto lg:mx-0">
                {t.taxi.rideDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-5 flex flex-col">
                <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 shadow-2xl flex-1 flex flex-col">
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
                            <Autocomplete onLoad={(auto) => setDropoffAutocomplete(auto)} onPlaceChanged={handleDropoffPlaceChanged}>
                              <input
                                type="text"
                                value={dropoffAddress}
                                onChange={(e) => setDropoffAddress(e.target.value)}
                                placeholder={t.taxi.dropoffPlaceholder}
                                className="w-full bg-transparent text-white font-medium focus:outline-none truncate placeholder-gray-500 text-sm"
                              />
                            </Autocomplete>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{t.taxi.carClass}</h3>
                      {routeDetails && (
                        <span className="text-sm font-bold text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                          {routeDetails.distance?.text} • {routeDetails.duration?.text}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {CAR_CLASSES.map((car) => {
                        const Icon = car.icon;
                        const isSelected = selectedCar === car.id;
                        let priceDisplay = car.priceStr;
                        if (routeDetails) {
                          const distanceKm = (routeDetails.distance?.value || 0) / 1000;
                          const durationMin = (routeDetails.duration?.value || 0) / 60;
                          let totalFare = 2.0 + (distanceKm * 0.8) + (durationMin * 0.15);
                          const isAirport = pickupAddress.toLowerCase().match(/airport|aeroport|hava liman/i) || dropoffAddress.toLowerCase().match(/airport|aeroport|hava liman/i);
                          if (isAirport) totalFare *= 1.15;
                          let multiplier = 1;
                          if (car.id === 'comfort') multiplier = 1.4;
                          if (car.id === 'business') multiplier = 2.2;
                          if (car.id === 'minivan') multiplier = 1.8;
                          totalFare *= multiplier;
                          priceDisplay = `$${(totalFare * 0.9).toFixed(2)} - $${(totalFare * 1.2).toFixed(2)}`;
                        }

                        return (
                          <button
                            key={car.id}
                            onClick={() => {
                              setSelectedCar(car.id);
                              trackEvent(EVENTS.CAR_CLASS_SELECTED, { car_class: car.id });
                            }}
                            className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${
                              isSelected ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                            }`}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <Icon className="w-5 h-5 shrink-0" />
                              <div className="text-left min-w-0">
                                <p className="font-bold text-sm truncate">{car.name}</p>
                              </div>
                            </div>
                            <div className={`font-bold text-lg text-left ${isSelected ? 'text-green-400' : 'text-white'}`}>
                              {priceDisplay}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {routeDetails && <p className="text-xs text-gray-500 mt-4 text-center">{t.taxi.airportNote}</p>}
                  </div>

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
                      {isOrdering ? '...' : (isTelegramWebApp ? t.taxi.orderTelegram : t.taxi.orderWhatsApp)}
                    </button>
                </div>
              </div>

              <div className="lg:col-span-7 relative min-h-[600px] lg:min-h-0 rounded-3xl overflow-hidden border border-gray-700 shadow-2xl">
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
                        styles: [
                          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                          { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                          { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                          { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
                          { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                        ],
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-100 relative overflow-y-auto">
      <div className="absolute top-0 left-0 w-full z-50">
         <Header />
      </div>

      <main className="relative h-[100dvh] w-full flex-shrink-0">
        <div className="absolute inset-0 z-0 pt-16">
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
                disableDefaultUI: true, zoomControl: false, gestureHandling: "greedy",
                styles: [
                  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
                  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
                  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
                  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
                  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
                  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
                  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
                  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
                  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
                ],
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

        {isLoaded && mobileStep !== 'confirm_ride' && (
          <button 
            onClick={() => locateUser()}
            className="absolute bottom-[360px] right-4 bg-white p-3 rounded-full shadow-lg text-gray-800 hover:bg-gray-50 transition-colors z-20"
          >
            <LocateFixed className="w-6 h-6 text-blue-600" />
          </button>
        )}

        {isLoaded && mobileStep !== 'confirm_ride' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full z-10 pointer-events-none pb-6 flex flex-col items-center">
            <div className="bg-black text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg mb-2 whitespace-nowrap animate-bounce">
              {mobileStep === 'select_pickup' ? t.taxi.pickupLabel : t.taxi.dropoffLabel}?
            </div>
            <div className="w-8 h-12 flex items-center justify-center relative">
               <div className={`w-6 h-6 rounded-full border-4 border-white ${mobileStep === 'select_pickup' ? 'bg-blue-600' : 'bg-red-600'} absolute bottom-0 shadow-md z-10`}></div>
               <div className="w-1 h-8 bg-black absolute bottom-3 z-0"></div>
            </div>
          </div>
        )}

        {mobileStep !== 'select_pickup' && (
          <button 
            onClick={handleMobileBack}
            className="absolute top-28 left-4 z-20 bg-white p-3 rounded-full shadow-lg text-gray-800 hover:bg-gray-50 transition-colors border border-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none pb-4 px-4">
          <div className="bg-white rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.15)] p-5 pointer-events-auto w-full">
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

            {mobileStep === 'select_dropoff' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t.taxi.dropoffLabel}?</h2>
                <div className="flex items-center gap-4 bg-red-50 p-4 rounded-2xl border border-red-100 mb-5 relative">
                   <div className="w-3 h-3 rounded-sm bg-red-600 shrink-0"></div>
                  {isLoaded && (
                    <Autocomplete onLoad={(auto) => setDropoffAutocomplete(auto)} onPlaceChanged={handleDropoffPlaceChanged} className="w-full">
                      <input
                        type="text"
                        value={dropoffAddress}
                        onChange={(e) => setDropoffAddress(e.target.value)}
                        placeholder={t.taxi.dropoffPlaceholder}
                        className="w-full bg-transparent text-gray-900 font-bold focus:outline-none truncate text-base placeholder-gray-400"
                      />
                    </Autocomplete>
                  )}
                </div>
                <button onClick={handleMobileNext} className="w-full bg-black text-white py-4 rounded-xl font-bold text-base shadow-md active:scale-95 transition-all">
                  {t.taxi.confirmDestination}
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

                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-sm">{t.taxi.carClass}</h3>
                  {routeDetails && (
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">
                      {routeDetails.distance?.text} • {routeDetails.duration?.text}
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 mb-4 max-h-[30vh] overflow-y-auto pr-1">
                  {CAR_CLASSES.map((car) => {
                    const Icon = car.icon;
                    const isSelected = selectedCar === car.id;
                    let priceDisplay = car.priceStr;
                    if (routeDetails) {
                      const distanceKm = (routeDetails.distance?.value || 0) / 1000;
                      const durationMin = (routeDetails.duration?.value || 0) / 60;
                      let totalFare = 2.0 + (distanceKm * 0.8) + (durationMin * 0.15);
                      const isAirport = pickupAddress.toLowerCase().match(/airport|aeroport|hava liman/i) || dropoffAddress.toLowerCase().match(/airport|aeroport|hava liman/i);
                      if (isAirport) totalFare *= 1.15;
                      let multiplier = 1;
                      if (car.id === 'comfort') multiplier = 1.4;
                      if (car.id === 'business') multiplier = 2.2;
                      if (car.id === 'minivan') multiplier = 1.8;
                      totalFare *= multiplier;
                      priceDisplay = `$${(totalFare * 0.9).toFixed(2)} - $${(totalFare * 1.2).toFixed(2)}`;
                    }

                    return (
                      <button key={car.id} onClick={() => setSelectedCar(car.id)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected ? 'border-black bg-gray-50 shadow-sm' : 'border-transparent hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-black' : 'text-gray-400'}`} />
                          <div className="text-left">
                            <p className={`font-bold text-sm ${isSelected ? 'text-black' : 'text-gray-700'}`}>{car.name}</p>
                          </div>
                        </div>
                        <span className="font-bold text-gray-900 text-sm">{priceDisplay}</span>
                      </button>
                    );
                  })}
                </div>
                {routeDetails && <p className="text-[10px] text-gray-500 mb-3 text-center leading-tight">{t.taxi.airportNote}</p>}

                <button onClick={handleBooking} disabled={isOrdering} className={`w-full text-white py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${
                  isOrdering ? 'opacity-70 cursor-not-allowed' : ''
                } ${
                  isTelegramWebApp ? 'bg-[#24A1DE] shadow-[#24A1DE]/30' : 'bg-[#25D366] shadow-[#25D366]/30'
                }`}>
                  <MessageCircle className="w-5 h-5" />
                  {isOrdering ? '...' : (isTelegramWebApp ? t.taxi.orderTelegram : t.taxi.orderWhatsApp)}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <section className="bg-white py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center lg:text-left max-w-2xl">{t.taxiSteps.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-16">
            <div className="group">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gray-50 border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                <img src="/assets/taxi/step1.png" alt="Trip Details" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t.taxiSteps.step1Title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{t.taxiSteps.step1Desc}</p>
            </div>
            <div className="group">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gray-50 border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                <img src="/assets/taxi/step2.png" alt="Easy Payment" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t.taxiSteps.step2Title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{t.taxiSteps.step2Desc}</p>
            </div>
            <div className="group">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gray-50 border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                <img src="/assets/taxi/step3.png" alt="Meet Driver" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{t.taxiSteps.step3Title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{t.taxiSteps.step3Desc}</p>
            </div>
          </div>
          <div className="mt-16 text-center lg:text-left">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="inline-block bg-black text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors shadow-xl">{t.taxiSteps.cta}</a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
