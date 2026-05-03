export interface ParsedMapsUrl {
  name?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  originalUrl: string;
}

const GOOGLE_MAPS_HOSTS = [
  'google.com',
  'www.google.com',
  'maps.google.com',
];

const SHORT_URL_HOSTS = [
  'goo.gl',
  'maps.app.goo.gl',
];

/**
 * Parses a Google Maps URL and extracts place name, coordinates, and/or place ID.
 * Returns null for non-Google-Maps URLs.
 * Short URLs (goo.gl) return only the originalUrl since they can't be resolved client-side.
 */
export function parseGoogleMapsUrl(url: string): ParsedMapsUrl | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();

  // Handle short URLs — return originalUrl only (can't resolve client-side)
  if (SHORT_URL_HOSTS.some((h) => hostname === h || hostname.endsWith('.' + h))) {
    return { originalUrl: trimmed };
  }

  // Must be a Google Maps URL
  if (!GOOGLE_MAPS_HOSTS.some((h) => hostname === h || hostname.endsWith('.' + h))) {
    return null;
  }

  // Must be a maps path
  if (!parsed.pathname.startsWith('/maps')) {
    return null;
  }

  const result: ParsedMapsUrl = { originalUrl: trimmed };

  // Extract place_id from query params
  const placeIdParam = parsed.searchParams.get('place_id');
  if (placeIdParam) {
    result.placeId = placeIdParam;
  }

  // Extract place_id from the data parameter (format: ...!1sChIJ...)
  // The place ID in the data param follows the pattern !1s<PLACE_ID>
  if (!result.placeId) {
    const dataParam = parsed.searchParams.get('data');
    if (dataParam) {
      const placeIdMatch = dataParam.match(/!1s(ChIJ[A-Za-z0-9_-]+)/);
      if (placeIdMatch) {
        result.placeId = placeIdMatch[1];
      }
    }
  }

  // Extract name and coordinates from /maps/place/PLACE+NAME/@LAT,LNG,...
  const placeMatch = parsed.pathname.match(/\/maps\/place\/([^/@]+)/);
  if (placeMatch) {
    const rawName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    result.name = rawName;
  }

  // Extract coordinates from /@LAT,LNG pattern
  const coordsMatch = parsed.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (coordsMatch) {
    const lat = parseFloat(coordsMatch[1]);
    const lng = parseFloat(coordsMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      result.lat = lat;
      result.lng = lng;
    }
  }

  // Also check query params for coordinates (some formats use ?q=LAT,LNG)
  const qParam = parsed.searchParams.get('q');
  if (qParam && result.lat === undefined) {
    const qCoordsMatch = qParam.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
    if (qCoordsMatch) {
      const lat = parseFloat(qCoordsMatch[1]);
      const lng = parseFloat(qCoordsMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        result.lat = lat;
        result.lng = lng;
      }
    }
  }

  // If we extracted nothing useful beyond the URL, still return the result
  // so the caller knows it's a Google Maps URL
  return result;
}
