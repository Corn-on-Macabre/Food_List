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

interface PlacesAutocompleteOptions {
  /** Minimum query length before hitting the API (default 2). */
  minLength?: number;
  /** Restrict results, e.g. address-only types for the geocode input. */
  includedPrimaryTypes?: string[];
}

export function usePlacesAutocomplete(
  query: string,
  debounceMs: number = 300,
  { minLength = 2, includedPrimaryTypes }: PlacesAutocompleteOptions = {}
): UsePlacesAutocompleteResult {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable dep for the effect — array literals change identity every render
  const typesKey = includedPrimaryTypes?.join(',');

  useEffect(() => {
    // Skip API call for empty/short queries — state cleared via derived values below
    if (!query || query.length < minLength) return;

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
          ...(typesKey ? { includedPrimaryTypes: typesKey.split(',') } : {}),
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
  }, [query, debounceMs, minLength, typesKey]);

  // Derive: suppress stale state when query drops below threshold — avoids setState in effect
  const isActive = query.length >= minLength;
  return {
    predictions: isActive ? predictions : [],
    loading: isActive ? loading : false,
    error: isActive ? error : null,
  };
}
