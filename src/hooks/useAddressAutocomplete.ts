import { useState, useEffect } from 'react';
import type { PlacePrediction } from './usePlacesAutocomplete';

interface UseAddressAutocompleteResult {
  predictions: PlacePrediction[];
  loading: boolean;
  error: string | null;
}

export function useAddressAutocomplete(
  query: string,
  debounceMs: number = 300
): UseAddressAutocompleteResult {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 3) return;
    const timerId = setTimeout(async () => {
      if (typeof google === 'undefined' || !google?.maps?.places) {
        setPredictions([]);
        setError('Places API unavailable');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Use new AutocompleteSuggestion API (replaces legacy AutocompleteService)
        const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          includedPrimaryTypes: ['street_address', 'subpremise', 'route', 'locality'],
        });

        const mapped: PlacePrediction[] = suggestions
          .filter((s): s is typeof s & { placePrediction: NonNullable<typeof s.placePrediction> } =>
            s.placePrediction !== null && s.placePrediction !== undefined
          )
          .map(s => ({
            placeId: s.placePrediction.placeId ?? '',
            mainText: s.placePrediction.mainText?.text ?? '',
            secondaryText: s.placePrediction.secondaryText?.text ?? '',
            description: s.placePrediction.text?.text ?? '',
          }));

        setPredictions(mapped);
        setError(null);
      } catch {
        setPredictions([]);
        setError('Places API unavailable');
      }
      setLoading(false);
    }, debounceMs);
    return () => clearTimeout(timerId);
  }, [query, debounceMs]);

  const isActive = query.length >= 3;
  return {
    predictions: isActive ? predictions : [],
    loading: isActive ? loading : false,
    error: isActive ? error : null,
  };
}
