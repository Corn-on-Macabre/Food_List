import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import {
  getAll,
  insertRow,
  updateRow,
  VALID_TIERS,
  validateRestaurant,
  generateUniqueSlugId,
  enrichInBackground,
  haversineDistance,
  nearestCity,
  METRO_CENTERS,
  TAG_VOCABULARY,
  CITY_TIMEZONES,
  fetchPlacePhotos,
  fetchPhotoThumb,
  deleteRow,
  enrichRestaurant,
} from './data.js';

const TIERS = VALID_TIERS;

const PRICE_LEVELS = {
  inexpensive: 'PRICE_LEVEL_INEXPENSIVE',
  moderate: 'PRICE_LEVEL_MODERATE',
  expensive: 'PRICE_LEVEL_EXPENSIVE',
  very_expensive: 'PRICE_LEVEL_VERY_EXPENSIVE',
};

const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const DEFAULT_TZ = 'America/Phoenix';

// minutes since Sunday 00:00 in the given IANA timezone (hours are stored in
// each place's local time — the list spans multiple metros)
const nowCache = new Map();
function localNowMinutes(timeZone) {
  if (nowCache.has(timeZone)) return nowCache.get(timeZone);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  const minutes = WEEKDAYS[parts.weekday] * 1440 + (parseInt(parts.hour, 10) % 24) * 60 + parseInt(parts.minute, 10);
  nowCache.set(timeZone, minutes);
  setTimeout(() => nowCache.delete(timeZone), 30_000).unref?.();
  return minutes;
}

function restaurantNowMinutes(r) {
  return localNowMinutes(CITY_TIMEZONES[r.city] ?? DEFAULT_TZ);
}

const WEEK_MINUTES = 7 * 1440;

export function isOpenNow(openingHours, nowMinutes) {
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
  if (openingHours) rest.open_now = isOpenNow(openingHours, restaurantNowMinutes(restaurant));
  return rest;
}

// Full detail view: readable weekly hours instead of raw periods
function fullResult(restaurant) {
  const { photoRef: _photoRef, openingHours, ...rest } = restaurant;
  if (openingHours) {
    rest.open_now = isOpenNow(openingHours, restaurantNowMinutes(restaurant));
    rest.hours = openingHours.weekdayDescriptions;
  }
  return rest;
}

function json(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

const TIER_WEIGHT = { loved: 2, recommended: 1, on_my_radar: 0 };

function applyFilters(data, { query, cuisine, tier, tiers, city, tags, near_lat, near_lng, max_distance_miles, min_rating, price_level, open_now }) {
  let results = data;

  if (query) {
    const q = query.toLowerCase();
    results = results.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.cuisine.toLowerCase().includes(q) ||
      (r.notes && r.notes.toLowerCase().includes(q)) ||
      (r.dishes && r.dishes.some((d) => d.toLowerCase().includes(q))) ||
      (r.tags && r.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }
  if (cuisine) {
    const c = cuisine.toLowerCase();
    results = results.filter((r) => r.cuisine.toLowerCase() === c);
  }
  const allowedTiers = tiers?.length ? tiers : (tier ? [tier] : null);
  if (allowedTiers) {
    results = results.filter((r) => allowedTiers.includes(r.tier));
  }
  if (city) {
    const ct = city.toLowerCase();
    results = results.filter((r) => (r.city ?? '').toLowerCase() === ct);
  }
  if (tags?.length) {
    results = results.filter((r) => r.tags && tags.every((t) => r.tags.includes(t)));
  }
  if (min_rating !== undefined) {
    results = results.filter((r) => typeof r.rating === 'number' && r.rating >= min_rating);
  }
  if (price_level) {
    results = results.filter((r) => r.priceLevel === PRICE_LEVELS[price_level]);
  }
  if (open_now) {
    results = results.filter((r) => r.openingHours && isOpenNow(r.openingHours, restaurantNowMinutes(r)));
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
    // Bobby's opinion outranks Google's: loved > recommended > radar, then rating
    results = [...results].sort(
      (a, b) => (TIER_WEIGHT[b.tier] ?? 0) - (TIER_WEIGHT[a.tier] ?? 0) || (b.rating ?? 0) - (a.rating ?? 0)
    );
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
    ? ' Write tools are available: log_visit after eating somewhere (promote the tier, note what was good — appends a dated line), ' +
      'update_restaurant for direct edits (its clear param removes fields like a mistaken lastVisited), add_restaurant for new finds, ' +
      'list_photo_options/set_photo to choose the card photo visually, refresh_enrichment to re-pull Google data, ' +
      'and delete_restaurant (permanent — confirm with the curator first).'
    : '';
  const server = new McpServer(
    { name: 'Bobby.Menu', version: '1.0.0' },
    {
      instructions:
        "Bobby's personal curated restaurant list — mostly Phoenix metro, plus trips (dallas, chicago, "  +
        "se-connecticut, wichita, hartford — filter with city). Every restaurant has a tier: " +
        "'loved' (personal favorites), 'recommended' (solid picks), or 'on_my_radar' (want to try, not yet vetted). " +
        'Ratings, hours, and price levels come from Google Places. For "give me recommendations" style asks, ' +
        "call search_restaurants with tiers:['loved','recommended'] and the city — results are already sorted " +
        'tier-first. Use search_restaurants for filtered lookups, ' +
        'pick_random for "what should I eat tonight" (both support open_now, computed in each place\'s local time), ' +
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
        "otherwise they are sorted by Bobby's tier (loved > recommended > on_my_radar) then Google rating.",
      inputSchema: {
        query: z.string().optional().describe('Free-text match against name, cuisine, and notes'),
        cuisine: z.string().optional().describe("Exact cuisine, e.g. 'Korean' (see list_cuisines)"),
        tier: z.enum(TIERS).optional().describe('Single tier (see also tiers)'),
        tiers: z.array(z.enum(TIERS)).optional().describe("Any-of tier filter — for \"recommendations\" use ['loved','recommended']"),
        city: z.string().optional().describe("Metro region, e.g. 'phoenix', 'dallas', 'chicago', 'se-connecticut', 'wichita', 'hartford'"),
        tags: z.array(z.enum(TAG_VOCABULARY)).optional().describe('Restaurant must have ALL of these occasion/vibe tags'),
        min_rating: z.number().min(0).max(5).optional().describe('Minimum Google rating'),
        price_level: z.enum(Object.keys(PRICE_LEVELS)).optional(),
        open_now: z.boolean().optional().describe("Only restaurants open right now (each place's local time). Places with unknown hours are excluded."),
        limit: z.number().int().positive().max(100).optional().describe('Max results to return (default 20)'),
        ...locationInputs,
      },
    },
    async (args) => {
      const results = applyFilters(await getAll(), args);
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
      const data = await getAll();
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
      description: 'Cuisines with restaurant counts, optionally scoped to a city. Use these values for the cuisine filter.',
      inputSchema: {
        city: z.string().optional().describe("Metro region to scope to, e.g. 'phoenix'"),
      },
    },
    async ({ city }) => {
      const counts = {};
      const ct = city?.toLowerCase();
      for (const r of await getAll()) {
        if (ct && (r.city ?? '').toLowerCase() !== ct) continue;
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
      const data = await getAll();
      const byTier = Object.fromEntries(TIERS.map((t) => [t, 0]));
      const cuisineCounts = {};
      const cityCounts = {};
      for (const r of data) {
        if (byTier[r.tier] !== undefined) byTier[r.tier] += 1;
        cuisineCounts[r.cuisine] = (cuisineCounts[r.cuisine] ?? 0) + 1;
        if (r.city) cityCounts[r.city] = (cityCounts[r.city] ?? 0) + 1;
      }
      const topCuisines = Object.entries(cuisineCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([cuisine, count]) => ({ cuisine, count }));
      const newest = [...data]
        .sort((a, b) => (b.dateAdded ?? '').localeCompare(a.dateAdded ?? ''))
        .slice(0, 5)
        .map((r) => ({ id: r.id, name: r.name, tier: r.tier, cuisine: r.cuisine, dateAdded: r.dateAdded }));
      return json({ total: data.length, by_tier: byTier, by_city: cityCounts, top_cuisines: topCuisines, newest_additions: newest });
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
        city: z.string().optional().describe("Metro region, e.g. 'phoenix' (the default trip context)"),
        tags: z.array(z.enum(TAG_VOCABULARY)).optional().describe('Restaurant must have ALL of these tags'),
        open_now: z.boolean().optional().describe("Only restaurants open right now (each place's local time)"),
        ...locationInputs,
      },
    },
    async (args) => {
      const results = applyFilters(await getAll(), args);
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
      const data = await getAll();
      const r = data.find((x) => x.id === id);
      if (!r) return json({ error: `No restaurant with id '${id}'` });
      const fields = { lastVisited: today() };
      if (new_tier) fields.tier = new_tier;
      if (note_append) {
        fields.notes = r.notes ? `${r.notes}\n[visited ${today()}] ${note_append}` : `[visited ${today()}] ${note_append}`;
      }
      if (dishes?.length) fields.dishes = mergeUnique(r.dishes, dishes);
      if (tags_add?.length) fields.tags = mergeUnique(r.tags, tags_add);
      const updated = await updateRow(id, fields);
      return json({ updated: fullResult(updated) });
    }
  );

  server.registerTool(
    'update_restaurant',
    {
      title: 'Update a restaurant',
      description:
        'Directly edit fields on a restaurant. notes/tags/dishes REPLACE the existing values — ' +
        'for after-a-meal updates that should accumulate, use log_visit instead. ' +
        'Use clear to remove optional fields entirely (e.g. a mistaken lastVisited).',
      inputSchema: {
        id: z.string().describe('Slug id of the restaurant to edit'),
        name: z.string().min(1).optional(),
        tier: z.enum(TIERS).optional(),
        cuisine: z.string().min(1).optional(),
        city: z.enum(Object.keys(METRO_CENTERS)).optional(),
        lat: z.number().min(-90).max(90).optional(),
        lng: z.number().min(-180).max(180).optional(),
        featured: z.boolean().optional().describe("Bobby's Pick badge on the map"),
        notes: z.string().optional().describe('Replaces existing notes entirely'),
        tags: z.array(z.string()).optional().describe('Replaces existing tags entirely'),
        dishes: z.array(z.string()).optional().describe('Replaces existing dishes entirely'),
        website: z.string().url().optional(),
        phone: z.string().optional(),
        clear: z
          .array(z.enum(['lastVisited', 'notes', 'tags', 'dishes', 'website', 'phone', 'featured', 'source']))
          .optional()
          .describe('Optional fields to remove entirely (set to null)'),
      },
    },
    async ({ id, clear, ...updates }) => {
      if (updates.cuisine !== undefined) updates.cuisine = updates.cuisine.trim();
      const fields = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
      for (const f of clear ?? []) fields[f] = null;
      if (Object.keys(fields).length === 0) return json({ error: 'No fields to update' });
      const updated = await updateRow(id, fields);
      if (!updated) return json({ error: `No restaurant with id '${id}'` });
      return json({ updated: fullResult(updated) });
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
        city: z.enum(Object.keys(METRO_CENTERS)).optional().describe('Metro region — defaults to the nearest one to the coordinates'),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
        googleMapsUrl: z.string().url().optional().describe('Defaults to a maps search link for the name + coords'),
      },
    },
    async ({ name, lat, lng, cuisine, tier, city, notes, tags, googleMapsUrl }) => {
      const data = await getAll();
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
        // The map is city-scoped — a record without a city is invisible on it
        city: city ?? nearestCity(lat, lng),
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
      const inserted = await insertRow(restaurant);
      enrichInBackground(inserted);
      return json({ added: inserted, note: 'Rating/price/photo/hours enrichment runs in the background' });
    }
  );

  server.registerTool(
    'list_photo_options',
    {
      title: 'Show photo options',
      description:
        "Show the restaurant's available Google Places photos as numbered images so the curator " +
        'can pick the card cover visually. Follow up with set_photo.',
      inputSchema: {
        id: z.string().describe('Slug id of the restaurant'),
      },
    },
    async ({ id }) => {
      const data = await getAll();
      const r = data.find((x) => x.id === id);
      if (!r) return json({ error: `No restaurant with id '${id}'` });
      if (!r.googlePlaceId) return json({ error: `'${r.name}' has no Google Place ID (unenriched)` });
      const refs = await fetchPlacePhotos(r.googlePlaceId, 4);
      if (refs.length === 0) return json({ error: 'Google returned no photos for this place' });
      const content = [];
      for (const [i, ref] of refs.entries()) {
        const current = ref === r.photoRef ? ' (current card photo)' : '';
        content.push({ type: 'text', text: `Photo ${i}${current}:` });
        const b64 = await fetchPhotoThumb(ref);
        if (b64) content.push({ type: 'image', data: b64, mimeType: 'image/jpeg' });
        else content.push({ type: 'text', text: '(thumbnail unavailable)' });
      }
      content.push({
        type: 'text',
        text: `Call set_photo with { id: "${id}", photo_index: <0-${refs.length - 1}> } to apply one.`,
      });
      return { content };
    }
  );

  server.registerTool(
    'set_photo',
    {
      title: 'Set the card photo',
      description: "Set the restaurant's card photo to one of the numbered options from list_photo_options.",
      inputSchema: {
        id: z.string().describe('Slug id of the restaurant'),
        photo_index: z.number().int().min(0).max(9).describe('Index from list_photo_options'),
      },
    },
    async ({ id, photo_index }) => {
      const data = await getAll();
      const r = data.find((x) => x.id === id);
      if (!r) return json({ error: `No restaurant with id '${id}'` });
      if (!r.googlePlaceId) return json({ error: `'${r.name}' has no Google Place ID (unenriched)` });
      const refs = await fetchPlacePhotos(r.googlePlaceId, 10);
      if (photo_index >= refs.length) {
        return json({ error: `Only ${refs.length} photos available (asked for index ${photo_index})` });
      }
      await updateRow(id, { photoRef: refs[photo_index] });
      return json({ updated: id, photo_index, note: 'Card photo updated — live on the map immediately' });
    }
  );

  server.registerTool(
    'delete_restaurant',
    {
      title: 'Delete a restaurant',
      description:
        'PERMANENTLY delete a restaurant from the list. Not reversible (nightly backups exist, but ' +
        'treat this as destructive). Confirm the exact restaurant with the curator before calling.',
      inputSchema: {
        id: z.string().describe('Slug id of the restaurant to delete'),
        confirm: z.literal(true).describe('Must be true — acknowledges this is permanent'),
      },
    },
    async ({ id }) => {
      const data = await getAll();
      const r = data.find((x) => x.id === id);
      if (!r) return json({ error: `No restaurant with id '${id}'` });
      await deleteRow(id);
      return json({ deleted: id, name: r.name, note: 'Removed from the list and map immediately' });
    }
  );

  server.registerTool(
    'refresh_enrichment',
    {
      title: 'Refresh Google data',
      description:
        'Re-pull rating, hours, address, phone, website, price, photo and business status from ' +
        'Google Places for this restaurant. Use after moving a pin or when data looks stale.',
      inputSchema: {
        id: z.string().describe('Slug id of the restaurant'),
      },
    },
    async ({ id }) => {
      const data = await getAll();
      const r = data.find((x) => x.id === id);
      if (!r) return json({ error: `No restaurant with id '${id}'` });
      const result = await enrichRestaurant(r.name, r.lat, r.lng, 2000);
      if (!result) return json({ error: 'Google Places returned no match near the pin' });
      const updated = await updateRow(id, result.fields);
      return json({ updated: fullResult(updated) });
    }
  );
}

/**
 * Express handler for POST /mcp — stateless Streamable HTTP transport.
 * A fresh server + transport per request: no session state, safe across
 * process restarts, and concurrent requests can't cross-talk.
 *
 * `isAuthed(req)` decides whether write tools are registered (static admin
 * bearer or a valid OAuth token). With `requireAuth`, unauthenticated
 * requests get a 401 + WWW-Authenticate challenge pointing at the protected
 * resource metadata — that 401 is what triggers the OAuth flow in MCP
 * clients like the Claude app.
 */
export function createMcpHandler({ isAuthed, requireAuth = false, resourceMetadataUrl }) {
  return async (req, res) => {
    try {
      const authed = await isAuthed(req);
      if (requireAuth && !authed) {
        res.status(401)
          .set('WWW-Authenticate', `Bearer resource_metadata="${resourceMetadataUrl}"`)
          .json({
            jsonrpc: '2.0',
            error: { code: -32001, message: 'Unauthorized: valid curator credentials required' },
            id: null,
          });
        return;
      }
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
