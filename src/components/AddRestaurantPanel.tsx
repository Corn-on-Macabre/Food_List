import { useState, useEffect, useCallback } from 'react';
import type { Restaurant } from '../types';
import type { PlaceDraft } from '../hooks/usePlaceDetails';
import { usePlaceDetails } from '../hooks/usePlaceDetails';
import { PlacesSearchInput } from './PlacesSearchInput';
import { RestaurantDraftForm } from './RestaurantDraftForm';
import { BTN_SECONDARY } from './styles';

type PanelState = 'search' | 'loading-details' | 'draft' | 'manual' | 'success';

export interface SubmissionPrefill {
  name: string;
  location: string;
  suggestedBy?: string;
  suggestedByAvatar?: string;
}

interface Props {
  onRestaurantAdded: (restaurant: Restaurant) => void;
  prefill?: SubmissionPrefill | null;
  onPrefillConsumed?: () => void;
}

export function AddRestaurantPanel({ onRestaurantAdded, prefill, onPrefillConsumed }: Props) {
  const [panelState, setPanelState] = useState<PanelState>(prefill ? 'manual' : 'search');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [resolvedDraft, setResolvedDraft] = useState<PlaceDraft | null>(null);

  // When prefill changes (from submission approval), jump to manual mode.
  // Adjusted during render (React's recommended pattern) instead of an effect
  // so there is no extra commit with stale state.
  const [lastPrefill, setLastPrefill] = useState(prefill ?? null);
  if ((prefill ?? null) !== lastPrefill) {
    setLastPrefill(prefill ?? null);
    if (prefill) {
      setPanelState('manual');
      setResolvedDraft({
        name: prefill.name,
        address: prefill.location,
        lat: 0,
        lng: 0,
        priceLevel: null,
        cuisine: '',
        googleMapsUrl: '',
        placeId: '',
      });
    }
  }

  const { placeDetails, loading: detailsLoading, error: detailsError } = usePlaceDetails(selectedPlaceId);

  // React to place details resolution
  // All setState calls wrapped in setTimeout to avoid synchronous setState in effect body
  useEffect(() => {
    if (panelState !== 'loading-details') return;
    if (detailsLoading) return;

    const tid = setTimeout(() => {
      if (detailsError || !placeDetails) {
        setPanelState('manual');
      } else {
        setResolvedDraft(placeDetails);
        setPanelState('draft');
      }
    }, 0);
    return () => clearTimeout(tid);
  }, [placeDetails, detailsLoading, detailsError, panelState]);

  function handlePlaceSelect(placeId: string) {
    setSelectedPlaceId(placeId);
    setPanelState('loading-details');
  }

  function handleManualAdd() {
    setSelectedPlaceId(null);
    setResolvedDraft(null);
    setPanelState('manual');
  }

  function clearPrefill() {
    if (onPrefillConsumed) onPrefillConsumed();
  }

  function handleSave(restaurant: Restaurant) {
    onRestaurantAdded(restaurant);
    clearPrefill();
    setPanelState('success');
  }

  function handleCancel() {
    setSelectedPlaceId(null);
    setResolvedDraft(null);
    clearPrefill();
    setPanelState('search');
  }

  const handleAddAnother = useCallback(() => {
    setSelectedPlaceId(null);
    setResolvedDraft(null);
    onPrefillConsumed?.();
    setPanelState('search');
  }, [onPrefillConsumed]);

  // Auto-reset after 2 seconds in success state
  useEffect(() => {
    if (panelState !== 'success') return;
    const timer = setTimeout(() => {
      handleAddAnother();
    }, 2000);
    return () => clearTimeout(timer);
  }, [panelState, handleAddAnother]);

  return (
    <section className="bg-brand-surface border border-brand-border rounded-xl p-5">
      <h2 className="font-display text-base font-bold text-brand-text mb-4">Add Restaurant</h2>

      {/* Search state */}
      {panelState === 'search' && (
        <PlacesSearchInput
          onPlaceSelect={handlePlaceSelect}
          onManualAdd={handleManualAdd}
        />
      )}

      {/* Loading state */}
      {panelState === 'loading-details' && (
        <div className="flex items-center gap-2 py-4">
          <svg
            className="animate-spin h-5 w-5 text-tier-loved"
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
          <p className="font-sans text-sm text-brand-text-muted">Loading place details…</p>
        </div>
      )}

      {/* Draft state (auto-fill) */}
      {panelState === 'draft' && (
        <RestaurantDraftForm
          initialDraft={resolvedDraft}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Manual state (resolvedDraft may contain prefill data from submissions) */}
      {panelState === 'manual' && (
        <RestaurantDraftForm
          initialDraft={resolvedDraft}
          onSave={handleSave}
          onCancel={handleCancel}
          suggestedBy={prefill?.suggestedBy}
          suggestedByAvatar={prefill?.suggestedByAvatar}
        />
      )}

      {/* Success state */}
      {panelState === 'success' && (
        <div className="bg-brand-tint border border-brand-tint-border rounded-xl p-5 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Checkmark icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-brand-accent"
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
            <p className="font-sans text-sm font-bold text-brand-accent">
              Restaurant added successfully.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddAnother}
            aria-label="Add another restaurant"
            className={`${BTN_SECONDARY} px-3 py-1.5`}
          >
            Add Another
          </button>
        </div>
      )}
    </section>
  );
}
