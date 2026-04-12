import { useState, useEffect } from 'react';

export interface PlacePrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

interface UsePlacesAutocompleteResult {
  predictions: PlacePrediction[];
  loading: boolean;
  error: string | null;
}

export function usePlacesAutocomplete(
  query: string,
  debounceMs: number = 300
): UsePlacesAutocompleteResult {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip API call for empty/short queries — state cleared via derived values below
    if (!query || query.length < 2) return;

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
          includedPrimaryTypes: ['restaurant', 'cafe', 'meal_takeaway', 'meal_delivery', 'bakery'],
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

  // Derive: suppress stale state when query drops below threshold — avoids setState in effect
  const isActive = query.length >= 2;
  return {
    predictions: isActive ? predictions : [],
    loading: isActive ? loading : false,
    error: isActive ? error : null,
  };
}
