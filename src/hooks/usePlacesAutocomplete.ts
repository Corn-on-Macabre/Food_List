import { useState, useEffect } from 'react';

interface UsePlacesAutocompleteResult {
  predictions: google.maps.places.AutocompletePrediction[];
  loading: boolean;
  error: string | null;
}

export function usePlacesAutocomplete(
  query: string,
  debounceMs: number = 300
): UsePlacesAutocompleteResult {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip API call for empty/short queries — state cleared via derived values below
    if (!query || query.length < 2) return;

    const timerId = setTimeout(() => {
      // Check API availability inside the timer (async context — not flagged by lint rule)
      if (typeof google === 'undefined' || !google?.maps?.places?.AutocompleteService) {
        setPredictions([]);
        setError('Places API unavailable');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const service = new google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          { input: query, types: ['restaurant', 'food'] },
          (
            results: google.maps.places.AutocompletePrediction[] | null,
            status: google.maps.places.PlacesServiceStatus
          ) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              setPredictions(results);
              setError(null);
            } else {
              setPredictions([]);
              setError(`Places search returned: ${status}`);
            }
            setLoading(false);
          }
        );
      } catch {
        setPredictions([]);
        setError('Places API unavailable');
        setLoading(false);
      }
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
