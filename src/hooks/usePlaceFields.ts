import { useState, useEffect } from 'react';

interface UsePlaceFieldsResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Shared plumbing for fetching Google Place fields by place ID — the guard,
 * setTimeout(0) deferral, cancellation flag, and derived-loading logic that
 * usePlaceDetails and useAddressGeocode both need.
 *
 * `fields` and `mapPlace` must be referentially stable (module-scope consts) —
 * they are effect dependencies. `mapPlace` returns null when the place lacks
 * usable location data.
 */
export function usePlaceFields<T>(
  placeId: string | null,
  fields: readonly string[],
  mapPlace: (place: google.maps.places.Place, placeId: string) => T | null,
): UsePlaceFieldsResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placeId) return;

    let cancelled = false;

    // setTimeout(0) defers past the current commit so a rapid placeId change
    // can cancel before any network work starts.
    const tid = setTimeout(async () => {
      if (typeof google === 'undefined' || !google?.maps?.places?.Place) {
        setError('Places API unavailable');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Use new Place API (replaces legacy PlacesService.getDetails)
        const place = new google.maps.places.Place({ id: placeId });
        await place.fetchFields({ fields: [...fields] });

        if (cancelled) return;

        const mapped = mapPlace(place, placeId);
        if (mapped === null) {
          setError('Place location data unavailable');
          setData(null);
          setLoading(false);
          return;
        }

        setData(mapped);
        setError(null);
      } catch {
        if (!cancelled) {
          setData(null);
          setError('Places API unavailable');
        }
      }
      if (!cancelled) setLoading(false);
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(tid);
    };
  }, [placeId, fields, mapPlace]);

  // Derive null state when placeId is absent
  if (!placeId) {
    return { data: null, loading: false, error: null };
  }
  // Derive loading=true when placeId is set but no result yet (avoids race with setTimeout)
  const isLoading = loading || (!data && !error);
  return { data, loading: isLoading, error };
}
