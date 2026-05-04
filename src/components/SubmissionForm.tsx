import { useState, useEffect, useRef, useCallback } from 'react';
import { submitRestaurant, fetchMySubmissionsToday } from '../api/submissions';
import { usePlacesAutocomplete } from '../hooks/usePlacesAutocomplete';
import { usePlaceDetails } from '../hooks/usePlaceDetails';

interface Props {
  onClose: () => void;
}

const DAILY_LIMIT = 5;

export function SubmissionForm({ onClose }: Props) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);

  // Places autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { predictions, loading: autocompleteLoading } = usePlacesAutocomplete(searchQuery, 300);
  const { placeDetails } = usePlaceDetails(selectedPlaceId);

  // When place details resolve, auto-fill name + location
  useEffect(() => {
    if (!placeDetails) return;
    setName(placeDetails.name);
    setLocation(placeDetails.address);
    setSearchQuery(placeDetails.name);
    setShowDropdown(false);
    setSelectedPlaceId(null);
  }, [placeDetails]);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Check rate limit on mount
  useEffect(() => {
    let cancelled = false;
    fetchMySubmissionsToday()
      .then((count) => {
        if (cancelled) return;
        if (count >= DAILY_LIMIT) setRateLimited(true);
      })
      .catch(() => {
        // Silently allow — worst case the server RLS will block
      })
      .finally(() => {
        if (!cancelled) setCheckingLimit(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Auto-close after success
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [success, onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  const isDropdownOpen = showDropdown && predictions.length > 0 && searchQuery.length >= 2;

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
    setActiveIndex(-1);
  }

  function handlePlaceSelect(placeId: string) {
    setSelectedPlaceId(placeId);
    setShowDropdown(false);
    setActiveIndex(-1);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
      return;
    }
    if (!isDropdownOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, predictions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const selected = predictions[activeIndex];
      if (selected) handlePlaceSelect(selected.placeId);
    }
  }

  // Scroll active dropdown item into view
  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('[role="option"]');
      items[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await submitRestaurant({
        restaurant_name: name.trim(),
        location: location.trim(),
        user_note: note.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="bg-[#FFFBF5] rounded-xl shadow-xl border border-[#E8E0D5] w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close suggestion form"
          className="absolute top-3 right-3 text-stone-400 hover:text-stone-700 transition-colors duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <h2 className="font-display text-lg font-bold text-stone-900 mb-4">
          Suggest a Restaurant
        </h2>

        {/* Loading rate-limit check */}
        {checkingLimit && (
          <p className="font-sans text-sm text-stone-500">Checking...</p>
        )}

        {/* Rate limited */}
        {!checkingLimit && rateLimited && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="font-sans text-sm text-amber-800 font-medium">
              You've reached today's limit. Try again tomorrow.
            </p>
          </div>
        )}

        {/* Success */}
        {!checkingLimit && success && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[#B45309]"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="font-sans text-sm font-bold text-[#B45309]">
                Thanks! Bobby will review your suggestion.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        {!checkingLimit && !rateLimited && !success && (
          <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
            <div className="relative">
              <label htmlFor="sub-search" className="block font-sans text-sm font-medium text-stone-700 mb-1">
                Restaurant name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="sub-search"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={isDropdownOpen}
                  aria-controls="sub-places-listbox"
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search for a restaurant..."
                  className="w-full rounded-lg border border-[#E8E0D5] bg-white px-3 py-2 font-sans text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-colors duration-150 pr-9"
                />
                {autocompleteLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-4 w-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
              </div>

              {isDropdownOpen && (
                <div
                  id="sub-places-listbox"
                  ref={dropdownRef}
                  role="listbox"
                  aria-label="Restaurant suggestions"
                  className="absolute z-50 w-full mt-1 bg-white border border-[#E8E0D5] rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto"
                >
                  {predictions.map((p, i) => (
                    <div
                      key={p.placeId}
                      role="option"
                      aria-selected={i === activeIndex}
                      tabIndex={-1}
                      onClick={() => handlePlaceSelect(p.placeId)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`px-3 py-2.5 cursor-pointer font-sans text-sm text-stone-900 transition-colors ${
                        i === activeIndex ? 'bg-[#FFF8EE]' : 'hover:bg-[#FFF8EE]'
                      }`}
                    >
                      <span className="font-bold">{p.mainText}</span>
                      <span className="text-stone-400 ml-1 text-xs">{p.secondaryText}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Show selected name below search if it differs from query */}
              {name && name !== searchQuery && (
                <p className="mt-1 font-sans text-xs text-amber-700">
                  Selected: {name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="sub-location" className="block font-sans text-sm font-medium text-stone-700 mb-1">
                Location / Address <span className="text-red-500">*</span>
              </label>
              <input
                id="sub-location"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Auto-filled from search, or enter manually"
                className="w-full rounded-lg border border-[#E8E0D5] bg-white px-3 py-2 font-sans text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-colors duration-150"
              />
            </div>

            <div>
              <label htmlFor="sub-note" className="block font-sans text-sm font-medium text-stone-700 mb-1">
                Why do you recommend it?
              </label>
              <textarea
                id="sub-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="What makes this place special?"
                className="w-full rounded-lg border border-[#E8E0D5] bg-white px-3 py-2 font-sans text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-colors duration-150 resize-none"
              />
            </div>

            {error && (
              <p className="font-sans text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !name.trim() || !location.trim()}
              className="w-full bg-[#D97706] text-white font-sans text-sm font-bold rounded-lg px-4 py-2.5 hover:bg-amber-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
