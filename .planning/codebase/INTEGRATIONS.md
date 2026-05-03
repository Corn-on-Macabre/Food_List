# External Integrations

**Analysis Date:** 2026-04-18

## APIs & External Services

**Google Maps (Multiple APIs):**
- Google Maps JavaScript API - Core map rendering and marker display
  - SDK/Client: `@vis.gl/react-google-maps` (React wrapper), browser global `google.maps`
  - Auth: `VITE_GOOGLE_MAPS_API_KEY` (env var, injected via Vite)
  - Restriction: Key must be restricted to your production domain in Google Cloud Console

- Google Places API (New) - Autocomplete, place details, and enrichment
  - Autocomplete: `google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions()` in `src/hooks/usePlacesAutocomplete.ts`
  - Place Details: `google.maps.places.Place` API in `src/hooks/usePlaceDetails.ts`
  - Enrichment: `places.googleapis.com/v1/places:searchText` (server-side in `server/index.js`)
  - Auth: `VITE_GOOGLE_MAPS_API_KEY` (frontend), `GOOGLE_API_KEY` env var (backend enrichment)
  - Usage: Kitchen autocomplete in admin panel, restaurant details fetching, metadata enrichment (rating, price level, photos)

- Google Geocoding API (implicit via Places)
  - Used for: Address-to-coordinates conversion in `src/hooks/useAddressGeocode.ts`
  - Auth: Via `VITE_GOOGLE_MAPS_API_KEY`

- Google Photos (via Place Photos)
  - Usage: Restaurant photo display via `photoRef` field (Places photo resource name)
  - URL format: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=[PHOTO_REF]&key=[API_KEY]`

## Data Storage

**Static Data:**
- File system: `public/restaurants.json` (bundled with SPA)
  - Frontend reads via `fetch('/restaurants.json')` in `src/hooks/useRestaurants.ts`
  - No caching (Nginx configured with `Cache-Control: no-cache`)
  - Current size: ~540KB (~200 restaurants with enrichment data)

**Backend Persistence:**
- File system: `/var/www/food-list/restaurants.json` (or `DATA_FILE` env var)
  - Served by Express at `GET /api/restaurants` (requires auth)
  - Written to via `PUT /api/restaurants/:id` and `POST /api/restaurants` (requires auth)
  - Write strategy: Atomic (write to `.tmp` file, then `rename()`)
  - No concurrent write protection beyond flag-based locking

**Caching:**
- None (no Redis, no cache layer)
- Frontend relies on static JSON fetch; server re-reads from disk on each API call

## Authentication & Identity

**Admin Dashboard Auth:**
- Custom implementation (no OAuth, no third-party provider)
- Method: Bearer token via Authorization header
- Token source: `VITE_ADMIN_PASSWORD` (frontend env var) or `ADMIN_PASSWORD` (server env var)
- Implementation: `src/contexts/AdminAuthContext.tsx` manages session state
- Password validation: Server checks `Authorization: Bearer [password]` against `process.env.ADMIN_PASSWORD`
- No user management (single curator, no multiple accounts)

**Public Map:**
- No authentication required
- Anyone can view restaurants and filter by cuisine/tier/distance
- Admin panel accessible only with password

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, no error reporting service)
- Frontend errors logged to browser console only
- Backend errors logged to stdout (captured by Docker/systemd)

**Logging:**
- Frontend: `console.log()` for development (implicit in test mocks)
- Backend: `console.log()` for enrichment pipeline progress, error messages to stderr
- No structured logging, no log aggregation

**Health Checks:**
- `GET /api/health` endpoint in `server/index.js` (no auth required)
- Returns: `{ status: 'ok', count: [restaurant_count] }`

## CI/CD & Deployment

**Hosting:**
- VPS: `food-list-vps:/var/www/food-list/` (hostname, implies Hetzner or similar)
- Web server: Nginx with SSL/TLS (config in `deploy/nginx.conf`)
- Application servers:
  - Frontend SPA: Nginx serving `dist/` directory
  - Backend API: Express.js on port 3001 (proxied by Nginx)

**Build Pipeline:**
- No automated CI/CD detected (no GitHub Actions, GitLab CI, etc.)
- Manual deployment via `npm run build && rsync` script in `deploy.sh`
- Build command: `tsc -b && vite build` (type-check first, then bundle)
- Vite output: `dist/` directory (hashed JS/CSS, `index.html`)

**Docker:**
- Backend containerization: `server/Dockerfile` (Node 20-alpine)
  - Image: `node:20-alpine`
  - Entry point: `node index.js`
  - Exposed port: 3001
  - Does NOT include frontend (frontend served separately via Nginx)

**Deployment Artifact:**
- Frontend: `rsync -avz --delete dist/ food-list-vps:/var/www/food-list/`
- Backend: Docker image (built separately, pushed to registry or deployed via `docker-compose`)

## Environment Configuration

**Required env vars:**
- `VITE_GOOGLE_MAPS_API_KEY` - Frontend map rendering and Places API access
- `ADMIN_PASSWORD` - Server-side API authentication token

**Optional env vars:**
- `VITE_GOOGLE_MAPS_PLACES_API_KEY` - Separate Places API key (uses `VITE_GOOGLE_MAPS_API_KEY` if omitted)
- `VITE_ADMIN_PASSWORD` - Frontend admin password (if using local fallback)
- `VITE_API_URL` - Backend API base URL (defaults to `/api`)
- `PORT` - Server port (defaults to 3001)
- `DATA_FILE` - Path to `restaurants.json` (defaults to `/var/www/food-list/restaurants.json`)
- `GOOGLE_API_KEY` - Server-side Google API key for enrichment (if `GOOGLE_API_KEY` not set, enrichment disabled)

**Secrets location:**
- `.env` file (local development, not committed to git)
- VPS environment variables (set via systemd service or docker-compose)
- Google Cloud API keys (restricted to domain in Console)

**Build-time vs Runtime:**
- `VITE_*` variables: Inlined at build time (available in `src/vite-env.d.ts`)
- `NODE_*`, `PORT`, `DATA_FILE`, `ADMIN_PASSWORD`, `GOOGLE_API_KEY`: Runtime env vars (Express only)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected
- Places API enrichment is one-way HTTP POST (not a webhook)

## Rate Limiting & Quotas

**Google Places API:**
- Autocomplete: Standard quota per API key
- Place Details: Standard quota per API key
- Search Text (enrichment): Standard quota, called asynchronously (non-blocking)

**Backend:**
- No rate limiting on REST endpoints (no `express-rate-limit` or similar)
- File I/O: Concurrent write protection via `writing` flag (prevents simultaneous writes)

## Data Privacy & Compliance

**No data collected from users:**
- Public map is read-only (no analytics, no tracking)
- Admin panel is password-protected (no user accounts)
- All restaurant data is manually curated in `restaurants.json`

**Google API usage:**
- Places data (rating, price, photos) stored locally in `restaurants.json`
- No personal data sent to Google (searches are anonymized per Places API terms)

## Dependencies at Risk

**Google Places API:**
- Risk: Google could deprecate or change pricing model
- Mitigation: Currently using new API (`AutocompleteSuggestion`, `Place`), not legacy
- Fallback: Manual entry available in admin panel if API unavailable

**Node.js 20 Alpine:**
- Risk: EOL in 2026 (currently stable)
- Plan: Upgrade to Node 22 or 24 as needed

---

*Integration audit: 2026-04-18*
