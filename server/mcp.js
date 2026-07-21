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
  getVisits,
  insertVisit,
  getCollections,
  getCollection,
  insertCollection,
  updateCollectionRow,
  deleteCollectionRow,
} from './data.js';

const PUBLIC_URL = process.env.PUBLIC_URL || 'https://bobby.menu';

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

function applyFilters(data, { query, cuisine, tier, tiers, city, tags, near_lat, near_lng, max_distance_miles, min_rating, price_level, open_now, has_accolade, accolade_source }) {
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
  if (has_accolade) {
    results = results.filter((r) => Array.isArray(r.accolades) && r.accolades.length > 0);
  }
  if (accolade_source) {
    const src = accolade_source.toLowerCase();
    results = results.filter((r) => (r.accolades ?? []).some((a) => (a.source ?? '').toLowerCase().includes(src)));
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
    ? ' Write tools are available: log_visit after eating somewhere (promote the tier, note what was good, ' +
      'record spend/party size from a receipt — the spend stays private), get_visits for private visit history ' +
      'and spend questions, update_restaurant for direct edits (its clear param removes fields like a mistaken lastVisited), ' +
      'add_restaurant for new finds, list_photo_options/set_photo to choose the card photo visually, ' +
      'refresh_enrichment to re-pull Google data, delete_restaurant (permanent — confirm with the curator first), ' +
      'and create_collection/update_collection/delete_collection for shareable curated lists.'
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
        'and list_cuisines to see what cuisines exist before filtering. ' +
        'list_collections/get_collection expose named shareable lists (each has a public URL at /c/<slug>).' +
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
        has_accolade: z.boolean().optional().describe('Only places with press/community recognition (e.g. Phoenix New Times 50 Best)'),
        accolade_source: z.string().optional().describe("Filter to a recognition source, e.g. 'New Times'"),
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

  server.registerTool(
    'list_collections',
    {
      title: 'List collections',
      description:
        "Bobby's named restaurant collections — hand-picked, ordered, annotated lists " +
        '(e.g. "Visiting Phoenix? Start here"). Each is shareable at its URL.',
      inputSchema: {},
    },
    async () => {
      const collections = await getCollections();
      return json({
        total: collections.length,
        collections: collections.map((c) => ({
          slug: c.slug,
          title: c.title,
          blurb: c.blurb ?? null,
          count: (c.restaurant_ids ?? []).length,
          updated_at: c.updated_at,
          url: `${PUBLIC_URL}/c/${c.slug}`,
        })),
      });
    }
  );

  server.registerTool(
    'get_collection',
    {
      title: 'Get a collection',
      description: 'A collection with its member restaurants resolved, in curated order.',
      inputSchema: {
        slug: z.string().describe("Collection slug, e.g. 'visiting-phoenix'"),
      },
    },
    async ({ slug }) => {
      const c = await getCollection(slug);
      if (!c) return json({ error: `No collection with slug '${slug}'` });
      const byId = new Map((await getAll()).map((r) => [r.id, r]));
      const ids = c.restaurant_ids ?? [];
      const restaurants = ids.filter((id) => byId.has(id)).map((id) => compactResult(byId.get(id)));
      const missing = ids.filter((id) => !byId.has(id));
      return json({
        slug: c.slug,
        title: c.title,
        blurb: c.blurb ?? null,
        url: `${PUBLIC_URL}/c/${c.slug}`,
        updated_at: c.updated_at,
        restaurants,
        ...(missing.length && { missing_ids: missing }),
      });
    }
  );

  if (authed) {
    registerWriteTools(server);
  }

  return server;
}

// "Today" in a specific city's local time — NOT UTC. The container runs UTC,
// so toISOString() would stamp an evening visit in Phoenix/Hartford with
// tomorrow's date. en-CA locale formats as YYYY-MM-DD.
const localToday = (city) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: CITY_TIMEZONES[city] ?? DEFAULT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

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
        '(kept alongside the existing notes, not replacing them), record standout dishes, spend, party size, and add tags. ' +
        'Sets lastVisited to today and writes a private structured visit row (spend never appears publicly). ' +
        'This is the main curation tool — prefer it over update_restaurant after a meal.',
      inputSchema: {
        id: z.string().describe("Slug id, e.g. 'manna-bbq' (find it via search_restaurants)"),
        new_tier: z.enum(TIERS).optional().describe('New tier after the visit, if it changed'),
        note_append: z.string().optional().describe('Impressions from the visit — appended as a dated line'),
        dishes: z.array(z.string()).optional().describe("Standout dishes, e.g. ['galbi ribs', 'garlic shrimp']"),
        tags_add: z.array(z.string()).optional().describe("Tags to add, e.g. ['date night', 'patio']"),
        spend: z.number().nonnegative().optional().describe('Total spend in dollars, e.g. 84.50 (from a receipt) — stored privately, never shown on the public map'),
        party_size: z.number().int().positive().optional().describe('How many people ate'),
        visited_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Visit date if not today (YYYY-MM-DD), e.g. when logging from an old receipt'),
      },
    },
    async ({ id, new_tier, note_append, dishes, tags_add, spend, party_size, visited_on }) => {
      const data = await getAll();
      const r = data.find((x) => x.id === id);
      if (!r) return json({ error: `No restaurant with id '${id}'` });
      const visitDate = visited_on ?? localToday(r.city);
      const fields = { lastVisited: visitDate };
      if (new_tier) fields.tier = new_tier;
      if (note_append) {
        fields.notes = r.notes ? `${r.notes}\n[visited ${visitDate}] ${note_append}` : `[visited ${visitDate}] ${note_append}`;
      }
      if (dishes?.length) fields.dishes = mergeUnique(r.dishes, dishes);
      if (tags_add?.length) fields.tags = mergeUnique(r.tags, tags_add);
      const updated = await updateRow(id, fields);
      // Dual-write: private structured row (the prose line above stays the public timeline)
      let visitRowWarning;
      try {
        await insertVisit({
          restaurant_id: id,
          restaurant_name: r.name,
          visited_on: visitDate,
          note: note_append ?? null,
          dishes: dishes?.length ? dishes : null,
          spend_cents: spend != null ? Math.round(spend * 100) : null,
          party_size: party_size ?? null,
        });
      } catch (err) {
        // Prose write already landed; re-running backfill-visits.js heals the gap
        visitRowWarning = err.message;
      }
      return json({ updated: fullResult(updated), ...(visitRowWarning && { visit_row_warning: visitRowWarning }) });
    }
  );

  server.registerTool(
    'get_visits',
    {
      title: 'Get visit history',
      description:
        "Bobby's private structured visit log — dates, notes, dishes, spend, party size. " +
        'Filter by restaurant, city, or date range. Includes spend totals; use for ' +
        '"how much did I spend on food this month" or "when did I last eat at X" questions.',
      inputSchema: {
        id: z.string().optional().describe('Limit to one restaurant (slug id)'),
        city: z.string().optional().describe("Limit to a metro, e.g. 'phoenix'"),
        since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Only visits on/after this date (YYYY-MM-DD)'),
        until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Only visits on/before this date (YYYY-MM-DD)'),
        limit: z.number().int().positive().max(500).optional().describe('Max rows returned (default 50, newest first)'),
      },
    },
    async ({ id, city, since, until, limit }) => {
      let visits = await getVisits();
      if (id) visits = visits.filter((v) => v.restaurant_id === id);
      if (city) {
        const inCity = new Set((await getAll()).filter((r) => r.city === city).map((r) => r.id));
        visits = visits.filter((v) => inCity.has(v.restaurant_id));
      }
      if (since) visits = visits.filter((v) => v.visited_on >= since);
      if (until) visits = visits.filter((v) => v.visited_on <= until);
      visits.sort((a, b) => (a.visited_on < b.visited_on ? 1 : -1));
      const spends = visits.filter((v) => v.spend_cents != null);
      const totalSpendCents = spends.reduce((sum, v) => sum + v.spend_cents, 0);
      return json({
        total: visits.length,
        total_spend_dollars: totalSpendCents / 100,
        avg_spend_dollars: spends.length ? Math.round(totalSpendCents / spends.length) / 100 : null,
        visits_with_spend: spends.length,
        visits: visits.slice(0, limit ?? 50),
      });
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
        dateAdded: localToday(city ?? nearestCity(lat, lng)),
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
      // Warn about dangling collection membership (the frontend tolerates it,
      // but the curator probably wants to prune the list)
      const inCollections = (await getCollections())
        .filter((c) => (c.restaurant_ids ?? []).includes(id))
        .map((c) => c.slug);
      return json({
        deleted: id,
        name: r.name,
        note: 'Removed from the list and map immediately',
        ...(inCollections.length && {
          warning: `Still referenced by collection(s): ${inCollections.join(', ')} — use update_collection with remove to prune`,
        }),
      });
    }
  );

  server.registerTool(
    'create_collection',
    {
      title: 'Create a collection',
      description:
        'Create a named, ordered, shareable restaurant collection (e.g. "Visiting Phoenix? Start here"). ' +
        'Returns the public URL to share. Order of restaurant_ids is the display order.',
      inputSchema: {
        title: z.string().min(1).describe('Display title, e.g. "Visiting Phoenix? Start here"'),
        slug: z.string().regex(/^[a-z0-9-]+$/).optional().describe('URL slug (default: generated from title)'),
        blurb: z.string().optional().describe("Short intro in Bobby's voice, shown at the top"),
        restaurant_ids: z.array(z.string()).min(1).describe('Ordered restaurant slug ids'),
      },
    },
    async ({ title, slug, blurb, restaurant_ids }) => {
      const data = await getAll();
      const known = new Set(data.map((r) => r.id));
      const unknown = restaurant_ids.filter((id) => !known.has(id));
      if (unknown.length) return json({ error: `Unknown restaurant ids: ${unknown.join(', ')}` });
      const existing = await getCollections();
      const finalSlug = slug ?? generateUniqueSlugId(title, existing.map((c) => c.slug));
      if (existing.some((c) => c.slug === finalSlug)) {
        return json({ error: `Collection '${finalSlug}' already exists — use update_collection or pick another slug` });
      }
      const deduped = [...new Set(restaurant_ids)];
      const created = await insertCollection({
        slug: finalSlug,
        title,
        blurb: blurb ?? null,
        restaurant_ids: deduped,
      });
      return json({ created: { slug: created.slug, title: created.title, count: deduped.length }, url: `${PUBLIC_URL}/c/${created.slug}` });
    }
  );

  server.registerTool(
    'update_collection',
    {
      title: 'Update a collection',
      description:
        'Edit a collection: change title/blurb, add or remove restaurants, or pass restaurant_ids ' +
        'to replace the whole list (that is also how you reorder).',
      inputSchema: {
        slug: z.string().describe('Collection slug'),
        title: z.string().min(1).optional(),
        blurb: z.string().optional(),
        add: z.array(z.string()).optional().describe('Restaurant ids to append (deduped)'),
        remove: z.array(z.string()).optional().describe('Restaurant ids to remove'),
        restaurant_ids: z.array(z.string()).min(1).optional().describe('Full replacement list — wins over add/remove; use to reorder'),
      },
    },
    async ({ slug, title, blurb, add, remove, restaurant_ids }) => {
      const c = await getCollection(slug);
      if (!c) return json({ error: `No collection with slug '${slug}'` });
      const fields = {};
      if (title !== undefined) fields.title = title;
      if (blurb !== undefined) fields.blurb = blurb;
      let ids;
      if (restaurant_ids) {
        ids = [...new Set(restaurant_ids)];
      } else if (add?.length || remove?.length) {
        ids = [...new Set([...(c.restaurant_ids ?? []), ...(add ?? [])])];
        if (remove?.length) {
          const gone = new Set(remove);
          ids = ids.filter((id) => !gone.has(id));
        }
      }
      if (ids) {
        const known = new Set((await getAll()).map((r) => r.id));
        const unknown = ids.filter((id) => !known.has(id));
        if (unknown.length) return json({ error: `Unknown restaurant ids: ${unknown.join(', ')}` });
        if (ids.length === 0) return json({ error: 'A collection cannot be emptied — use delete_collection instead' });
        fields.restaurant_ids = ids;
      }
      if (Object.keys(fields).length === 0) return json({ error: 'No fields to update' });
      const updated = await updateCollectionRow(slug, fields);
      return json({
        updated: { slug: updated.slug, title: updated.title, blurb: updated.blurb ?? null, count: (updated.restaurant_ids ?? []).length },
        url: `${PUBLIC_URL}/c/${updated.slug}`,
      });
    }
  );

  server.registerTool(
    'delete_collection',
    {
      title: 'Delete a collection',
      description:
        'PERMANENTLY delete a collection (the restaurants in it are untouched). ' +
        'Shared links to it will stop working. Confirm with the curator first.',
      inputSchema: {
        slug: z.string().describe('Collection slug to delete'),
        confirm: z.literal(true).describe('Must be true — acknowledges this is permanent'),
      },
    },
    async ({ slug }) => {
      const deleted = await deleteCollectionRow(slug);
      if (!deleted) return json({ error: `No collection with slug '${slug}'` });
      return json({ deleted: slug, note: `${PUBLIC_URL}/c/${slug} is no longer live` });
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

  server.registerTool(
    'add_accolade',
    {
      title: 'Add recognition',
      description:
        'Record press or community recognition for a restaurant (e.g. a Phoenix New Times list, a ' +
        'James Beard nod, an r/phoenix favorite). Shown as a badge on the card and filterable.',
      inputSchema: {
        id: z.string().describe('Slug id of the restaurant'),
        source: z.string().min(1).describe("Who recognized it, e.g. 'Phoenix New Times', 'r/phoenix'"),
        list: z.string().optional().describe("Which list/award, e.g. '50 Best'"),
        year: z.number().int().min(2000).max(2100).optional(),
        category: z.string().optional().describe("List category, e.g. 'Neighborhood Favorites'"),
        url: z.string().url().optional().describe('Link to the article/thread'),
      },
    },
    async ({ id, ...accolade }) => {
      const data = await getAll();
      const r = data.find((x) => x.id === id);
      if (!r) return json({ error: `No restaurant with id '${id}'` });
      const accolades = Array.isArray(r.accolades) ? [...r.accolades] : [];
      const dup = accolades.some(
        (a) => a.source === accolade.source && a.list === accolade.list && a.year === accolade.year
      );
      if (dup) return json({ error: 'That accolade already exists on this restaurant' });
      accolades.push(accolade);
      const updated = await updateRow(id, { accolades });
      return json({ updated: fullResult(updated) });
    }
  );

  server.registerTool(
    'remove_accolade',
    {
      title: 'Remove recognition',
      description: 'Remove an accolade from a restaurant by source (and optionally year).',
      inputSchema: {
        id: z.string().describe('Slug id of the restaurant'),
        source: z.string().min(1),
        year: z.number().int().optional().describe('Only remove the entry for this year'),
      },
    },
    async ({ id, source, year }) => {
      const data = await getAll();
      const r = data.find((x) => x.id === id);
      if (!r) return json({ error: `No restaurant with id '${id}'` });
      const before = Array.isArray(r.accolades) ? r.accolades : [];
      const after = before.filter(
        (a) => !((a.source ?? '').toLowerCase() === source.toLowerCase() && (year === undefined || a.year === year))
      );
      if (after.length === before.length) return json({ error: 'No matching accolade found' });
      const updated = await updateRow(id, { accolades: after.length ? after : null });
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
