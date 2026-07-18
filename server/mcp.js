import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

// Ported from src/utils/distance.ts (server is plain JS; can't import the TS util)
const toRad = (deg) => (deg * Math.PI) / 180;

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth mean radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const TIERS = ['loved', 'recommended', 'on_my_radar'];

const PRICE_LEVELS = {
  inexpensive: 'PRICE_LEVEL_INEXPENSIVE',
  moderate: 'PRICE_LEVEL_MODERATE',
  expensive: 'PRICE_LEVEL_EXPENSIVE',
  very_expensive: 'PRICE_LEVEL_VERY_EXPENSIVE',
};

// photoRef is a ~500-char Google Places photo reference — useless to an LLM
function stripPhotoRef(restaurant) {
  const { photoRef: _photoRef, ...rest } = restaurant;
  return rest;
}

function json(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function applyFilters(data, { query, cuisine, tier, near_lat, near_lng, max_distance_miles, min_rating, price_level }) {
  let results = data;

  if (query) {
    const q = query.toLowerCase();
    results = results.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.cuisine.toLowerCase().includes(q) ||
      (r.notes && r.notes.toLowerCase().includes(q))
    );
  }
  if (cuisine) {
    const c = cuisine.toLowerCase();
    results = results.filter((r) => r.cuisine.toLowerCase() === c);
  }
  if (tier) {
    results = results.filter((r) => r.tier === tier);
  }
  if (min_rating !== undefined) {
    results = results.filter((r) => typeof r.rating === 'number' && r.rating >= min_rating);
  }
  if (price_level) {
    results = results.filter((r) => r.priceLevel === PRICE_LEVELS[price_level]);
  }

  const hasLocation = typeof near_lat === 'number' && typeof near_lng === 'number';
  if (hasLocation) {
    results = results.map((r) => ({
      ...r,
      distance_miles: Math.round(haversineDistance(near_lat, near_lng, r.lat, r.lng) * 10) / 10,
    }));
    if (max_distance_miles !== undefined) {
      results = results.filter((r) => r.distance_miles <= max_distance_miles);
    }
    results = [...results].sort((a, b) => a.distance_miles - b.distance_miles);
  } else {
    results = [...results].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }

  return results;
}

const locationInputs = {
  near_lat: z.number().optional().describe('Latitude to measure distance from (e.g. your current location)'),
  near_lng: z.number().optional().describe('Longitude to measure distance from'),
  max_distance_miles: z.number().positive().optional().describe('Only include restaurants within this many miles of near_lat/near_lng'),
};

function buildServer(readData) {
  const server = new McpServer(
    { name: 'Bobby.Menu', version: '1.0.0' },
    {
      instructions:
        "Bobby's personal curated list of Phoenix-metro restaurants. Every restaurant has a tier: " +
        "'loved' (personal favorites), 'recommended' (solid picks), or 'on_my_radar' (want to try, not yet vetted). " +
        'Ratings and price levels come from Google Places. Use search_restaurants for filtered lookups, ' +
        'pick_random for "what should I eat tonight", and list_cuisines to see what cuisines exist before filtering.',
    }
  );

  server.registerTool(
    'search_restaurants',
    {
      title: 'Search restaurants',
      description:
        'Search and filter the curated restaurant list. All filters are optional and combine (AND). ' +
        'If near_lat/near_lng are given, results are sorted nearest-first and include distance_miles; ' +
        'otherwise they are sorted by Google rating.',
      inputSchema: {
        query: z.string().optional().describe('Free-text match against name, cuisine, and notes'),
        cuisine: z.string().optional().describe("Exact cuisine, e.g. 'Korean' (see list_cuisines)"),
        tier: z.enum(TIERS).optional(),
        min_rating: z.number().min(0).max(5).optional().describe('Minimum Google rating'),
        price_level: z.enum(Object.keys(PRICE_LEVELS)).optional(),
        limit: z.number().int().positive().max(100).optional().describe('Max results to return (default 20)'),
        ...locationInputs,
      },
    },
    async (args) => {
      const results = applyFilters(readData(), args);
      const limit = args.limit ?? 20;
      return json({
        total_matches: results.length,
        returned: Math.min(limit, results.length),
        restaurants: results.slice(0, limit).map(stripPhotoRef),
      });
    }
  );

  server.registerTool(
    'get_restaurant',
    {
      title: 'Get a restaurant',
      description: 'Fetch one restaurant by id (slug) or by name (case-insensitive substring match).',
      inputSchema: {
        id: z.string().optional().describe("Slug id, e.g. 'manna-bbq'"),
        name: z.string().optional().describe('Restaurant name to match if id is unknown'),
      },
    },
    async ({ id, name }) => {
      const data = readData();
      if (id) {
        const match = data.find((r) => r.id === id);
        return match ? json(stripPhotoRef(match)) : json({ error: `No restaurant with id '${id}'` });
      }
      if (name) {
        const n = name.toLowerCase();
        const matches = data.filter((r) => r.name.toLowerCase().includes(n));
        if (matches.length === 0) return json({ error: `No restaurant matching '${name}'` });
        return json({
          match: stripPhotoRef(matches[0]),
          other_matches: matches.slice(1, 6).map((r) => ({ id: r.id, name: r.name })),
        });
      }
      return json({ error: 'Provide id or name' });
    }
  );

  server.registerTool(
    'list_cuisines',
    {
      title: 'List cuisines',
      description: 'All cuisines in the collection with restaurant counts. Use these values for the cuisine filter.',
      inputSchema: {},
    },
    async () => {
      const counts = {};
      for (const r of readData()) {
        counts[r.cuisine] = (counts[r.cuisine] ?? 0) + 1;
      }
      const cuisines = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([cuisine, count]) => ({ cuisine, count }));
      return json({ total_cuisines: cuisines.length, cuisines });
    }
  );

  server.registerTool(
    'get_stats',
    {
      title: 'Collection stats',
      description: 'Overview of the collection: totals by tier, top cuisines, and the newest additions.',
      inputSchema: {},
    },
    async () => {
      const data = readData();
      const byTier = Object.fromEntries(TIERS.map((t) => [t, 0]));
      const cuisineCounts = {};
      for (const r of data) {
        if (byTier[r.tier] !== undefined) byTier[r.tier] += 1;
        cuisineCounts[r.cuisine] = (cuisineCounts[r.cuisine] ?? 0) + 1;
      }
      const topCuisines = Object.entries(cuisineCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([cuisine, count]) => ({ cuisine, count }));
      const newest = [...data]
        .sort((a, b) => (b.dateAdded ?? '').localeCompare(a.dateAdded ?? ''))
        .slice(0, 5)
        .map((r) => ({ id: r.id, name: r.name, tier: r.tier, cuisine: r.cuisine, dateAdded: r.dateAdded }));
      return json({ total: data.length, by_tier: byTier, top_cuisines: topCuisines, newest_additions: newest });
    }
  );

  server.registerTool(
    'pick_random',
    {
      title: 'Pick a random restaurant',
      description:
        "Answer \"what should I eat tonight?\" — a random restaurant from the list, optionally filtered by cuisine, tier, and distance from a location.",
      inputSchema: {
        cuisine: z.string().optional(),
        tier: z.enum(TIERS).optional(),
        ...locationInputs,
      },
    },
    async (args) => {
      const results = applyFilters(readData(), args);
      if (results.length === 0) return json({ error: 'No restaurants match those filters' });
      const pick = results[Math.floor(Math.random() * results.length)];
      return json({ pool_size: results.length, pick: stripPhotoRef(pick) });
    }
  );

  return server;
}

/**
 * Express handler for POST /mcp — stateless Streamable HTTP transport.
 * A fresh server + transport per request: no session state, safe across
 * process restarts, and concurrent requests can't cross-talk.
 */
export function createMcpHandler(readData) {
  return async (req, res) => {
    try {
      const server = buildServer(readData);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      res.on('close', () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error('MCP request failed:', err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  };
}

// Stateless transport has no sessions to GET (SSE resume) or DELETE
export function methodNotAllowed(_req, res) {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed.' },
    id: null,
  });
}
