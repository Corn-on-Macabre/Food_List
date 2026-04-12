import { useState, useEffect } from 'react';

interface UseAddressAutocompleteResult {
  predictions: google.maps.places.AutocompletePrediction[];
  loading: boolean;
  error: string | null;
}

export function useAddressAutocomplete(
  query: string,
  debounceMs: number = 300
): UseAddressAutocompleteResult {
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 3) return;
    const timerId = setTimeout(() => {
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
          { input: query, types: ['geocode'] },
          (results, status) => {
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

  const isActive = query.length >= 3;
  return {
    predictions: isActive ? predictions : [],
    loading: isActive ? loading : false,
    error: isActive ? error : null,
  };
}
