import fs from 'node:fs';

export const DATA_FILE = process.env.DATA_FILE || '/var/www/food-list/restaurants.json';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

// --- File I/O ---
let writing = false;

export function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

export function writeData(data) {
  if (writing) {
    throw new Error('Concurrent write in progress');
  }
  writing = true;
  try {
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, DATA_FILE);
  } finally {
    writing = false;
  }
}

// --- Validation ---
export const VALID_TIERS = ['loved', 'recommended', 'on_my_radar'];

export const REQUIRED_FIELDS = {
  id: 'string',
  name: 'string',
  tier: 'string',
  cuisine: 'string',
  lat: 'number',
  lng: 'number',
  googleMapsUrl: 'string',
  dateAdded: 'string',
};

export function validateRestaurant(body) {
  const errors = [];
  for (const [field, type] of Object.entries(REQUIRED_FIELDS)) {
    if (body[field] === undefined || body[field] === null) {
      errors.push(`Missing required field: ${field}`);
    } else if (typeof body[field] !== type) {
      errors.push(`Field "${field}" must be a ${type}, got ${typeof body[field]}`);
    }
  }
  if (body.tier !== undefined && !VALID_TIERS.includes(body.tier)) {
    errors.push(`Field "tier" must be one of: ${VALID_TIERS.join(', ')}`);
  }
  return errors;
}

// --- Slug IDs (ported from src/utils/generateSlugId.ts) ---
export function generateSlugId(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

export function generateUniqueSlugId(name, existingIds) {
  const base = generateSlugId(name);
  if (!existingIds.includes(base)) return base;
  let counter = 2;
  while (existingIds.includes(`${base}-${counter}`)) {
    counter++;
  }
  return `${base}-${counter}`;
}

// --- Enrichment (Google Places) ---
const DEFAULT_CENTER = { latitude: 33.4484, longitude: -112.0740 };
const ENRICH_RADIUS_M = 50000;
const ENRICH_FIELD_MASK = 'places.rating,places.userRatingCount,places.priceLevel,places.photos';

export async function enrichRestaurant(name, lat, lng) {
  if (!GOOGLE_API_KEY) return null;
  const center = (typeof lat === 'number' && typeof lng === 'number')
    ? { latitude: lat, longitude: lng }
    : DEFAULT_CENTER;
  try {
    const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': ENRICH_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: name,
        maxResultCount: 1,
        locationBias: {
          circle: { center, radius: ENRICH_RADIUS_M },
        },
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const place = data.places?.[0];
    if (!place) return null;

    const result = {};
    if (typeof place.rating === 'number') result.rating = place.rating;
    if (typeof place.userRatingCount === 'number') result.userRatingCount = place.userRatingCount;
    if (place.priceLevel && place.priceLevel !== 'PRICE_LEVEL_UNSPECIFIED') result.priceLevel = place.priceLevel;
    if (place.photos?.[0]?.name) result.photoRef = place.photos[0].name;
    if (Object.keys(result).length > 0) {
      result.enrichedAt = new Date().toISOString().slice(0, 10);
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

/**
 * Enrich a restaurant in the background and merge the fields into the data
 * file when done. Shared by the admin POST route and the MCP add_restaurant
 * tool — never blocks the caller.
 */
export function enrichInBackground(restaurant) {
  enrichRestaurant(restaurant.name, restaurant.lat, restaurant.lng).then((fields) => {
    if (fields) {
      const fresh = readData();
      const idx = fresh.findIndex((r) => r.id === restaurant.id);
      if (idx !== -1) {
        Object.assign(fresh[idx], fields);
        writeData(fresh);
        console.log(`Enriched "${restaurant.name}": ${Object.keys(fields).join(', ')}`);
      }
    }
  }).catch(() => {});
}
