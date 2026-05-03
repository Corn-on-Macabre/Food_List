import { useState, useEffect, useRef, useCallback } from 'react';
import { submitRestaurant, fetchMySubmissionsToday } from '../api/submissions';
import { parseGoogleMapsUrl } from '../utils/parseGoogleMapsUrl';
import { lookupPlaceFromUrl } from '../api/placesLookup';

interface Props {
  onClose: () => void;
}

const DAILY_LIMIT = 5;

/** Prefixes that identify a Google Maps URL in pasted text */
const MAPS_URL_PREFIXES = [
  'https://www.google.com/maps/',
  'https://google.com/maps/',
  'https://maps.google.com/',
  'https://maps.app.goo.gl/',
  'https://goo.gl/maps/',
  'http://www.google.com/maps/',
  'http://google.com/maps/',
  'http://maps.google.com/',
  'http://maps.app.goo.gl/',
  'http://goo.gl/maps/',
];

function looksLikeGoogleMapsUrl(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return MAPS_URL_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

export function SubmissionForm({ onClose }: Props) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(true);

  // URL extraction state
  const [extracting, setExtracting] = useState(false);
  const [extractionMessage, setExtractionMessage] = useState<string | null>(null);
  const extractionAbort = useRef(false);

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

  // Clear extraction message after a few seconds
  useEffect(() => {
    if (!extractionMessage) return;
    const timer = setTimeout(() => setExtractionMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [extractionMessage]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  async function handleUrlExtraction(pastedUrl: string): Promise<void> {
    // Abort any previous extraction
    extractionAbort.current = true;
    // Reset for this extraction
    extractionAbort.current = false;
    setExtracting(true);
    setExtractionMessage(null);

    try {
      const parsed = parseGoogleMapsUrl(pastedUrl.trim());
      if (!parsed) {
        setExtracting(false);
        return;
      }

      const result = await lookupPlaceFromUrl(parsed);

      if (extractionAbort.current) return;

      if (result) {
        // Pre-fill name only if the user hasn't typed one yet
        if (!name.trim()) {
          setName(result.name);
        }
        // Replace the URL in location with the extracted address
        setLocation(result.address);
        setExtractionMessage(null);
      } else {
        setExtractionMessage("Couldn't extract details automatically");
      }
    } catch {
      if (!extractionAbort.current) {
        setExtractionMessage("Couldn't extract details automatically");
      }
    } finally {
      if (!extractionAbort.current) {
        setExtracting(false);
      }
    }
  }

  function handleLocationPaste(e: React.ClipboardEvent<HTMLInputElement>): void {
    const pasted = e.clipboardData.getData('text');
    if (looksLikeGoogleMapsUrl(pasted)) {
      // Let the paste happen normally (sets the input value), then trigger extraction
      // Use setTimeout so the input value is updated first
      setTimeout(() => {
        void handleUrlExtraction(pasted);
      }, 0);
    }
  }

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
            <div>
              <label htmlFor="sub-name" className="block font-sans text-sm font-medium text-stone-700 mb-1">
                Restaurant name <span className="text-red-500">*</span>
              </label>
              <input
                id="sub-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Pizzeria Bianco"
                className="w-full rounded-lg border border-[#E8E0D5] bg-white px-3 py-2 font-sans text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-colors duration-150"
              />
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
                onPaste={handleLocationPaste}
                placeholder="e.g., 623 E Adams St, Phoenix — or paste a Google Maps link"
                className="w-full rounded-lg border border-[#E8E0D5] bg-white px-3 py-2 font-sans text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-colors duration-150"
              />
              {/* Extraction status messages */}
              {extracting && (
                <p className="mt-1 font-sans text-xs text-amber-600">
                  Extracting details...
                </p>
              )}
              {extractionMessage && !extracting && (
                <p className="mt-1 font-sans text-xs text-stone-500">
                  {extractionMessage}
                </p>
              )}
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
