import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import {
  readData,
  writeData,
  VALID_TIERS,
  validateRestaurant,
  generateUniqueSlugId,
  enrichInBackground,
  haversineDistance,
} from './data.js';

const TIERS = VALID_TIERS;

const PRICE_LEVELS = {
  inexpensive: 'PRICE_LEVEL_INEXPENSIVE',
  moderate: 'PRICE_LEVEL_MODERATE',
  expensive: 'PRICE_LEVEL_EXPENSIVE',
  very_expensive: 'PRICE_LEVEL_VERY_EXPENSIVE',
};

// The map is Phoenix-metro only; Arizona doesn't observe DST
const TZ = 'America/Phoenix';
const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function phoenixNowMinutes() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  // minutes since Sunday 00:00, Phoenix time
  return WEEKDAYS[parts.weekday] * 1440 + (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10);
}

const WEEK_MINUTES = 7 * 1440;

export function isOpenNow(openingHours, nowMinutes = phoenixNowMinutes()) {
  const periods = openingHours?.periods;
  if (!periods?.length) return false;
  for (const p of periods) {
    if (!p.open) continue;
    if (!p.close) return true; // open 24/7 (single close-less period)
    const start = p.open.day * 1440 + (p.open.hour ?? 0) * 60 + (p.open.minute ?? 0);
    let end = p.close.day * 1440 + (p.close.hour ?? 0) * 60 + (p.close.minute ?? 0);
    if (end <= start) end += WEEK_MINUTES; // spans the Sat→Sun wrap
    if ((nowMinutes >= start && nowMinutes < end) || (nowMinutes + WEEK_MINUTES >= start && nowMinutes + WEEK_MINUTES < end)) {
      return true;
    }
  }
  return false;
}

// photoRef is a huge Google Places blob and raw hours periods are noise —
// search results carry a computed open_now instead
function compactResult(restaurant) {
  const { photoRef: _photoRef, openingHours, ...rest } = restaurant;
  if (openingHours) rest.open_now = isOpenNow(openingHours);
  return rest;
}

// Full detail view: readable weekly hours instead of raw periods
function fullResult(restaurant) {
  const { photoRef: _photoRef, openingHours, ...rest } = restaurant;
  if (openingHours) {
    rest.open_now = isOpenNow(openingHours);
    rest.hours = openingHours.weekdayDescriptions;
  }
  return rest;
}

function json(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function applyFilters(data, { query, cuisine, tier, near_lat, near_lng, max_distance_miles, min_rating, price_level, open_now }) {
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
  if (open_now) {
    const now = phoenixNowMinutes();
    results = results.filter((r) => r.openingHours && isOpenNow(r.openingHours, now));
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

function buildServer(authed) {
  const writeToolNote = authed
    ? ' Write tools are available: use log_visit after eating somewhere (promote the tier, note what was good), ' +
      'update_restaurant for direct edits, and add_restaurant for new finds.'
    : '';
  const server = new McpServer(
    { name: 'Bobby.Menu', version: '1.0.0' },
    {
      instructions:
        "Bobby's personal curated list of Phoenix-metro restaurants. Every restaurant has a tier: " +
        "'loved' (personal favorites), 'recommended' (solid picks), or 'on_my_radar' (want to try, not yet vetted). " +
        'Ratings and price levels come from Google Places. Use search_restaurants for filtered lookups, ' +
        'pick_random for "what should I eat tonight" (both support open_now for "open right now", using Phoenix time), ' +
        'and list_cuisines to see what cuisines exist before filtering.' +
        writeToolNote,
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
        open_now: z.boolean().optional().describe('Only restaurants open right now (Phoenix time). Places with unknown hours are excluded.'),
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
        restaurants: results.slice(0, limit).map(compactResult),
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
        return match ? json(fullResult(match)) : json({ error: `No restaurant with id '${id}'` });
      }
      if (name) {
        const n = name.toLowerCase();
        const matches = data.filter((r) => r.name.toLowerCase().includes(n));
        if (matches.length === 0) return json({ error: `No restaurant matching '${name}'` });
        return json({
          match: fullResult(matches[0]),
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
        open_now: z.boolean().optional().describe('Only restaurants open right now (Phoenix time)'),
        ...locationInputs,
      },
    },
    async (args) => {
      const results = applyFilters(readData(), args);
      if (results.length === 0) return json({ error: 'No restaurants match those filters' });
      const pick = results[Math.floor(Math.random() * results.length)];
      return json({ pool_size: results.length, pick: compactResult(pick) });
    }
  );

  if (authed) {
    registerWriteTools(server);
  }

  return server;
}

const today = () => new Date().toISOString().slice(0, 10);

function mergeUnique(existing, additions) {
  return [...new Set([...(existing ?? []), ...additions])];
}

function registerWriteTools(server) {
  server.registerTool(
    'log_visit',
    {
      title: 'Log a visit',
      description:
        'Record that Bobby ate at a restaurant: optionally promote/demote its tier, append a dated note ' +
        '(kept alongside the existing notes, not replacing them), record standout dishes, and add tags. ' +
        'Sets lastVisited to today. This is the main curation tool — prefer it over update_restaurant after a meal.',
      inputSchema: {
        id: z.string().describe("Slug id, e.g. 'manna-bbq' (find it via search_restaurants)"),
        new_tier: z.enum(TIERS).optional().describe('New tier after the visit, if it changed'),
        note_append: z.string().optional().describe('Impressions from the visit — appended as a dated line'),
        dishes: z.array(z.string()).optional().describe("Standout dishes, e.g. ['galbi ribs', 'garlic shrimp']"),
        tags_add: z.array(z.string()).optional().describe("Tags to add, e.g. ['date night', 'patio']"),
      },
    },
    async ({ id, new_tier, note_append, dishes, tags_add }) => {
      const data = readData();
      const r = data.find((x) => x.id === id);
      if (!r) return json({ error: `No restaurant with id '${id}'` });
      if (new_tier) r.tier = new_tier;
      if (note_append) {
        r.notes = r.notes ? `${r.notes}\n[visited ${today()}] ${note_append}` : `[visited ${today()}] ${note_append}`;
      }
      if (dishes?.length) r.dishes = mergeUnique(r.dishes, dishes);
      if (tags_add?.length) r.tags = mergeUnique(r.tags, tags_add);
      r.lastVisited = today();
      writeData(data);
      return json({ updated: fullResult(r) });
    }
  );

  server.registerTool(
    'update_restaurant',
    {
      title: 'Update a restaurant',
      description:
        'Directly edit fields on a restaurant. notes/tags/dishes REPLACE the existing values — ' +
        'for after-a-meal updates that should accumulate, use log_visit instead.',
      inputSchema: {
        id: z.string().describe('Slug id of the restaurant to edit'),
        tier: z.enum(TIERS).optional(),
        cuisine: z.string().min(1).optional(),
        notes: z.string().optional().describe('Replaces existing notes entirely'),
        tags: z.array(z.string()).optional().describe('Replaces existing tags entirely'),
        dishes: z.array(z.string()).optional().describe('Replaces existing dishes entirely'),
      },
    },
    async ({ id, ...updates }) => {
      const data = readData();
      const r = data.find((x) => x.id === id);
      if (!r) return json({ error: `No restaurant with id '${id}'` });
      if (updates.cuisine !== undefined) updates.cuisine = updates.cuisine.trim();
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined) r[k] = v;
      }
      writeData(data);
      return json({ updated: fullResult(r) });
    }
  );

  server.registerTool(
    'add_restaurant',
    {
      title: 'Add a restaurant',
      description:
        'Add a new restaurant to the list. Requires coordinates — if you only have a name/address, ' +
        'resolve lat/lng first. Rating, price level, and photo are enriched automatically from Google ' +
        'Places in the background.',
      inputSchema: {
        name: z.string().min(1),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        cuisine: z.string().min(1),
        tier: z.enum(TIERS).describe("Usually 'on_my_radar' for a place Bobby hasn't tried yet"),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
        googleMapsUrl: z.string().url().optional().describe('Defaults to a maps search link for the name + coords'),
      },
    },
    async ({ name, lat, lng, cuisine, tier, notes, tags, googleMapsUrl }) => {
      const data = readData();
      const existing = data.find((x) => x.name.toLowerCase() === name.trim().toLowerCase());
      if (existing) {
        return json({
          error: `'${existing.name}' already exists (id: ${existing.id}) — use log_visit or update_restaurant instead`,
        });
      }
      const restaurant = {
        id: generateUniqueSlugId(name, data.map((x) => x.id)),
        name: name.trim(),
        tier,
        cuisine: cuisine.trim(),
        lat,
        lng,
        googleMapsUrl:
          googleMapsUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&center=${lat},${lng}`,
        dateAdded: today(),
      };
      if (notes) restaurant.notes = notes;
      if (tags?.length) restaurant.tags = tags;
      const errors = validateRestaurant(restaurant);
      if (errors.length > 0) return json({ error: 'Validation failed', details: errors });
      data.push(restaurant);
      writeData(data);
      enrichInBackground(restaurant);
      return json({ added: restaurant, note: 'Rating/price/photo enrichment runs in the background' });
    }
  );
}

/**
 * Express handler for POST /mcp — stateless Streamable HTTP transport.
 * A fresh server + transport per request: no session state, safe across
 * process restarts, and concurrent requests can't cross-talk.
 *
 * Requests carrying `Authorization: Bearer <ADMIN_PASSWORD>` get the write
 * tools registered; everyone else silently gets the read-only set.
 */
export function createMcpHandler(adminPassword) {
  return async (req, res) => {
    try {
      const authed = req.headers.authorization === `Bearer ${adminPassword}`;
      const server = buildServer(authed);
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
