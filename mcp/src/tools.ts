import fs from 'node:fs';

interface Restaurant {
  id: string;
  name: string;
  tier: string;
  cuisine: string;
  lat: number;
  lng: number;
  googleMapsUrl: string;
  dateAdded: string;
  notes?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  tags?: string[];
  featured?: boolean;
}

// --- Data loading ---

let restaurants: Restaurant[] = [];

const DATA_URL = 'https://bobby.menu/restaurants.json';

export async function loadData(): Promise<void> {
  // Local file override for dev, otherwise fetch from live site
  const localPath = process.env.FOOD_LIST_DATA;
  if (localPath) {
    const raw = fs.readFileSync(localPath, 'utf-8');
    restaurants = JSON.parse(raw) as Restaurant[];
    return;
  }

  const resp = await fetch(DATA_URL);
  if (!resp.ok) throw new Error(`Failed to fetch restaurant data: ${resp.status}`);
  restaurants = (await resp.json()) as Restaurant[];
}

// --- Haversine distance (miles) ---

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- Formatting ---

function formatTier(tier: string): string {
  switch (tier) {
    case 'loved': return 'Loved';
    case 'recommended': return 'Recommended';
    case 'on_my_radar': return 'On My Radar';
    default: return tier;
  }
}

function formatRestaurant(r: Restaurant, distanceMi?: number): string {
  const parts: string[] = [];

  let header = `${r.name}`;
  if (distanceMi !== undefined) {
    header += ` (${distanceMi.toFixed(1)} mi)`;
  }
  header += ` — ${r.cuisine} · ${formatTier(r.tier)}`;
  if (r.featured) header += ' ⭐';
  parts.push(header);

  if (r.notes) parts.push(`  "${r.notes}"`);
  if (r.rating !== undefined) {
    let ratingLine = `  Rating: ${r.rating}`;
    if (r.userRatingCount !== undefined) {
      ratingLine += ` (${r.userRatingCount.toLocaleString()} reviews)`;
    }
    parts.push(ratingLine);
  }
  if (r.tags && r.tags.length > 0) {
    parts.push(`  Tags: ${r.tags.join(', ')}`);
  }
  parts.push(`  → maps: ${r.googleMapsUrl}`);

  return parts.join('\n');
}

function formatResults(results: Restaurant[], distanceMap?: Map<string, number>): string {
  if (results.length === 0) return 'No restaurants found matching your criteria.';

  return results
    .map((r, i) => `${i + 1}. ${formatRestaurant(r, distanceMap?.get(r.id))}`)
    .join('\n\n');
}

// --- Tool handlers ---

export function searchRestaurants(args: { query: string; limit?: number }): string {
  const { query, limit = 10 } = args;
  const lower = query.toLowerCase();
  const matches = restaurants
    .filter(r => r.name.toLowerCase().includes(lower))
    .slice(0, limit);

  return `Found ${matches.length} restaurant${matches.length === 1 ? '' : 's'} matching "${query}":\n\n${formatResults(matches)}`;
}

export function filterRestaurants(args: { cuisine?: string; tier?: string; limit?: number }): string {
  const { cuisine, tier, limit = 20 } = args;
  let results = restaurants;

  if (cuisine) {
    const lower = cuisine.toLowerCase();
    results = results.filter(r => r.cuisine.toLowerCase() === lower);
  }
  if (tier) {
    results = results.filter(r => r.tier === tier);
  }

  const total = results.length;
  results = results.slice(0, limit);

  let header = `Found ${total} restaurant${total === 1 ? '' : 's'}`;
  const filters: string[] = [];
  if (cuisine) filters.push(`cuisine: ${cuisine}`);
  if (tier) filters.push(`tier: ${formatTier(tier)}`);
  if (filters.length > 0) header += ` (${filters.join(', ')})`;
  if (total > limit) header += ` — showing first ${limit}`;
  header += ':\n\n';

  return header + formatResults(results);
}

export function nearbyRestaurants(args: {
  lat: number;
  lng: number;
  radius_miles?: number;
  cuisine?: string;
  limit?: number;
}): string {
  const { lat, lng, radius_miles = 10, cuisine, limit = 15 } = args;

  let candidates = restaurants;
  if (cuisine) {
    const lower = cuisine.toLowerCase();
    candidates = candidates.filter(r => r.cuisine.toLowerCase() === lower);
  }

  const withDistance = candidates
    .map(r => ({ restaurant: r, distance: haversineDistance(lat, lng, r.lat, r.lng) }))
    .filter(({ distance }) => distance <= radius_miles)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  const distanceMap = new Map(withDistance.map(({ restaurant, distance }) => [restaurant.id, distance]));
  const results = withDistance.map(({ restaurant }) => restaurant);

  let header = `Found ${withDistance.length} restaurant${withDistance.length === 1 ? '' : 's'} within ${radius_miles} miles`;
  if (cuisine) header += ` (${cuisine})`;
  header += ':\n\n';

  return header + formatResults(results, distanceMap);
}

export function getStats(): string {
  const tierCounts: Record<string, number> = {};
  const cuisineCounts: Record<string, number> = {};

  for (const r of restaurants) {
    tierCounts[r.tier] = (tierCounts[r.tier] || 0) + 1;
    cuisineCounts[r.cuisine] = (cuisineCounts[r.cuisine] || 0) + 1;
  }

  const cuisinesSorted = Object.entries(cuisineCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `  ${name}: ${count}`)
    .join('\n');

  return [
    `bobby.menu — ${restaurants.length} restaurants`,
    '',
    'By tier:',
    `  Loved: ${tierCounts['loved'] || 0}`,
    `  Recommended: ${tierCounts['recommended'] || 0}`,
    `  On My Radar: ${tierCounts['on_my_radar'] || 0}`,
    '',
    'By cuisine:',
    cuisinesSorted,
  ].join('\n');
}
