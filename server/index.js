import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const DATA_FILE = process.env.DATA_FILE || '/var/www/food-list/restaurants.json';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

if (!ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD environment variable is required');
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// --- Auth middleware ---
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = header.slice(7);
  if (token !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  next();
}

// --- File I/O helpers ---
let writing = false;

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

function writeData(data) {
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
const VALID_TIERS = ['loved', 'recommended', 'on_my_radar'];

const REQUIRED_FIELDS = {
  id: 'string',
  name: 'string',
  tier: 'string',
  cuisine: 'string',
  lat: 'number',
  lng: 'number',
  googleMapsUrl: 'string',
  dateAdded: 'string',
};

function validateRestaurant(body) {
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

// --- Enrichment (Google Places) ---
const PHX_CENTER = { latitude: 33.4484, longitude: -112.0740 };
const PHX_RADIUS_M = 50000;
const ENRICH_FIELD_MASK = 'places.rating,places.userRatingCount,places.priceLevel,places.photos';

async function enrichRestaurant(name) {
  if (!GOOGLE_API_KEY) return null;
  try {
    const resp = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': ENRICH_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: `${name} Phoenix AZ`,
        maxResultCount: 1,
        locationBias: {
          circle: { center: PHX_CENTER, radius: PHX_RADIUS_M },
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

// --- Routes ---

// Health check (no auth)
app.get('/api/health', (_req, res) => {
  try {
    const data = readData();
    res.json({ status: 'ok', count: data.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read data file', detail: err.message });
  }
});

// GET all restaurants
app.get('/api/restaurants', requireAuth, (_req, res) => {
  try {
    const data = readData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read data file', detail: err.message });
  }
});

// POST new restaurant
app.post('/api/restaurants', requireAuth, async (req, res) => {
  const errors = validateRestaurant(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  try {
    const data = readData();
    const restaurant = { ...req.body };
    data.push(restaurant);
    writeData(data);

    // Enrich asynchronously — don't block the response
    enrichRestaurant(restaurant.name).then((fields) => {
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

    res.status(201).json(restaurant);
  } catch (err) {
    res.status(500).json({ error: 'Failed to write data file', detail: err.message });
  }
});

// PUT update restaurant
app.put('/api/restaurants/:id', requireAuth, (req, res) => {
  try {
    const data = readData();
    const index = data.findIndex((r) => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: `Restaurant not found: ${req.params.id}` });
    }
    // Prevent changing the id
    const updates = { ...req.body };
    delete updates.id;

    // Validate tier if provided
    if (updates.tier !== undefined && !VALID_TIERS.includes(updates.tier)) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [`Field "tier" must be one of: ${VALID_TIERS.join(', ')}`],
      });
    }

    data[index] = { ...data[index], ...updates };
    writeData(data);
    res.json(data[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to write data file', detail: err.message });
  }
});

// DELETE restaurant
app.delete('/api/restaurants/:id', requireAuth, (req, res) => {
  try {
    const data = readData();
    const index = data.findIndex((r) => r.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: `Restaurant not found: ${req.params.id}` });
    }
    data.splice(index, 1);
    writeData(data);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to write data file', detail: err.message });
  }
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`Food List API listening on port ${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
});
