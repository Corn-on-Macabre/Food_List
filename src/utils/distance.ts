const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Calculate the great-circle distance between two lat/lng coordinates
 * using the Haversine formula. Returns distance in miles.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth mean radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const DISTANCE_OPTIONS: ReadonlyArray<{ label: string; miles: number }> = [
  { label: '5 mi',  miles: 5  },
  { label: '10 mi', miles: 10 },
  { label: '20 mi', miles: 20 },
  { label: '30 mi', miles: 30 },
] as const;
