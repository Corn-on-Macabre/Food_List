import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { createMcpHandler, methodNotAllowed } from './mcp.js';
import { FoodListOAuthProvider, safeEqual } from './auth.js';
import { DATA_FILE, SUPABASE_MODE, getAll } from './data.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://bobby.menu';
const MCP_AUTH_FILE = process.env.MCP_AUTH_FILE || './mcp-auth.json';

if (!ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD environment variable is required');
  process.exit(1);
}

// One reverse-proxy hop (Traefik) — needed so rate limiting keys on the real
// client IP from X-Forwarded-For instead of the proxy's address.
app.set('trust proxy', 1);

app.use(cors({ origin: PUBLIC_URL, exposedHeaders: ['Mcp-Session-Id'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Rate limits ---
// The consent form is a password prompt — throttle hard to block brute force.
const consentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
// MCP clients batch many calls per conversation; generous but bounded.
const mcpLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

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
app.post('/mcp-auth/consent', consentLimiter, oauthProvider.consentHandler(ADMIN_PASSWORD));

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

// NOTE: the /api/restaurants REST CRUD routes were removed — the admin
// dashboard writes through Supabase (RLS-enforced) and no client used them.
// All curation writes now go through the MCP tools below.

// --- MCP ---
// Auth: the static admin bearer (Cursor/Claude Code headers) or an OAuth
// access token (Claude app connectors) both unlock the write tools.
async function isAuthed(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return false;
  const token = header.slice(7);
  if (safeEqual(token, ADMIN_PASSWORD)) return true;
  return oauthProvider.isValidToken(token);
}

// /mcp — public: read tools for everyone, write tools if credentials happen
// to be attached. /mcp/admin — 401-challenges anonymous requests, which is
// what triggers the OAuth flow in the Claude app.
app.post('/mcp', mcpLimiter, createMcpHandler({ isAuthed }));
app.get('/mcp', methodNotAllowed);
app.delete('/mcp', methodNotAllowed);
app.post('/mcp/admin', mcpLimiter, createMcpHandler({
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
