import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { isInPickupCountry } from '../utils/addressFormat';

type PanelRect = { top: number; left: number; width: number; maxHeight: number };

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
}: Props) {
  const isMobile = useIsMobile();
  const dropdownClass =
    variant === 'dark'
      ? 'bg-gray-900 border-gray-600 shadow-2xl'
      : 'bg-white border-gray-200 shadow-2xl';
  const itemHover = variant === 'dark' ? 'hover:bg-gray-800 active:bg-gray-800' : 'hover:bg-gray-50 active:bg-gray-50';
  const itemActive = variant === 'dark' ? 'bg-gray-800' : 'bg-blue-50';
  const mainText = variant === 'dark' ? 'text-white' : 'text-gray-900';
  const subText = variant === 'dark' ? 'text-gray-400' : 'text-gray-500';

  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [panelRect, setPanelRect] = useState<PanelRect | null>(null);

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

  const updatePanelPosition = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vv = window.visualViewport;
    const vTop = vv?.offsetTop ?? 0;
    const gap = 10;
    const spaceAbove = rect.top - vTop - gap;
    const maxHeight = Math.min(260, Math.max(140, spaceAbove));
    const top = Math.max(vTop + gap, rect.top - maxHeight - gap);

    setPanelRect({
      top,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  }, []);

  useEffect(() => {
    if (!open || !isMobile) {
      setPanelRect(null);
      return;
    }
    updatePanelPosition();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', updatePanelPosition);
    vv?.addEventListener('scroll', updatePanelPosition);
    window.addEventListener('resize', updatePanelPosition);
    return () => {
      vv?.removeEventListener('resize', updatePanelPosition);
      vv?.removeEventListener('scroll', updatePanelPosition);
      window.removeEventListener('resize', updatePanelPosition);
    };
  }, [open, isMobile, predictions.length, updatePanelPosition]);

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
        if (filtered.length > 0 && isMobile) {
          requestAnimationFrame(updatePanelPosition);
        }
      });
    },
    [restrictCountryCode, restrictCountryName, locationBias, isMobile, updatePanelPosition]
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
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if ((target as Element).closest?.('.place-search-dropdown')) return;
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
    if (isMobile) {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        updatePanelPosition();
      }, 300);
    }
    if (value.trim().length >= 2 && predictions.length > 0) setOpen(true);
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

  const renderItems = () =>
    predictions.map((p, i) => (
      <li
        key={p.place_id}
        role="option"
        aria-selected={i === activeIndex}
        className={`cursor-pointer px-4 py-3.5 border-b border-gray-100/80 last:border-0 ${
          i === activeIndex ? itemActive : itemHover
        }`}
        onMouseDown={(e) => {
          e.preventDefault();
          selectPrediction(p);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          selectPrediction(p);
        }}
      >
        <span className={`font-semibold block truncate text-[15px] ${mainText}`}>
          {p.structured_formatting.main_text}
        </span>
        {p.structured_formatting.secondary_text && (
          <span className={`text-xs truncate block mt-0.5 ${subText}`}>
            {p.structured_formatting.secondary_text}
          </span>
        )}
      </li>
    ));

  const dropdownList = open && predictions.length > 0 && (
    <ul
      className={`place-search-dropdown overflow-y-auto overscroll-contain rounded-2xl border py-1 ${dropdownClass} ${
        isMobile ? '' : 'absolute left-0 right-0 top-full z-[200] mt-2 max-h-56'
      }`}
      style={
        isMobile && panelRect
          ? {
              position: 'fixed',
              top: panelRect.top,
              left: panelRect.left,
              width: panelRect.width,
              maxHeight: panelRect.maxHeight,
              zIndex: 10050,
            }
          : undefined
      }
      role="listbox"
    >
      {renderItems()}
    </ul>
  );

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={disabled || !restrictCountryCode}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={onInputFocus}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
        enterKeyHint="search"
      />
      {!isMobile && dropdownList}
      {isMobile && dropdownList && panelRect && createPortal(dropdownList, document.body)}
    </div>
  );
}
