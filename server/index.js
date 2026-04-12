import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const DATA_FILE = process.env.DATA_FILE || '/var/www/food-list/restaurants.json';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

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
app.post('/api/restaurants', requireAuth, (req, res) => {
  const errors = validateRestaurant(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  try {
    const data = readData();
    data.push(req.body);
    writeData(data);
    res.status(201).json(req.body);
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
