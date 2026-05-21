import { useCallback, useEffect, useRef, useState } from 'react';
import { isInExcludedCountry } from '../utils/addressFormat';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  excludeCountryCode?: string | null;
  excludeCountryName?: string | null;
  disabled?: boolean;
  variant?: 'light' | 'dark';
};

export default function PlaceSearchInput({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  className = '',
  inputClassName = '',
  excludeCountryCode = null,
  excludeCountryName = null,
  disabled = false,
  variant = 'light',
}: Props) {
  const dropdownClass =
    variant === 'dark'
      ? 'bg-gray-800 border-gray-700 shadow-2xl'
      : 'bg-white border-gray-200 shadow-xl';
  const itemHover = variant === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const itemActive = variant === 'dark' ? 'bg-gray-700' : 'bg-gray-100';
  const mainText = variant === 'dark' ? 'text-white' : 'text-gray-900';
  const subText = variant === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);
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
      if (!serviceRef.current || input.trim().length < 2) {
        setPredictions([]);
        setOpen(false);
        return;
      }

      serviceRef.current.getPlacePredictions(
        { input, types: ['geocode', 'establishment'] },
        (results, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
            setPredictions([]);
            setOpen(false);
            return;
          }

          const filtered = results.filter(
            (p) => !isInExcludedCountry(p, excludeCountryCode, excludeCountryName)
          );
          setPredictions(filtered);
          setOpen(filtered.length > 0);
          setActiveIndex(-1);
        }
      );
    },
    [excludeCountryCode, excludeCountryName]
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
        }
      }
    );
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const onInputChange = (text: string) => {
    onChange(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(text), 280);
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
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={() => value.trim().length >= 2 && predictions.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
      />
      {open && predictions.length > 0 && (
        <ul
          className={`place-search-dropdown absolute left-0 right-0 top-full z-[100] mt-2 max-h-56 overflow-y-auto rounded-2xl border py-1 ${dropdownClass}`}
          role="listbox"
        >
          {predictions.map((p, i) => (
            <li
              key={p.place_id}
              role="option"
              aria-selected={i === activeIndex}
              className={`cursor-pointer px-4 py-3 text-sm ${
                i === activeIndex ? itemActive : itemHover
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectPrediction(p);
              }}
            >
              <span className={`font-semibold block truncate ${mainText}`}>
                {p.structured_formatting.main_text}
              </span>
              {p.structured_formatting.secondary_text && (
                <span className={`text-xs truncate block ${subText}`}>
                  {p.structured_formatting.secondary_text}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
