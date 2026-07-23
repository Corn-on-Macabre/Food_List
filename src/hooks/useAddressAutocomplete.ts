import { usePlacesAutocomplete, type PlacePrediction } from './usePlacesAutocomplete';

const ADDRESS_TYPES = ['street_address', 'subpremise', 'route', 'locality'];

/** Address-restricted variant of usePlacesAutocomplete (min 3 chars). */
export function useAddressAutocomplete(
  query: string,
  debounceMs: number = 300
): { predictions: PlacePrediction[]; loading: boolean; error: string | null } {
  return usePlacesAutocomplete(query, debounceMs, {
    minLength: 3,
    includedPrimaryTypes: ADDRESS_TYPES,
  });
}
