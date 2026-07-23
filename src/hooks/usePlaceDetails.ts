import { mapPlaceTypeToCuisine } from '../utils/mapPlaceType';
import { usePlaceFields } from './usePlaceFields';

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

const PLACE_FIELDS = ['displayName', 'formattedAddress', 'location', 'priceLevel', 'types', 'googleMapsURI'] as const;

function mapPlaceToDraft(place: google.maps.places.Place, placeId: string): PlaceDraft | null {
  const lat = place.location?.lat();
  const lng = place.location?.lng();
  if (lat === undefined || lng === undefined) return null;

  // Map priceLevel enum to numeric value
  let priceLevelNum: number | null = null;
  if (place.priceLevel !== undefined && place.priceLevel !== null) {
    const priceLevelStr = String(place.priceLevel);
    if (priceLevelStr.includes('INEXPENSIVE')) priceLevelNum = 1;
    else if (priceLevelStr.includes('MODERATE')) priceLevelNum = 2;
    else if (priceLevelStr.includes('EXPENSIVE') && !priceLevelStr.includes('VERY')) priceLevelNum = 3;
    else if (priceLevelStr.includes('VERY_EXPENSIVE')) priceLevelNum = 4;
  }

  return {
    name: place.displayName ?? '',
    address: place.formattedAddress ?? '',
    lat,
    lng,
    priceLevel: priceLevelNum,
    cuisine: mapPlaceTypeToCuisine(place.types ?? []),
    googleMapsUrl: place.googleMapsURI ?? '',
    placeId,
  };
}

export function usePlaceDetails(placeId: string | null): UsePlaceDetailsResult {
  const { data, loading, error } = usePlaceFields(placeId, PLACE_FIELDS, mapPlaceToDraft);
  return { placeDetails: data, loading, error };
}
