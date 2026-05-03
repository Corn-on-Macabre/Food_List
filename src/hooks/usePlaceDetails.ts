import { useState, useEffect } from 'react';
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
          fields: ['displayName', 'formattedAddress', 'location', 'priceLevel', 'types', 'googleMapsURI'],
        });

        if (cancelled) return;

        const lat = place.location?.lat();
        const lng = place.location?.lng();

        if (lat === undefined || lng === undefined) {
          setError('Place location data unavailable');
          setPlaceDetails(null);
          setLoading(false);
          return;
        }

        // Map priceLevel enum to numeric value
        let priceLevelNum: number | null = null;
        if (place.priceLevel !== undefined && place.priceLevel !== null) {
          const priceLevelStr = String(place.priceLevel);
          if (priceLevelStr.includes('INEXPENSIVE')) priceLevelNum = 1;
          else if (priceLevelStr.includes('MODERATE')) priceLevelNum = 2;
          else if (priceLevelStr.includes('EXPENSIVE') && !priceLevelStr.includes('VERY')) priceLevelNum = 3;
          else if (priceLevelStr.includes('VERY_EXPENSIVE')) priceLevelNum = 4;
        }

        const draft: PlaceDraft = {
          name: place.displayName ?? '',
          address: place.formattedAddress ?? '',
          lat,
          lng,
          priceLevel: priceLevelNum,
          cuisine: mapPlaceTypeToCuisine(place.types ?? []),
          googleMapsUrl: place.googleMapsURI ?? '',
          placeId,
        };

        setPlaceDetails(draft);
        setError(null);
      } catch {
        if (!cancelled) {
          setPlaceDetails(null);
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

  // Derive null state when placeId is absent
  if (!placeId) {
    return { placeDetails: null, loading: false, error: null };
  }
  // Derive loading=true when placeId is set but no result yet (avoids race with setTimeout)
  const isLoading = loading || (!placeDetails && !error);
  return { placeDetails, loading: isLoading, error };
}
