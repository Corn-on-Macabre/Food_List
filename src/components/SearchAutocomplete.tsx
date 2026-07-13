import { useState, useMemo, useRef, useEffect } from 'react';
import type { Restaurant } from '../types/restaurant';

interface SearchAutocompleteProps {
  searchTerm: string | null;
  onSearchChange: (term: string | null) => void;
  restaurants: Restaurant[];
  onRestaurantSelect: (restaurant: Restaurant) => void;
}

function highlightMatch(name: string, term: string): React.JSX.Element {
  const lower = name.toLowerCase();
  const idx = lower.indexOf(term.toLowerCase());
  if (idx === -1) return <>{name}</>;

  const before = name.slice(0, idx);
  const match = name.slice(idx, idx + term.length);
  const after = name.slice(idx + term.length);

  return (
    <>
      {before}
      <mark className="bg-amber-100 text-amber-900 rounded-sm">{match}</mark>
      {after}
    </>
  );
}

export function SearchAutocomplete({
  searchTerm,
  onSearchChange,
  restaurants,
  onRestaurantSelect,
}: SearchAutocompleteProps) {
  const [focused, setFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dismissed, setDismissed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const matches = useMemo(() => {
    if (!searchTerm) return [];
    const lower = searchTerm.toLowerCase();
    return restaurants
      .filter(r => r.name.toLowerCase().includes(lower))
      .slice(0, 7);
  }, [searchTerm, restaurants]);

  // Reset highlight and un-dismiss when search term changes
  useEffect(() => {
    setHighlightedIndex(-1);
    setDismissed(false);
  }, [searchTerm]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const showDropdown = focused && !dismissed && matches.length > 0;

  function handleSelect(restaurant: Restaurant) {
    onRestaurantSelect(restaurant);
    setDismissed(true);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (dismissed) setDismissed(false);
      setHighlightedIndex(prev =>
        prev < matches.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev =>
        prev > 0 ? prev - 1 : matches.length - 1
      );
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < matches.length) {
        e.preventDefault();
        handleSelect(matches[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setDismissed(true);
      setHighlightedIndex(-1);
      onSearchChange(null);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label="Search restaurants by name"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls={showDropdown ? 'search-matches' : undefined}
        aria-activedescendant={highlightedIndex >= 0 ? `match-${highlightedIndex}` : undefined}
        placeholder="Search restaurants..."
        value={searchTerm ?? ''}
        onChange={(e) => {
          onSearchChange(e.target.value || null);
        }}
        onFocus={() => {
          clearTimeout(blurTimeoutRef.current);
          setFocused(true);
        }}
        onBlur={() => {
          blurTimeoutRef.current = setTimeout(() => setFocused(false), 200);
        }}
        onKeyDown={handleKeyDown}
        className="w-full pl-9 pr-8 py-2 text-xs font-sans bg-white border border-[#E8E0D5] rounded-full focus:outline-none focus:ring-2 focus:ring-[#FDE68A] placeholder:text-stone-400 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {searchTerm !== null && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onSearchChange(null);
            setDismissed(true);
            setHighlightedIndex(-1);
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-stone-600"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {showDropdown && (
        <ul
          ref={listRef}
          id="search-matches"
          role="listbox"
          aria-label="Matching restaurants"
          className="absolute left-0 right-0 mt-1 z-[100] bg-white border border-[#E8E0D5] rounded-xl shadow-lg max-h-[280px] overflow-y-auto"
        >
          {matches.map((restaurant, index) => (
            <li
              key={restaurant.id}
              id={`match-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(restaurant);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-3 py-2.5 cursor-pointer font-sans text-sm transition-colors ${
                index === highlightedIndex ? 'bg-amber-50' : ''
              } ${index === 0 ? 'rounded-t-xl' : ''} ${index === matches.length - 1 ? 'rounded-b-xl' : ''}`}
            >
              <span className="font-semibold text-stone-800">
                {highlightMatch(restaurant.name, searchTerm!)}
              </span>
              <span className="text-xs text-stone-400 ml-2">{restaurant.cuisine}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
