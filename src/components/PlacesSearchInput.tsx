import { useState, useRef, useEffect } from 'react';
import { usePlacesAutocomplete } from '../hooks/usePlacesAutocomplete';

interface Props {
  onPlaceSelect: (placeId: string) => void;
  onManualAdd: () => void;
}

export function PlacesSearchInput({ onPlaceSelect, onManualAdd }: Props) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { predictions, loading, error } = usePlacesAutocomplete(query, 300);

  // Derive open state — no useEffect needed
  const isOpen = predictions.length > 0 && query.length >= 2;

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      items[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setActiveIndex(-1); // Reset on every keystroke; isOpen is derived from predictions+query
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setQuery(''); // Clears query → isOpen becomes false (derived)
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
        handleSelect(selected.place_id);
      }
    }
  }

  function handleSelect(placeId: string) {
    setQuery(''); // Clears query → isOpen becomes false (derived)
    setActiveIndex(-1);
    onPlaceSelect(placeId);
  }

  const showManualAdd = !!error;

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="places-listbox"
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search restaurant name and location..."
          className="w-full border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FDE68A] pr-10"
        />

        {/* Loading spinner */}
        {loading && (
          <div
            role="status"
            aria-label="Searching..."
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
      {isOpen && predictions.length > 0 && (
        <div
          id="places-listbox"
          ref={listRef}
          role="listbox"
          aria-label="Restaurant suggestions"
          className="absolute z-50 w-full mt-1 bg-white border border-[#E8E0D5] rounded-xl shadow-lg overflow-hidden"
        >
          {predictions.map((p, i) => (
            <div
              key={p.place_id}
              role="option"
              aria-selected={i === activeIndex}
              tabIndex={-1}
              onClick={() => handleSelect(p.place_id)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`px-3 py-2.5 cursor-pointer font-sans text-sm text-stone-900 transition-colors ${
                i === activeIndex ? 'bg-[#FFF8EE]' : 'hover:bg-[#FFF8EE]'
              }`}
            >
              <span className="font-bold">
                {p.structured_formatting.main_text}
              </span>
              <span className="text-stone-400 ml-1 text-xs">
                {p.structured_formatting.secondary_text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Error state + manual add */}
      {showManualAdd && (
        <div className="mt-2 flex items-center gap-2">
          <p className="font-sans text-xs text-stone-500">
            Search unavailable — you can still add details manually
          </p>
          <button
            type="button"
            onClick={onManualAdd}
            aria-label="Add manually"
            className="font-sans text-xs font-bold text-amber-700 hover:text-amber-900 underline"
          >
            Add Manually
          </button>
        </div>
      )}

      {/* Manual add shortcut when no error but user wants it */}
      {!showManualAdd && (
        <div className="mt-2">
          <button
            type="button"
            onClick={onManualAdd}
            aria-label="Add manually"
            className="font-sans text-xs text-stone-400 hover:text-stone-600"
          >
            Or add manually without search
          </button>
        </div>
      )}
    </div>
  );
}
