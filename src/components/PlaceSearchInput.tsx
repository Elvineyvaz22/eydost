import { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { isInPickupCountry } from '../utils/addressFormat';

export type PlaceSearchInputHandle = {
  focus: () => void;
  blur: () => void;
};

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
  /** Suggestions fill space between top search bar and keyboard */
  suggestionsPlacement?: 'below-input' | 'above-keyboard';
  /** px from viewport top where suggestion list starts (above-keyboard mode) */
  listTop?: number;
  onPredictionsOpenChange?: (open: boolean) => void;
};

const PlaceSearchInput = forwardRef<PlaceSearchInputHandle, Props>(function PlaceSearchInput(
  {
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
    suggestionsPlacement = 'below-input',
    listTop = 120,
    onPredictionsOpenChange,
  },
  ref
) {
  const dropdownClass =
    variant === 'dark' ? 'bg-[#1a1a1a] border-gray-600' : 'bg-white border-gray-200';
  const itemHover = variant === 'dark' ? 'hover:bg-gray-50/10' : 'hover:bg-gray-50';
  const itemActive = variant === 'dark' ? 'bg-gray-800' : 'bg-blue-50';
  const mainText = variant === 'dark' ? 'text-white' : 'text-gray-900';
  const subText = variant === 'dark' ? 'text-gray-400' : 'text-gray-500';

  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [keyboardBottom, setKeyboardBottom] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }));

  useEffect(() => {
    onPredictionsOpenChange?.(open && predictions.length > 0);
  }, [open, predictions.length, onPredictionsOpenChange]);

  useEffect(() => {
    if (typeof google !== 'undefined' && google.maps?.places) {
      serviceRef.current = new google.maps.places.AutocompleteService();
      placesRef.current = new google.maps.places.PlacesService(document.createElement('div'));
    }
  }, []);

  useEffect(() => {
    if (suggestionsPlacement !== 'above-keyboard' || !open) return;

    const updateKeyboard = () => {
      const vv = window.visualViewport;
      if (!vv) {
        setKeyboardBottom(0);
        return;
      }
      const kb = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardBottom(Math.max(0, kb));
    };

    updateKeyboard();
    window.visualViewport?.addEventListener('resize', updateKeyboard);
    window.visualViewport?.addEventListener('scroll', updateKeyboard);
    return () => {
      window.visualViewport?.removeEventListener('resize', updateKeyboard);
      window.visualViewport?.removeEventListener('scroll', updateKeyboard);
    };
  }, [suggestionsPlacement, open]);

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
      const t = e.target as Node;
      if (wrapperRef.current?.contains(t)) return;
      if ((t as Element).closest?.('.place-search-suggestions-panel')) return;
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
    if (value.trim().length >= 2 && predictions.length > 0) setOpen(true);
  };

  const onInputBlur = () => {
    setTimeout(() => onFocusChange?.(false), 200);
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

  const suggestionItems = predictions.map((p, i) => (
    <li
      key={p.place_id}
      role="option"
      aria-selected={i === activeIndex}
      className={`cursor-pointer px-4 py-3.5 border-b border-gray-100 last:border-0 ${
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

  const inlineDropdown =
    suggestionsPlacement === 'below-input' && open && predictions.length > 0 ? (
      <ul
        className={`place-search-dropdown absolute left-0 right-0 top-full z-50 mt-2 max-h-56 overflow-y-auto overscroll-contain rounded-xl border shadow-lg py-1 ${dropdownClass}`}
        role="listbox"
      >
        {suggestionItems}
      </ul>
    ) : null;

  const keyboardPanel =
    suggestionsPlacement === 'above-keyboard' && open && predictions.length > 0
      ? createPortal(
          <ul
            className={`place-search-suggestions-panel fixed left-0 right-0 z-[10040] overflow-y-auto overscroll-contain border-t shadow-[0_-4px_24px_rgba(0,0,0,0.08)] py-1 ${dropdownClass}`}
            style={{
              top: listTop,
              bottom: keyboardBottom,
            }}
            role="listbox"
          >
            {suggestionItems}
          </ul>,
          document.body
        )
      : null;

  return (
    <>
      <div ref={wrapperRef} className={`relative flex-1 min-w-0 ${className}`}>
        {inlineDropdown}
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
          className={inputClassName}
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>
      {keyboardPanel}
    </>
  );
});

export default PlaceSearchInput;
