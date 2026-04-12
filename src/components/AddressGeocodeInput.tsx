import { useState, useRef, useEffect, useCallback } from 'react';
import { useAddressAutocomplete } from '../hooks/useAddressAutocomplete';
import { useAddressGeocode } from '../hooks/useAddressGeocode';
import { LABEL_CLASS, INPUT_CLASS } from './formStyles';

interface AddressGeocodeInputProps {
  lat: string;
  lng: string;
  address: string;
  onCoordsResolved: (lat: string, lng: string, address: string) => void;
  onManualEdit: (field: 'lat' | 'lng', value: string) => void;
}

export function AddressGeocodeInput({
  lat,
  lng,
  address,
  onCoordsResolved,
  onManualEdit,
}: AddressGeocodeInputProps) {
  const [mode, setMode] = useState<'autocomplete' | 'manual'>('autocomplete');
  const [query, setQuery] = useState(address);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [dropdownDismissed, setDropdownDismissed] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable ref for parent callback (F1 fix — avoids stale closure)
  const onCoordsResolvedRef = useRef(onCoordsResolved);
  useEffect(() => {
    onCoordsResolvedRef.current = onCoordsResolved;
  }, [onCoordsResolved]);

  const { predictions, loading: autocompleteLoading, error: autocompleteError } =
    useAddressAutocomplete(query, 300);
  const { result: geocodeResult, loading: geocodeLoading, error: geocodeError } =
    useAddressGeocode(selectedPlaceId);

  const isOpen = predictions.length > 0 && query.length >= 3 && !dropdownDismissed;

  // Derive mode from autocomplete error instead of setState in effect (T2 fix)
  const effectiveMode = autocompleteError ? 'manual' : mode;

  // When geocode resolves, push coords up to parent via stable ref (F1 fix)
  // setTimeout wrapper avoids synchronous setState in effect body (lint: set-state-in-effect)
  useEffect(() => {
    if (geocodeResult) {
      const tid = setTimeout(() => {
        onCoordsResolvedRef.current(
          geocodeResult.lat.toString(),
          geocodeResult.lng.toString(),
          geocodeResult.formattedAddress,
        );
        setQuery(geocodeResult.formattedAddress);
        setSelectedPlaceId(null);
      }, 0);
      return () => clearTimeout(tid);
    }
  }, [geocodeResult]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      items[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Click-outside dismissal (F5 fix)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownDismissed(true);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setActiveIndex(-1);
    setDropdownDismissed(false);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setDropdownDismissed(true);
      setActiveIndex(-1);
      return;
    }
    if (!isOpen || predictions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, predictions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const selected = predictions[activeIndex];
      if (selected) {
        handleSelect(selected.placeId, selected.description);
      }
    }
  }

  // F3 fix: show selected address text immediately instead of clearing
  function handleSelect(placeId: string, description: string) {
    setQuery(description);
    setActiveIndex(-1);
    setDropdownDismissed(true);
    setSelectedPlaceId(placeId);
  }

  const hasCoords = lat !== '' && lng !== '';

  if (effectiveMode === 'manual') {
    return (
      <div>
        {autocompleteError && (
          <p className="text-xs text-stone-500 mb-2">Address lookup unavailable</p>
        )}
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="manual-lat" className={LABEL_CLASS}>Latitude</label>
            <input
              id="manual-lat"
              type="number"
              step="any"
              value={lat}
              onChange={e => onManualEdit('lat', e.target.value)}
              placeholder="33.4484"
              className={INPUT_CLASS}
              aria-label="Latitude"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="manual-lng" className={LABEL_CLASS}>Longitude</label>
            <input
              id="manual-lng"
              type="number"
              step="any"
              value={lng}
              onChange={e => onManualEdit('lng', e.target.value)}
              placeholder="-112.0740"
              className={INPUT_CLASS}
              aria-label="Longitude"
            />
          </div>
        </div>
        {!autocompleteError && (
          <button
            type="button"
            onClick={() => setMode('autocomplete')}
            className="text-xs text-stone-400 hover:text-stone-600 cursor-pointer mt-1"
          >
            Use address lookup
          </button>
        )}
      </div>
    );
  }

  // Autocomplete mode
  return (
    <div ref={containerRef}>
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls="address-listbox"
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type an address to auto-fill coordinates..."
            className={`${INPUT_CLASS} pr-10`}
            aria-label="Address"
          />

          {/* Loading spinner — shown during autocomplete or geocoding */}
          {(autocompleteLoading || geocodeLoading) && (
            <div
              role="status"
              aria-label="Loading..."
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <svg
                className="animate-spin h-4 w-4 text-amber-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Predictions dropdown */}
        {isOpen && (
          <div
            id="address-listbox"
            ref={listRef}
            role="listbox"
            aria-label="Address suggestions"
            className="absolute z-50 w-full mt-1 bg-white border border-[#E8E0D5] rounded-xl shadow-lg overflow-hidden"
          >
            {predictions.map((p, i) => (
              <div
                key={p.placeId}
                role="option"
                aria-selected={i === activeIndex}
                tabIndex={-1}
                onClick={() => handleSelect(p.placeId, p.description)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`px-3 py-2.5 cursor-pointer font-sans text-sm text-stone-900 transition-colors ${
                  i === activeIndex ? 'bg-[#FFF8EE]' : 'hover:bg-[#FFF8EE]'
                }`}
              >
                <span className="font-bold">
                  {p.mainText}
                </span>
                <span className="text-stone-400 ml-1 text-xs">
                  {p.secondaryText}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Coordinate display */}
      <div className="mt-2">
        {hasCoords ? (
          <p className="font-sans text-sm text-stone-700 py-3 px-3 bg-stone-50 border border-[#E8E0D5] rounded-lg">
            {lat}, {lng}
          </p>
        ) : (
          <p className="font-sans text-sm text-stone-400 py-3 px-3 bg-stone-50 border border-[#E8E0D5] rounded-lg">
            No address selected
          </p>
        )}
      </div>

      {/* Geocode error display (F4 fix) */}
      {geocodeError && (
        <p className="text-red-600 text-xs font-sans mt-1">{geocodeError}</p>
      )}

      {/* Manual edit link */}
      <button
        type="button"
        onClick={() => setMode('manual')}
        className="text-xs text-stone-400 hover:text-stone-600 cursor-pointer mt-1"
      >
        Edit coordinates manually
      </button>
    </div>
  );
}
