import { useState, useEffect } from 'react';

export interface AddressGeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

const NULL_RESULT = { result: null, loading: false, error: null } as const;

export function useAddressGeocode(placeId: string | null) {
  const [result, setResult] = useState<AddressGeocodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placeId) return;

    let cancelled = false;

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
        await place.fetchFields({
          fields: ['location', 'formattedAddress'],
        });

        if (cancelled) return;

        const lat = place.location?.lat();
        const lng = place.location?.lng();
        if (lat === undefined || lng === undefined) {
          setError('Place location data unavailable');
          setResult(null);
          setLoading(false);
          return;
        }
        setResult({
          lat,
          lng,
          formattedAddress: place.formattedAddress ?? '',
        });
        setError(null);
      } catch {
        if (!cancelled) {
          setResult(null);
          setError('Places API unavailable');
        }
      }
      if (!cancelled) setLoading(false);
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(tid);
    };
  }, [placeId]);

  if (!placeId) return NULL_RESULT;
  return { result, loading, error };
}
