import { useCallback, useEffect, useRef, useState } from 'react';
import { isInPickupCountry } from '../utils/addressFormat';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  restrictCountryCode?: string | null;
  restrictCountryName?: string | null;
  locationBias?: google.maps.LatLngLiteral | null;
  disabled?: boolean;
  variant?: 'light' | 'dark';
  onFocusChange?: (focused: boolean) => void;
};

function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return mobile;
}

export default function PlaceSearchInput({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  className = '',
  inputClassName = '',
  restrictCountryCode = null,
  restrictCountryName = null,
  locationBias = null,
  disabled = false,
  variant = 'light',
  onFocusChange,
}: Props) {
  const isMobile = useIsMobile();
  const dropdownClass =
    variant === 'dark'
      ? 'bg-[#1a1a1a] border-gray-600'
      : 'bg-white border-gray-200';
  const itemHover = variant === 'dark' ? 'hover:bg-gray-800 active:bg-gray-800' : 'hover:bg-gray-50 active:bg-gray-50';
  const itemActive = variant === 'dark' ? 'bg-gray-800' : 'bg-blue-50';
  const mainText = variant === 'dark' ? 'text-white' : 'text-gray-900';
  const subText = variant === 'dark' ? 'text-gray-400' : 'text-gray-500';

  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof google !== 'undefined' && google.maps?.places) {
      serviceRef.current = new google.maps.places.AutocompleteService();
      placesRef.current = new google.maps.places.PlacesService(document.createElement('div'));
    }
  }, []);

  const fetchPredictions = useCallback(
    (input: string) => {
      if (!serviceRef.current || !restrictCountryCode || input.trim().length < 2) {
        setPredictions([]);
        setOpen(false);
        return;
      }

      const request: google.maps.places.AutocompletionRequest = {
        input,
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: [restrictCountryCode] },
      };

      if (locationBias) {
        request.locationBias = new google.maps.Circle({
          center: locationBias,
          radius: 200_000,
        });
      }

      serviceRef.current.getPlacePredictions(request, (results, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
          setPredictions([]);
          setOpen(false);
          return;
        }

        const filtered = results.filter((p) =>
          isInPickupCountry(p, restrictCountryCode, restrictCountryName)
        );
        setPredictions(filtered);
        setOpen(filtered.length > 0);
        setActiveIndex(-1);
      });
    },
    [restrictCountryCode, restrictCountryName, locationBias]
  );

  const selectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesRef.current) return;

    placesRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['formatted_address', 'name', 'geometry', 'address_components', 'types'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          onPlaceSelect(place);
          setOpen(false);
          setPredictions([]);
          inputRef.current?.blur();
        }
      }
    );
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const onInputChange = (text: string) => {
    onChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(text), 280);
  };

  const onInputFocus = () => {
    onFocusChange?.(true);
    if (isMobile) {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 350);
    }
    if (value.trim().length >= 2 && predictions.length > 0) setOpen(true);
  };

  const onInputBlur = () => {
    setTimeout(() => onFocusChange?.(false), 150);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || predictions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % predictions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? predictions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectPrediction(predictions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className={`relative z-30 ${className}`}>
      {open && predictions.length > 0 && (
        <ul
          className={`place-search-dropdown absolute left-0 right-0 z-50 overflow-y-auto overscroll-contain rounded-xl border shadow-lg py-1 ${dropdownClass} ${
            isMobile
              ? 'bottom-full mb-2 max-h-[180px]'
              : 'top-full mt-2 max-h-56'
          }`}
          role="listbox"
        >
          {predictions.map((p, i) => (
            <li
              key={p.place_id}
              role="option"
              aria-selected={i === activeIndex}
              className={`cursor-pointer px-4 py-3 border-b border-gray-100/10 last:border-0 ${
                i === activeIndex ? itemActive : itemHover
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectPrediction(p);
              }}
              onTouchStart={(e) => e.preventDefault()}
              onTouchEnd={(e) => {
                e.preventDefault();
                selectPrediction(p);
              }}
            >
              <span className={`font-semibold block truncate text-[15px] leading-tight ${mainText}`}>
                {p.structured_formatting.main_text}
              </span>
              {p.structured_formatting.secondary_text && (
                <span className={`text-xs truncate block mt-0.5 ${subText}`}>
                  {p.structured_formatting.secondary_text}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={disabled || !restrictCountryCode}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={onInputFocus}
        onBlur={onInputBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`relative z-10 ${inputClassName}`}
        autoComplete="off"
        enterKeyHint="search"
      />
    </div>
  );
}
