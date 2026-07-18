import express from 'express';
import cors from 'cors';
import { createMcpHandler, methodNotAllowed } from './mcp.js';
import {
  DATA_FILE,
  readData,
  writeData,
  VALID_TIERS,
  validateRestaurant,
  enrichInBackground,
} from './data.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD environment variable is required');
  process.exit(1);
}

app.use(cors({ exposedHeaders: ['Mcp-Session-Id'] }));
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
    enrichInBackground(restaurant);

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

    // Validate cuisine if provided
    if (updates.cuisine !== undefined) {
      if (typeof updates.cuisine !== 'string' || updates.cuisine.trim() === '') {
        return res.status(400).json({
          error: 'Validation failed',
          details: ['Field "cuisine" must be a non-empty string'],
        });
      }
      updates.cuisine = updates.cuisine.trim();
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

// --- MCP — read tools are public (same data as /restaurants.json);
// write tools appear only with a valid Bearer ADMIN_PASSWORD ---
app.post('/mcp', createMcpHandler(ADMIN_PASSWORD));
app.get('/mcp', methodNotAllowed);
app.delete('/mcp', methodNotAllowed);

// --- Start ---
app.listen(PORT, () => {
  console.log(`Food List API listening on port ${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
});
