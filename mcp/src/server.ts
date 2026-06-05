import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadData, searchRestaurants, filterRestaurants, nearbyRestaurants, getStats } from './tools.js';

const server = new McpServer({
  name: 'bobby-menu',
  version: '1.0.0',
});

// --- Tools ---

server.tool(
  'search_restaurants',
  'Search bobby.menu restaurant list by name. Returns matching restaurants with cuisine, tier, notes, and Google Maps link.',
  {
    query: z.string().describe('Restaurant name to search for (partial match, case-insensitive)'),
    limit: z.number().optional().default(10).describe('Max results to return (default 10)'),
  },
  async (args) => ({
    content: [{ type: 'text', text: searchRestaurants(args) }],
  }),
);

server.tool(
  'filter_restaurants',
  'Filter bobby.menu restaurant list by cuisine type and/or tier (loved, recommended, on_my_radar).',
  {
    cuisine: z.string().optional().describe('Cuisine type (e.g., "Mexican", "Korean", "Italian")'),
    tier: z.enum(['loved', 'recommended', 'on_my_radar']).optional().describe('Curator confidence tier'),
    limit: z.number().optional().default(20).describe('Max results to return (default 20)'),
  },
  async (args) => ({
    content: [{ type: 'text', text: filterRestaurants(args) }],
  }),
);

server.tool(
  'nearby_restaurants',
  'Find restaurants from bobby.menu near a location. Provide latitude/longitude coordinates. Results sorted by distance.',
  {
    lat: z.number().describe('Latitude of the location'),
    lng: z.number().describe('Longitude of the location'),
    radius_miles: z.number().optional().default(10).describe('Search radius in miles (default 10)'),
    cuisine: z.string().optional().describe('Optional cuisine filter'),
    limit: z.number().optional().default(15).describe('Max results to return (default 15)'),
  },
  async (args) => ({
    content: [{ type: 'text', text: nearbyRestaurants(args) }],
  }),
);

// --- Resources ---

server.resource(
  'stats',
  'restaurant://stats',
  async () => ({
    contents: [{ uri: 'restaurant://stats', mimeType: 'text/plain', text: getStats() }],
  }),
);

// --- Start ---

await loadData();

const transport = new StdioServerTransport();
await server.connect(transport);
