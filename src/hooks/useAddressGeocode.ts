import { usePlaceFields } from './usePlaceFields';

export interface AddressGeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

const GEOCODE_FIELDS = ['location', 'formattedAddress'] as const;

function mapPlaceToGeocode(place: google.maps.places.Place): AddressGeocodeResult | null {
  const lat = place.location?.lat();
  const lng = place.location?.lng();
  if (lat === undefined || lng === undefined) return null;
  return {
    lat,
    lng,
    formattedAddress: place.formattedAddress ?? '',
  };
}

export function useAddressGeocode(placeId: string | null) {
  const { data, loading, error } = usePlaceFields(placeId, GEOCODE_FIELDS, mapPlaceToGeocode);
  return { result: data, loading, error };
}
