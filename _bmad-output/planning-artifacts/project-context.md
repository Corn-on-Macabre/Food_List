# Food_List — Project Context

Condensed reference for subagents. Read this instead of re-reading all BMAD artifacts.

## What This Is
A map-based restaurant curation web app for the Phoenix metro area. One curator (Rhunnicutt) maintains a list of 150-200 restaurants across three confidence tiers. Users open a single URL, see a map with color-coded pins, filter by cuisine/distance, and click through to Google Maps.

## Project Root
`/Users/rhunnicutt/Food_List` — app code lives directly here, not in a subfolder.

## Tech Stack
| Layer | Choice |
|---|---|
| Framework | React 18 + Vite + TypeScript (strict) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| Maps | `@vis.gl/react-google-maps` (official Google wrapper) |
| Data | `public/restaurants.json` — static JSON, ~200 records |
| Hosting | Nginx on VPS, deploy via `rsync dist/` |
| Env vars | `VITE_GOOGLE_MAPS_API_KEY` |

## Data Model
```typescript
type Tier = "loved" | "recommended" | "on_my_radar";

interface Restaurant {
  id: string;           // slug e.g. "pho-43"
  name: string;
  tier: Tier;
  cuisine: string;
  lat: number;
  lng: number;
  notes?: string;
  googleMapsUrl: string;
  source?: string;
  dateAdded: string;    // YYYY-MM-DD
}

interface FilterState {
  cuisine: string | null;
  maxDistance: number | null;  // miles, null = any
}
```

## Tier Colors
| Tier | Color | Hex |
|---|---|---|
| loved | Gold | `#F59E0B` |
| recommended | Blue | `#3B82F6` |
| on_my_radar | Green | `#10B981` |

## Source Structure
```
src/
  components/
    Map.tsx           # Google Map + pins
    FilterBar.tsx     # Cuisine dropdown + distance slider
    RestaurantCard.tsx # Detail card on pin click
    PinLegend.tsx     # Tier color legend overlay
  hooks/
    useGeolocation.ts # Browser geolocation wrapper
    useRestaurants.ts # Load + filter restaurant data
  types/
    restaurant.ts     # Restaurant, Tier, FilterState
  utils/
    distance.ts       # Haversine distance calculation
    filters.ts        # Filter logic
  App.tsx             # Root component
  main.tsx            # Vite entry
  index.css           # Tailwind directives
public/
  restaurants.json    # Restaurant data (curator maintains)
```

## Map Setup
Phoenix metro default center: `{ lat: 33.4484, lng: -112.0740 }`, zoom 11.
If geolocation granted → re-center on user. If denied → stay on Phoenix default, hide distance filter.

## Filtering Architecture
- All filtering is client-side (200 records, <1ms)
- `useRestaurants(allRestaurants, filters, userLocation)` returns filtered subset
- Haversine distance in `src/utils/distance.ts`
- Cuisine options derived from loaded data (no hardcoded list)

## MVP Scope (Epics 1-3)
- Epic 1: Map renders, pins display, geolocation, legend, responsive layout, deployment
- Epic 2: Pin click → detail card → Google Maps link → dismiss
- Epic 3: Cuisine filter + distance filter + combined + clear all

## Growth Phase (Epics 4-5, deferred)
- Epic 4: Curator dashboard with Google Places auto-fill, password-protected `/admin` route
- Epic 5: Google Places enrichment (ratings, photos, price level)

## GitHub
- Repo: `https://github.com/Corn-on-Macabre/Food_List`
- Remote: `origin`
- Branch: `main`

## BMAD Artifacts
- Sprint status: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Story files: `_bmad-output/implementation-artifacts/{story-key}.md`
- Epics: `_bmad-output/planning-artifacts/epics.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
