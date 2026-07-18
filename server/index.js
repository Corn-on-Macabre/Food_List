import express from 'express';
import cors from 'cors';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { createMcpHandler, methodNotAllowed } from './mcp.js';
import { FoodListOAuthProvider } from './auth.js';
import {
  DATA_FILE,
  SUPABASE_MODE,
  getAll,
  insertRow,
  updateRow,
  deleteRow,
  VALID_TIERS,
  validateRestaurant,
  enrichInBackground,
} from './data.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://bobby.menu';
const MCP_AUTH_FILE = process.env.MCP_AUTH_FILE || './mcp-auth.json';

if (!ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD environment variable is required');
  process.exit(1);
}

app.use(cors({ exposedHeaders: ['Mcp-Session-Id'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- OAuth authorization server for the MCP admin endpoint ---
// Mounts /authorize, /token, /register, and the /.well-known metadata.
const oauthProvider = new FoodListOAuthProvider(MCP_AUTH_FILE);
app.use(mcpAuthRouter({
  provider: oauthProvider,
  issuerUrl: new URL(PUBLIC_URL),
  resourceServerUrl: new URL(`${PUBLIC_URL}/mcp/admin`),
  scopesSupported: ['admin'],
  resourceName: 'Bobby.Menu',
}));
app.post('/mcp-auth/consent', oauthProvider.consentHandler(ADMIN_PASSWORD));

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
app.get('/api/health', async (_req, res) => {
  try {
    const data = await getAll();
    res.json({ status: 'ok', count: data.length, store: SUPABASE_MODE ? 'supabase' : 'file' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read store', detail: err.message });
  }
});

// GET all restaurants
app.get('/api/restaurants', requireAuth, async (_req, res) => {
  try {
    const data = await getAll();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read store', detail: err.message });
  }
});

// POST new restaurant
app.post('/api/restaurants', requireAuth, async (req, res) => {
  const errors = validateRestaurant(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  try {
    const restaurant = await insertRow({ ...req.body });

    // Enrich asynchronously — don't block the response
    enrichInBackground(restaurant);

    res.status(201).json(restaurant);
  } catch (err) {
    res.status(500).json({ error: 'Failed to write store', detail: err.message });
  }
});

// PUT update restaurant
app.put('/api/restaurants/:id', requireAuth, async (req, res) => {
  try {
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

    const updated = await updateRow(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: `Restaurant not found: ${req.params.id}` });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to write store', detail: err.message });
  }
});

// DELETE restaurant
app.delete('/api/restaurants/:id', requireAuth, async (req, res) => {
  try {
    const found = await deleteRow(req.params.id);
    if (!found) {
      return res.status(404).json({ error: `Restaurant not found: ${req.params.id}` });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to write store', detail: err.message });
  }
});

// --- MCP ---
// Auth: the static admin bearer (Cursor/Claude Code headers) or an OAuth
// access token (Claude app connectors) both unlock the write tools.
async function isAuthed(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return false;
  const token = header.slice(7);
  if (token === ADMIN_PASSWORD) return true;
  return oauthProvider.isValidToken(token);
}

// /mcp — public: read tools for everyone, write tools if credentials happen
// to be attached. /mcp/admin — 401-challenges anonymous requests, which is
// what triggers the OAuth flow in the Claude app.
app.post('/mcp', createMcpHandler({ isAuthed }));
app.get('/mcp', methodNotAllowed);
app.delete('/mcp', methodNotAllowed);
app.post('/mcp/admin', createMcpHandler({
  isAuthed,
  requireAuth: true,
  resourceMetadataUrl: `${PUBLIC_URL}/.well-known/oauth-protected-resource/mcp/admin`,
}));
app.get('/mcp/admin', methodNotAllowed);
app.delete('/mcp/admin', methodNotAllowed);

// --- Start ---
app.listen(PORT, () => {
  console.log(`Food List API listening on port ${PORT}`);
  console.log(`Data file: ${DATA_FILE}`);
});
