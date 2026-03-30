# Story 1.2: Restaurant Data Loading & Pin Display

Status: done

## Story

As a user,
I want to see all curated restaurants displayed as color-coded pins on the map,
so that I can visually identify restaurant tiers and density at a glance.

## Acceptance Criteria

1. **Given** the app has loaded the Google Map **When** `restaurants.json` is fetched successfully **Then** every restaurant in the dataset renders as an `AdvancedMarker` pin on the map at its lat/lng coordinates **And** Loved restaurants display as gold (#F59E0B) pins **And** Recommended restaurants display as blue (#3B82F6) pins **And** On My Radar restaurants display as green (#10B981) pins.

2. **Given** the dataset contains ~200 restaurants **When** all pins are rendered **Then** the map with all pins renders in under 3 seconds on a standard 4G connection (NFR1) **And** there is no perceptible lag when zooming or panning (NFR5).

3. **Given** the `restaurants.json` file fails to load **When** the fetch returns an error **Then** the user sees a friendly error message indicating data could not be loaded.

4. **Given** the TypeScript data model **When** a restaurant record is loaded **Then** it conforms to the `Restaurant` interface with required fields: id, name, tier, cuisine, lat, lng, googleMapsUrl, dateAdded **And** optional fields: notes, source.

## Tasks / Subtasks

### Group A: Sample Data & Type Validation (AC: 4)

- [x] Create `public/restaurants.json` with representative sample data (AC: 4)
  - [x] Include at least 10 sample restaurants spread across Phoenix metro area
  - [x] Cover all three tiers: loved, recommended, on_my_radar (at least 3 per tier)
  - [x] Include a mix of cuisine types (Mexican, American, Japanese, Italian, Thai, etc.)
  - [x] Include some records with optional `notes` and `source` fields, some without
  - [x] All records must satisfy the `Restaurant` interface shape (id, name, tier, cuisine, lat, lng, googleMapsUrl, dateAdded)
  - [x] Use realistic Phoenix metro lat/lng coordinates (lat ~33.4, lng ~-112.0 range)
  - [x] Verify JSON is valid (no trailing commas, correct types)

### Group B: `useRestaurants` Custom Hook (AC: 3, 4)

- [x] Create `src/hooks/useRestaurants.ts` (AC: 3, 4)
  - [x] Define the hook return type with: `restaurants: Restaurant[]`, `loading: boolean`, `error: string | null`
  - [x] On mount, `fetch('/restaurants.json')` — path resolves from Vite's public/ directory at runtime
  - [x] Parse response JSON and assert type as `Restaurant[]`
  - [x] Set `loading: true` before fetch, `loading: false` after (success or failure)
  - [x] On fetch failure or non-OK response, set `error` to a user-friendly string (e.g., "Failed to load restaurant data. Please refresh the page.")
  - [x] On success, set `restaurants` to the parsed array, `error` to `null`
  - [x] Use `useEffect` with empty dependency array so fetch runs once on mount
  - [x] No external dependencies — plain `fetch` only
- [x] Create `src/hooks/index.ts` re-exporting `useRestaurants`

### Group C: `RestaurantPin` Component (AC: 1, 2)

- [x] Create `src/components/RestaurantPin.tsx` (AC: 1, 2)
  - [x] Accept props: `restaurant: Restaurant`
  - [x] Import `AdvancedMarker` and `Pin` from `@vis.gl/react-google-maps`
  - [x] Render `<AdvancedMarker position={{ lat: restaurant.lat, lng: restaurant.lng }}>` as the outer wrapper
  - [x] Nest `<Pin background={TIER_COLORS[restaurant.tier]} glyphColor="#FFFFFF" borderColor={TIER_COLORS[restaurant.tier]} />` inside `AdvancedMarker`
  - [x] Import tier color constants from `src/constants/tierColors.ts` (create in this task)
- [x] Create `src/constants/tierColors.ts`
  - [x] Export `TIER_COLORS` as a `Record<Tier, string>` with values: `loved: "#F59E0B"`, `recommended: "#3B82F6"`, `on_my_radar: "#10B981"`
- [x] Create `src/components/index.ts` re-exporting `RestaurantPin`

### Group D: Wire Up in `App.tsx` (AC: 1, 2, 3)

- [x] Update `src/App.tsx` to render pins and handle error state (AC: 1, 2, 3)
  - [x] Import `useRestaurants` from `src/hooks`
  - [x] Import `RestaurantPin` from `src/components`
  - [x] Call `useRestaurants()` to get `{ restaurants, loading, error }`
  - [x] Render `RestaurantPin` components inside the `<Map>` component for each restaurant (map over `restaurants`)
  - [x] Use `restaurant.id` as the React `key` prop on each `RestaurantPin`
  - [x] Show a loading indicator when `loading === true` (a minimal overlay or spinner is fine — Tailwind classes)
  - [x] Show a friendly error overlay when `error !== null` — e.g., a centered card reading "Could not load restaurant data. Please refresh the page." — styled consistently with the existing API key error state
  - [x] Keep the map visible behind the loading/error overlay (do not conditionally unmount the Map)

### Group E: Tests (AC: 1, 3, 4)

- [x] Write tests for `useRestaurants` hook in `src/hooks/useRestaurants.test.ts` (AC: 3, 4)
  - [x] Mock `global.fetch` using `vitest.fn()` / `vi.spyOn(global, 'fetch')`
  - [x] Test: successful fetch → `restaurants` populated, `loading: false`, `error: null`
  - [x] Test: failed fetch (network error) → `restaurants: []`, `loading: false`, `error` is a non-empty string
  - [x] Test: non-OK HTTP response (e.g., 404) → `error` is set, `restaurants` stays empty
  - [x] Test: `loading` is `true` while fetch is pending (check state before resolution)
- [x] Write a smoke test for `RestaurantPin` in `src/components/RestaurantPin.test.tsx` (AC: 1)
  - [x] Mock `@vis.gl/react-google-maps` `AdvancedMarker` and `Pin` as simple passthrough components
  - [x] Test: renders without crashing given a valid `Restaurant` prop for each tier
  - [x] Test: passes the correct `background` color to `Pin` for each of the three tiers (loved/recommended/on_my_radar)
- [x] Configure Vitest environment if not already done
  - [x] Confirm `vitest.config.ts` or `vite.config.ts` has `test: { environment: 'jsdom' }` (vitest is already in package.json)
  - [x] Confirm `@testing-library/react` and `jsdom` are present in devDependencies (already installed per package.json)

## Dev Notes

### File Structure for This Story

```
src/
  constants/
    tierColors.ts          # TIER_COLORS record — created in Group C
  hooks/
    useRestaurants.ts      # Custom fetch hook — created in Group B
    useRestaurants.test.ts # Hook tests — created in Group E
    index.ts               # Re-exports
  components/
    RestaurantPin.tsx      # AdvancedMarker wrapper — created in Group C
    RestaurantPin.test.tsx # Component tests — created in Group E
    index.ts               # Re-exports
public/
  restaurants.json         # Static data file served by Vite — created in Group A
```

### Existing Types (do NOT redefine)

`src/types/restaurant.ts` is already complete from Story 1.1:

```typescript
export type Tier = "loved" | "recommended" | "on_my_radar";

export interface Restaurant {
  id: string;           // URL-safe slug (e.g., "pho-43")
  name: string;
  tier: Tier;
  cuisine: string;
  lat: number;
  lng: number;
  notes?: string;
  googleMapsUrl: string;
  source?: string;
  dateAdded: string;    // ISO date string YYYY-MM-DD
}
```

### `@vis.gl/react-google-maps` API (v1.8.1 installed)

**Imports:**
```typescript
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
```

**AdvancedMarker props (relevant):**
- `position: { lat: number; lng: number }` — required, sets map position
- Children are rendered as the marker's visual content

**Pin props (relevant for tier coloring):**
- `background?: string` — fill color of the pin bubble (use tier hex)
- `glyphColor?: string` — color of the glyph/icon inside the pin (use `"#FFFFFF"` for white)
- `borderColor?: string` — border/outline color (use tier hex to match background)

**Working example for a RestaurantPin:**
```tsx
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { TIER_COLORS } from '../constants/tierColors';
import type { Restaurant } from '../types';

interface RestaurantPinProps {
  restaurant: Restaurant;
}

export function RestaurantPin({ restaurant }: RestaurantPinProps) {
  const color = TIER_COLORS[restaurant.tier];
  return (
    <AdvancedMarker position={{ lat: restaurant.lat, lng: restaurant.lng }}>
      <Pin background={color} glyphColor="#FFFFFF" borderColor={color} />
    </AdvancedMarker>
  );
}
```

**Critical:** `AdvancedMarker` requires a `mapId` to be set on the parent `<Map>` component. This is already done in `App.tsx` from Story 1.1: `mapId="food-list-map"`. Do NOT remove or change `mapId`.

**Render AdvancedMarkers inside the Map:** `RestaurantPin` components must be rendered as children of `<Map>` (not siblings). Example:
```tsx
<Map ...>
  {restaurants.map(r => <RestaurantPin key={r.id} restaurant={r} />)}
</Map>
```

### Tier Color Constants

```typescript
// src/constants/tierColors.ts
import type { Tier } from '../types';

export const TIER_COLORS: Record<Tier, string> = {
  loved: '#F59E0B',       // gold
  recommended: '#3B82F6', // blue
  on_my_radar: '#10B981', // green
};
```

These values are canonical — they match the epics.md spec, the CLAUDE.md project instructions, and will be reused in the legend (Story 1.3) and detail card (Story 2.1).

### `useRestaurants` Hook Pattern

```typescript
// src/hooks/useRestaurants.ts
import { useState, useEffect } from 'react';
import type { Restaurant } from '../types';

interface UseRestaurantsResult {
  restaurants: Restaurant[];
  loading: boolean;
  error: string | null;
}

export function useRestaurants(): UseRestaurantsResult {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/restaurants.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Restaurant[]>;
      })
      .then(data => {
        setRestaurants(data);
        setError(null);
      })
      .catch(() => {
        setError('Failed to load restaurant data. Please refresh the page.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { restaurants, loading, error };
}
```

### Sample `restaurants.json` Structure

Each record must match the `Restaurant` interface. Example record:

```json
{
  "id": "tacos-el-patron",
  "name": "Tacos El Patrón",
  "tier": "loved",
  "cuisine": "Mexican",
  "lat": 33.4484,
  "lng": -112.0740,
  "googleMapsUrl": "https://maps.google.com/?q=Tacos+El+Patron+Phoenix+AZ",
  "notes": "Best al pastor in Phoenix. Get there early.",
  "source": "Friend Dave",
  "dateAdded": "2026-01-15"
}
```

The JSON file should be an array: `[ { ... }, { ... } ]`

Coordinates for Phoenix metro restaurants should fall roughly in these ranges:
- lat: 33.3 – 33.7
- lng: -112.3 – -111.7

### Performance Note (NFR1, NFR5)

200 `AdvancedMarker` components at ~200 records is well within the Google Maps JavaScript API limits. No virtualization or clustering is needed for MVP. The `@vis.gl/react-google-maps` library handles the rendering lifecycle. Do not add marker clustering in this story — that is a potential future optimization.

### Vitest Configuration

`vitest` and `jsdom` are already in `devDependencies` (confirmed in `package.json`). Ensure `vite.config.ts` includes the test block:

```typescript
// vite.config.ts additions
import { defineConfig } from 'vite';
// ...
export default defineConfig({
  // existing config...
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'], // optional — add if @testing-library/jest-dom matchers needed
  },
});
```

If a `src/test/setup.ts` is created, add: `import '@testing-library/jest-dom';`

### Mocking fetch in Vitest

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetAllMocks();
});

it('loads restaurants on mount', async () => {
  const mockData = [/* Restaurant objects */];
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => mockData,
  } as Response);
  // ... renderHook and assertions
});
```

Use `renderHook` from `@testing-library/react` to test the hook.

### Project Structure Notes

- `public/restaurants.json` is served as a static file by Vite's dev server at the path `/restaurants.json`. At production build time, Vite copies `public/` contents to `dist/`. No import or bundling needed — plain `fetch` works.
- `src/hooks/` and `src/components/` directories do not yet exist — create them.
- `src/constants/` directory does not yet exist — create it.
- TypeScript strict mode is active. The `Restaurant[]` cast from `res.json()` is acceptable in this story since we control the data source. Add a `// eslint-disable-next-line` comment if the linter flags it, or use a type predicate if preferred.
- The `App.tsx` import of `useRestaurants` and `RestaurantPin` should use path aliases or relative imports consistent with the existing `App.tsx` style (`'./hooks'`, `'./components'`).

### References

- Epic 1, Story 1.2: `_bmad-output/planning-artifacts/epics.md` — full ACs
- Story 1.1 completed file: `_bmad-output/implementation-artifacts/1-1-project-setup-and-google-map-display.md` — scaffolding context
- CLAUDE.md: Tier color constants, tech stack constraints, no-other-maps-library rule
- NFR1 (3s render), NFR5 (no pan lag): `_bmad-output/planning-artifacts/epics.md` — Requirements Inventory
- `@vis.gl/react-google-maps` v1.8.1 type defs: `node_modules/@vis.gl/react-google-maps/dist/index.d.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Group A complete (2026-03-27): Created `public/restaurants.json` with 15 sample restaurants across Phoenix metro. Covers all three tiers (5 loved, 6 recommended, 4 on_my_radar), 8 cuisine types (Mexican, Japanese, Italian, American, Vietnamese, Thai, Indian, Mediterranean). Mix of records with and without optional `notes`/`source` fields. All records validated against the `Restaurant` interface — zero schema issues. Coordinates verified within Phoenix metro bounds (lat 33.3–33.7, lng -112.3 to -111.7).
- Group B complete (2026-03-27): Created `src/hooks/useRestaurants.ts` and `src/hooks/index.ts`. Hook fetches `/restaurants.json` on mount with full loading/error state management. No external dependencies — plain `fetch` only. Types import cleanly from `../types` (re-exported via `src/types/index.ts`).
- Group C complete (2026-03-27): Created `src/constants/tierColors.ts`, `src/components/RestaurantPin.tsx`, and `src/components/index.ts`. All files pass `tsc --noEmit` with zero errors.
- Group E complete (2026-03-27): Created `src/hooks/useRestaurants.test.ts` (4 tests: successful load, network failure, non-OK HTTP, initial loading state) and `src/components/RestaurantPin.test.tsx` (6 tests: render without crash for each tier, correct background color for each tier). Mocked `global.fetch` via `vi.spyOn` and `@vis.gl/react-google-maps` via `vi.mock`. All 13 tests across 3 test files pass (vitest run, 1.01s).
- Group D complete (2026-03-27): Updated `src/App.tsx` to import and call `useRestaurants`, render `RestaurantPin` as children of `<Map>` keyed by `restaurant.id`, and show absolute-positioned overlays for loading and error states (white card, Tailwind-styled, consistent with existing API key error). Map is never conditionally unmounted — overlays sit on top via `position: absolute`. API key guard logic preserved unchanged. `tsc -b && vite build` passes with zero errors.

### File List

- public/restaurants.json
- src/hooks/useRestaurants.ts
- src/hooks/index.ts
- src/hooks/useRestaurants.test.ts
- src/constants/tierColors.ts
- src/components/RestaurantPin.tsx
- src/components/index.ts
- src/components/RestaurantPin.test.tsx
- src/App.tsx (modified)

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-03-27 | Bob (SM) | Story file created, status set to ready-for-dev |
