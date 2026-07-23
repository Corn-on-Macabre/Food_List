import type { ParsedMapsUrl } from '../utils/parseGoogleMapsUrl';
import { mapPlaceTypeToCuisine } from '../utils/mapPlaceType';

export interface PlaceLookupResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  cuisine?: string;
  rating?: number;
  priceLevel?: string;
}

/**
 * Looks up place details from a parsed Google Maps URL using the Places API.
 * Must be called from a component rendered inside <APIProvider>.
 * Returns null on any failure (graceful degradation).
 */
export async function lookupPlaceFromUrl(
  parsed: ParsedMapsUrl
): Promise<PlaceLookupResult | null> {
  if (typeof google === 'undefined' || !google?.maps?.places?.Place) {
    return null;
  }

  try {
    // Strategy 1: Use place ID if available
    if (parsed.placeId) {
      return await fetchByPlaceId(parsed.placeId);
    }

    // Strategy 2: Use name + coordinates for a text search
    if (parsed.name) {
      return await fetchByTextSearch(parsed.name, parsed.lat, parsed.lng);
    }

    // No useful data to look up
    return null;
  } catch {
    return null;
  }
}

const PLACE_FIELDS = [
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'priceLevel',
  'types',
] as const;

async function fetchByPlaceId(placeId: string): Promise<PlaceLookupResult | null> {
  const place = new google.maps.places.Place({ id: placeId });
  await place.fetchFields({ fields: [...PLACE_FIELDS] });
  return extractResult(place);
}

async function fetchByTextSearch(
  name: string,
  lat?: number,
  lng?: number
): Promise<PlaceLookupResult | null> {
  const request: google.maps.places.SearchByTextRequest = {
    textQuery: name,
    fields: [...PLACE_FIELDS],
    maxResultCount: 1,
  };

  // Bias search toward coordinates if available
  if (lat !== undefined && lng !== undefined) {
    request.locationBias = new google.maps.Circle({
      center: { lat, lng },
      radius: 500,
    });
  }

  const { places } = await google.maps.places.Place.searchByText(request);

  if (!places || places.length === 0) {
    return null;
  }

  return extractResult(places[0]);
}

function extractResult(place: google.maps.places.Place): PlaceLookupResult | null {
  const lat = place.location?.lat();
  const lng = place.location?.lng();

  if (lat === undefined || lng === undefined) {
    return null;
  }

  let priceLevel: string | undefined;
  if (place.priceLevel !== undefined && place.priceLevel !== null) {
    priceLevel = String(place.priceLevel);
  }

  // Map place types to a cuisine string — same mapping usePlaceDetails uses
  const cuisine: string | undefined =
    place.types && place.types.length > 0
      ? mapPlaceTypeToCuisine(place.types)
      : undefined;

  return {
    name: place.displayName ?? '',
    address: place.formattedAddress ?? '',
    lat,
    lng,
    cuisine,
    rating: place.rating ?? undefined,
    priceLevel,
  };
}
