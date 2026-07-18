# Bobby.Menu MCP Server

Query the restaurant list from any MCP-capable LLM client — no need to open the map.

- **Endpoint:** `https://bobby.menu/mcp`
- **Transport:** Streamable HTTP (stateless)
- **Auth:** none (read-only; same data as the public `/restaurants.json`)

## Tools

| Tool | What it does |
|------|--------------|
| `search_restaurants` | Filter by free-text query, cuisine, tier, min rating, price level, and distance from a lat/lng. Nearest-first when a location is given. |
| `get_restaurant` | One restaurant by slug id or fuzzy name. |
| `list_cuisines` | All cuisines with counts (grounds the `cuisine` filter). |
| `get_stats` | Totals by tier, top cuisines, newest additions. |
| `pick_random` | "What should I eat tonight?" — random pick from a filtered pool. |

### Write tools (curator only)

Requests carrying `Authorization: Bearer <ADMIN_PASSWORD>` (the same password the admin
dashboard uses) additionally get:

| Tool | What it does |
|------|--------------|
| `log_visit` | The main curation tool — "just ate at X": promote/demote tier, append a dated note, record standout dishes, add tags, stamp `lastVisited`. |
| `update_restaurant` | Direct field edits (tier, cuisine, notes/tags/dishes — these replace). |
| `add_restaurant` | Add a new place (name + coords + cuisine + tier); rating/price/photo enrich automatically in the background. |

Unauthenticated clients silently get the read-only set — so the same URL is safe to hand out.

**Claude Code (with write access):**

```sh
claude mcp add --transport http --header "Authorization: Bearer <ADMIN_PASSWORD>" Bobby-Menu https://bobby.menu/mcp
```

**Cursor (with write access):** add a `headers` map to the server entry:

```json
{
  "mcpServers": {
    "Bobby.Menu": {
      "url": "https://bobby.menu/mcp",
      "headers": { "Authorization": "Bearer <ADMIN_PASSWORD>" }
    }
  }
}
```

> The Claude app's custom connectors can't send a static bearer header, so mobile stays
> read-only by design.

## Client setup

### Claude app (web + mobile — the on-the-go option)

Settings → Connectors → **Add custom connector** → paste the endpoint URL, no auth.
Once added on claude.ai it's available in the Claude mobile app too.

### Claude Code

```sh
claude mcp add --transport http Bobby-Menu https://bobby.menu/mcp
```

### Cursor

Add to `~/.cursor/mcp.json` (or the project's `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "Bobby.Menu": { "url": "https://bobby.menu/mcp" }
  }
}
```

### Gemini CLI

Add to `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "Bobby.Menu": { "httpUrl": "https://bobby.menu/mcp" }
  }
}
```

> **Note:** the Gemini consumer mobile app does not support custom MCP servers — Gemini access is CLI/API only.

## Server notes

- Implementation: `server/mcp.js`, mounted at `POST /mcp` in `server/index.js`.
- **Production routing is Traefik, not Nginx**: the VPS runs Docker Compose (`/root/docker-compose.yml`) with a Traefik reverse proxy; the `food-list-api` service's router rule matches `PathPrefix(/api) || PathPrefix(/mcp)` on `bobby.menu`, `www.bobby.menu`, and `food.srv1099441.hstgr.cloud`. The `/mcp` block in `deploy/nginx.conf` is only for the (unused) standalone-Nginx template.
- **Deploying API changes**: the container is plain `node:20-alpine` bind-mounting `/opt/food-list-api` read-only. Copy `server/{index.js,mcp.js,package.json,package-lock.json}` there, run `npm install --omit=dev` on the host, then `sudo docker compose -f /root/docker-compose.yml --project-directory /root up -d food-list-api`.
- Stateless transport: a fresh MCP server instance per request, no session store. GET/DELETE on `/mcp` return 405 by design.
- `photoRef` is stripped from all responses (large Google Places blob, useless to an LLM).

## Local smoke test

```sh
ADMIN_PASSWORD=x DATA_FILE=$PWD/public/restaurants.json PORT=3999 node server/index.js
# then, e.g.:
npx @modelcontextprotocol/inspector   # connect to http://localhost:3999/mcp
```
