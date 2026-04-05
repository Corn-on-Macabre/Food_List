import { useState, useEffect, useRef } from 'react';
import { mapPlaceTypeToCuisine } from '../utils/mapPlaceType';

export interface PlaceDraft {
  name: string;
  address: string;
  lat: number;
  lng: number;
  priceLevel: number | null;
  cuisine: string;
  googleMapsUrl: string;
  placeId: string;
}

interface UsePlaceDetailsResult {
  placeDetails: PlaceDraft | null;
  loading: boolean;
  error: string | null;
}

export function usePlaceDetails(placeId: string | null): UsePlaceDetailsResult {
  const [placeDetails, setPlaceDetails] = useState<PlaceDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Hidden div for PlacesService to attach to
  const divRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!placeId) return;

    // Wrap all logic in setTimeout so setState calls are async (satisfies react-hooks/set-state-in-effect)
    const tid = setTimeout(() => {
      if (typeof google === 'undefined' || !google?.maps?.places?.PlacesService) {
        setError('Places API unavailable');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // PlacesService requires a DOM element or Map instance
      if (!divRef.current) {
        divRef.current = document.createElement('div');
      }

      try {
        const service = new google.maps.places.PlacesService(divRef.current);
        service.getDetails(
          {
            placeId,
            fields: ['name', 'formatted_address', 'geometry', 'price_level', 'types', 'url', 'place_id'],
          },
          (
            place: google.maps.places.PlaceResult | null,
            status: google.maps.places.PlacesServiceStatus
          ) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              const lat = place.geometry?.location?.lat();
              const lng = place.geometry?.location?.lng();

              if (lat === undefined || lng === undefined) {
                setError('Place location data unavailable');
                setPlaceDetails(null);
                setLoading(false);
                return;
              }

              const draft: PlaceDraft = {
                name: place.name ?? '',
                address: place.formatted_address ?? '',
                lat,
                lng,
                priceLevel: place.price_level ?? null,
                cuisine: mapPlaceTypeToCuisine(place.types ?? []),
                googleMapsUrl: place.url ?? '',
                placeId: place.place_id ?? placeId,
              };

              setPlaceDetails(draft);
              setError(null);
            } else {
              setPlaceDetails(null);
              setError(`Place details unavailable: ${status}`);
            }
            setLoading(false);
          }
        );
      } catch {
        setPlaceDetails(null);
        setError('Places API unavailable');
        setLoading(false);
      }
    }, 0);

    return () => clearTimeout(tid);
  }, [placeId]);

  // Derive null state when placeId is absent — avoids synchronous setState in effect body
  if (!placeId) {
    return { placeDetails: null, loading: false, error: null };
  }
  return { placeDetails, loading, error };
}
