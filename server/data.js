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
const ENRICH_FIELD_MASK = [
  'places.id',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.photos',
  'places.formattedAddress',
  'places.regularOpeningHours',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.businessStatus',
].join(',');

/**
 * Look up a restaurant on Google Places (Text Search, biased to its coords).
 * Returns { fields, matchLocation } — `fields` is what gets merged into the
 * record; `matchLocation` is the matched place's lat/lng so callers can
 * sanity-check the match distance before applying. Null on miss/error.
 */
export async function enrichRestaurant(name, lat, lng, radiusM = ENRICH_RADIUS_M) {
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
          circle: { center, radius: radiusM },
        },
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const place = data.places?.[0];
    if (!place) return null;

    const fields = {};
    if (typeof place.rating === 'number') fields.rating = place.rating;
    if (typeof place.userRatingCount === 'number') fields.userRatingCount = place.userRatingCount;
    if (place.priceLevel && place.priceLevel !== 'PRICE_LEVEL_UNSPECIFIED') fields.priceLevel = place.priceLevel;
    if (place.photos?.[0]?.name) fields.photoRef = place.photos[0].name;
    if (place.id) fields.googlePlaceId = place.id;
    if (place.formattedAddress) fields.address = place.formattedAddress;
    if (place.websiteUri) fields.website = place.websiteUri;
    if (place.nationalPhoneNumber) fields.phone = place.nationalPhoneNumber;
    if (place.businessStatus) fields.businessStatus = place.businessStatus;
    if (place.regularOpeningHours?.periods) {
      fields.openingHours = {
        periods: place.regularOpeningHours.periods,
        weekdayDescriptions: place.regularOpeningHours.weekdayDescriptions ?? [],
      };
    }
    if (Object.keys(fields).length === 0) return null;
    fields.enrichedAt = new Date().toISOString().slice(0, 10);
    return { fields, matchLocation: place.location ?? null };
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
  enrichRestaurant(restaurant.name, restaurant.lat, restaurant.lng).then((result) => {
    if (result) {
      const fresh = readData();
      const idx = fresh.findIndex((r) => r.id === restaurant.id);
      if (idx !== -1) {
        Object.assign(fresh[idx], result.fields);
        writeData(fresh);
        console.log(`Enriched "${restaurant.name}": ${Object.keys(result.fields).join(', ')}`);
      }
    }
  }).catch(() => {});
}

// --- Geometry (ported from src/utils/distance.ts) ---
const toRad = (deg) => (deg * Math.PI) / 180;

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth mean radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
