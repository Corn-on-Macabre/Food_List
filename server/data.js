import fs from 'node:fs';

// --- Store selection ---
// With SUPABASE_URL + SUPABASE_SERVICE_KEY set, the Supabase `restaurants`
// table is the single store (same one the frontend reads/writes). Without
// them (local dev, tests), falls back to a JSON file at DATA_FILE.
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
export const SUPABASE_MODE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

export const DATA_FILE = process.env.DATA_FILE || '/var/www/food-list/restaurants.json';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

// --- Supabase (PostgREST) helpers ---
const REST = `${SUPABASE_URL}/rest/v1/restaurants`;

async function rest(method, query, body, prefer) {
  const headers = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  if (method === 'GET') headers.Range = '0-9999';
  const resp = await fetch(`${REST}${query}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`Supabase ${method} ${resp.status}: ${detail.slice(0, 200)}`);
  }
  if (resp.status === 204) return null;
  return resp.json();
}

// URL-encode filter values — PostgREST eq. treats quotes as literal chars
const q = (id) => encodeURIComponent(String(id));

// --- File-mode helpers ---
let writing = false;

function fileRead() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function fileWrite(data) {
  if (writing) throw new Error('Concurrent write in progress');
  writing = true;
  try {
    const tmp = DATA_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, DATA_FILE);
  } finally {
    writing = false;
  }
}

// --- Row-level store API (async in both modes) ---

export async function getAll() {
  if (SUPABASE_MODE) return rest('GET', '?select=*&order=id');
  return fileRead();
}

export async function insertRow(row) {
  if (SUPABASE_MODE) {
    const rows = await rest('POST', '', [row], 'return=representation');
    return rows[0];
  }
  const data = fileRead();
  data.push(row);
  fileWrite(data);
  return row;
}

/** Merge fields into the row; returns the updated row or null if not found. */
export async function updateRow(id, fields) {
  if (SUPABASE_MODE) {
    const rows = await rest('PATCH', `?id=eq.${q(id)}`, fields, 'return=representation');
    return rows.length ? rows[0] : null;
  }
  const data = fileRead();
  const row = data.find((r) => r.id === id);
  if (!row) return null;
  Object.assign(row, fields);
  fileWrite(data);
  return row;
}

/** Returns true if a row was deleted. */
export async function deleteRow(id) {
  if (SUPABASE_MODE) {
    const rows = await rest('DELETE', `?id=eq.${q(id)}`, undefined, 'return=representation');
    return rows.length > 0;
  }
  const data = fileRead();
  const idx = data.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  data.splice(idx, 1);
  fileWrite(data);
  return true;
}

// --- Validation ---
export const VALID_TIERS = ['loved', 'recommended', 'on_my_radar'];

// Metro centers — keep in sync with src/constants/metros.ts. The map only
// shows records whose city matches a metro, so every record MUST have one.
export const METRO_CENTERS = {
  phoenix: { lat: 33.4484, lng: -112.0740 },
  dallas: { lat: 32.7767, lng: -96.7970 },
  chicago: { lat: 41.8781, lng: -87.6298 },
  'se-connecticut': { lat: 41.3556, lng: -72.0995 },
  wichita: { lat: 37.6872, lng: -97.3301 },
  hartford: { lat: 41.7658, lng: -72.6734 },
  nyc: { lat: 40.7128, lng: -74.0060 },
  paris: { lat: 48.8566, lng: 2.3522 },
};

export function nearestCity(lat, lng) {
  let best = 'phoenix';
  let bestDist = Infinity;
  for (const [id, c] of Object.entries(METRO_CENTERS)) {
    const d = haversineDistance(lat, lng, c.lat, c.lng);
    if (d < bestDist) { best = id; bestDist = d; }
  }
  return best;
}

// Opening hours are stored in each place's local time. Keep in sync with
// src/constants/metros.ts.
export const CITY_TIMEZONES = {
  phoenix: 'America/Phoenix',
  dallas: 'America/Chicago',
  chicago: 'America/Chicago',
  'se-connecticut': 'America/New_York',
  wichita: 'America/Chicago',
  hartford: 'America/New_York',
  nyc: 'America/New_York',
  paris: 'Europe/Paris',
};

// Keep in sync with src/constants/tags.ts
export const TAG_VOCABULARY = [
  'must-try',
  'date night',
  'team dinner',
  'quick lunch',
  'breakfast',
  'brunch',
  'coffee',
  'dessert',
  'late night',
  'drinks',
  'patio',
  'kid friendly',
  'casual',
  'special occasion',
  'takeout',
];

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
 * Enrich a restaurant in the background and merge the fields into the store
 * when done. Shared by the admin POST route and the MCP add_restaurant
 * tool — never blocks the caller.
 */
export function enrichInBackground(restaurant) {
  enrichRestaurant(restaurant.name, restaurant.lat, restaurant.lng).then(async (result) => {
    if (result) {
      await updateRow(restaurant.id, result.fields);
      console.log(`Enriched "${restaurant.name}": ${Object.keys(result.fields).join(', ')}`);
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
