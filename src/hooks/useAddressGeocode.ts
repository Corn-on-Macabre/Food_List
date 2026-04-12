import { useState, useEffect, useRef } from 'react';

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
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!placeId) return;
    const tid = setTimeout(() => {
      if (typeof google === 'undefined' || !google?.maps?.places?.PlacesService) {
        setError('Places API unavailable');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      if (!divRef.current) {
        divRef.current = document.createElement('div');
      }
      try {
        const service = new google.maps.places.PlacesService(divRef.current);
        service.getDetails(
          { placeId, fields: ['geometry', 'formatted_address'] },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              const lat = place.geometry?.location?.lat();
              const lng = place.geometry?.location?.lng();
              if (lat === undefined || lng === undefined) {
                setError('Place location data unavailable');
                setResult(null);
                setLoading(false);
                return;
              }
              setResult({
                lat,
                lng,
                formattedAddress: place.formatted_address ?? '',
              });
              setError(null);
            } else {
              setResult(null);
              setError(`Place details unavailable: ${status}`);
            }
            setLoading(false);
          }
        );
      } catch {
        setResult(null);
        setError('Places API unavailable');
        setLoading(false);
      }
    }, 0);
    return () => clearTimeout(tid);
  }, [placeId]);

  if (!placeId) return NULL_RESULT;
  return { result, loading, error };
}
