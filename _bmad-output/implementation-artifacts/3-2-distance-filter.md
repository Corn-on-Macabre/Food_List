# Story 3.2: Distance Filter

Status: done

## Story

As a user,
I want to filter restaurants by distance from my location,
so that I can find places that are close enough to get to right now.

## Acceptance Criteria

1. **Given** the user has granted geolocation permission and `coords` is non-null **When** the `FilterBar` renders **Then** a distance filter section is visible below the cuisine chips, showing preset distance chips: "Any", "5 mi", "10 mi", "20 mi", "30 mi".

2. **Given** the user clicks a distance chip (e.g., "10 mi") **When** the filter is applied **Then** only restaurants within 10 miles of the user's current coordinates remain visible on the map, using Haversine distance calculated in `src/utils/distance.ts`, and the map updates in under 100ms (NFR2).

3. **Given** the user clicks a distance chip that is already active **When** the chip is re-clicked **Then** the distance filter clears (same as clicking "Any") and all restaurants reappear (subject to any active cuisine filter).

4. **Given** the user clicks "Any" **When** no distance chip is active **Then** the "Any" chip is in the active (amber) state and distance filtering is disabled.

5. **Given** `geoDenied === true` (user denied permission) **When** the `FilterBar` renders **Then** the entire distance filter row is not rendered — only the cuisine chips are shown. No error message is displayed.

6. **Given** `coords === null && geoDenied === false` (geolocation still loading or browser does not support it) **When** the `FilterBar` renders **Then** the distance filter row is not rendered. The cuisine chips remain fully functional.

7. **Given** a distance chip is active **When** `coords` becomes null (e.g., permission revoked mid-session) **Then** `maxDistance` resets to null and the distance row is hidden.

8. **Given** both cuisine and distance filters are active **When** the map renders **Then** only restaurants matching BOTH the selected cuisine AND within the specified distance are shown — combined `&&` logic.

## Tasks / Subtasks

### Task Group A — Utility (no dependencies; can start immediately)

- [x] **Task A1:** Create `src/utils/distance.ts` — Haversine formula utility
  - [x] Create the directory `src/utils/` and file `distance.ts`
  - [x] Export a pure function with this exact signature:
    ```typescript
    /**
     * Calculate the great-circle distance between two lat/lng coordinates
     * using the Haversine formula. Returns distance in miles.
     */
    export function haversineDistance(
      lat1: number,
      lng1: number,
      lat2: number,
      lng2: number
    ): number
    ```
  - [x] Implement using Earth radius = 3958.8 miles (mean radius):
    ```
    const R = 3958.8;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
    ```
  - [x] Include a private `toRad` helper: `const toRad = (deg: number): number => (deg * Math.PI) / 180;`
  - [x] Export a `DISTANCE_OPTIONS` constant for use in `FilterBar`:
    ```typescript
    export const DISTANCE_OPTIONS: ReadonlyArray<{ label: string; miles: number }> = [
      { label: '5 mi',  miles: 5  },
      { label: '10 mi', miles: 10 },
      { label: '20 mi', miles: 20 },
      { label: '30 mi', miles: 30 },
    ] as const;
    ```
  - [x] Export from `src/utils/index.ts` (create the file):
    ```typescript
    export { haversineDistance, DISTANCE_OPTIONS } from './distance';
    ```

- [x] **Task A2:** Write unit tests for `haversineDistance` — create `src/utils/distance.test.ts`
  - [x] Test: same point returns 0 miles
  - [x] Test: Phoenix center (33.4484, -112.0740) to Scottsdale (33.4942, -111.9261) ≈ 9.7 miles (assert within ±0.5)
  - [x] Test: Phoenix center to Tempe (33.4255, -111.9400) ≈ 8.7 miles (assert within ±0.5)
  - [x] Test: returns a positive number for any two distinct non-antipodal points
  - [x] Test: `DISTANCE_OPTIONS` has exactly 4 entries with miles values [5, 10, 20, 30]

### Task Group B — FilterBar extension (depends on A1 completing)

- [x] **Task B1:** Extend `FilterBar` props interface (in `src/components/FilterBar.tsx`)
  - [x] Add new props to `FilterBarProps` (extend, do NOT remove existing props):
    ```typescript
    interface FilterBarProps {
      cuisines: string[];
      activeCuisine: string | null;
      onCuisineChange: (cuisine: string | null) => void;
      // Story 3.2 additions:
      userCoords: { lat: number; lng: number } | null;
      geoDenied: boolean;
      activeDistance: number | null;
      onDistanceChange: (miles: number | null) => void;
    }
    ```
  - [x] All new props are required (no optionals) — forces call sites to be explicit
  - [x] Update the destructuring in the function signature

- [x] **Task B2:** Implement distance chip row in `FilterBar`
  - [x] Import `DISTANCE_OPTIONS` from `../utils`
  - [x] Determine visibility: `const showDistanceFilter = !geoDenied && userCoords !== null;`
  - [x] When `showDistanceFilter` is false, render nothing for the distance section (no `<div>`, no disabled state — pure conditional omission)
  - [x] When `showDistanceFilter` is true, render a second chip row below the cuisine row:
    ```tsx
    <div
      className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide"
      role="group"
      aria-label="Filter by distance"
    >
      {/* "Any" chip */}
      <button
        className={`${chipBase} ${activeDistance === null ? chipActive : chipInactive}`}
        aria-pressed={activeDistance === null}
        onClick={() => onDistanceChange(null)}
      >
        Any
      </button>
      {DISTANCE_OPTIONS.map(({ label, miles }) => {
        const isActive = activeDistance === miles;
        return (
          <button
            key={miles}
            className={`${chipBase} ${isActive ? chipActive : chipInactive}`}
            aria-pressed={isActive}
            onClick={() => onDistanceChange(isActive ? null : miles)}
          >
            {label}
          </button>
        );
      })}
    </div>
    ```
  - [x] Reuse existing `chipBase`, `chipActive`, `chipInactive` CSS class constants — no new class strings
  - [x] Toggle behavior: clicking an active distance chip calls `onDistanceChange(null)` (same toggle pattern as cuisine chips)
  - [x] Accessibility: `role="group"`, `aria-label="Filter by distance"`, `aria-pressed` on each button

### Task Group C — App.tsx wiring (depends on A1 and B1 completing)

- [x] **Task C1:** Update `filteredRestaurants` memo in `AppWithMap` to include distance filtering
  - [x] Remove the `void geoDenied;` no-op line
  - [x] Import `haversineDistance` from `./utils`
  - [x] Update the `filteredRestaurants` `useMemo` to apply both filters:
    ```typescript
    const filteredRestaurants = useMemo(
      () =>
        restaurants.filter((r) => {
          if (filters.cuisine && r.cuisine !== filters.cuisine) return false;
          if (filters.maxDistance !== null && coords !== null) {
            const dist = haversineDistance(coords.lat, coords.lng, r.lat, r.lng);
            if (dist > filters.maxDistance) return false;
          }
          return true;
        }),
      [restaurants, filters.cuisine, filters.maxDistance, coords]
    );
    ```
  - [x] `coords` is already in scope from `useGeolocation()` destructuring — add it to the dependency array
  - [x] When `coords` is null, distance filter is a no-op (restaurants pass through) — matches AC 6

- [x] **Task C2:** Reset `maxDistance` when geolocation is denied or lost
  - [x] Add a `useEffect` to handle the `geoDenied → reset` case:
    ```typescript
    useEffect(() => {
      if (geoDenied && filters.maxDistance !== null) {
        setFilters(f => ({ ...f, maxDistance: null }));
      }
    }, [geoDenied, filters.maxDistance]);
    ```
  - [x] This satisfies AC 7 (coords becomes unavailable → filter resets)

- [x] **Task C3:** Pass new props to `FilterBar` in `App.tsx` render
  - [x] Update the `<FilterBar>` JSX to include the four new props:
    ```tsx
    <FilterBar
      cuisines={cuisines}
      activeCuisine={filters.cuisine}
      onCuisineChange={(cuisine) => setFilters(f => ({ ...f, cuisine }))}
      userCoords={coords}
      geoDenied={geoDenied}
      activeDistance={filters.maxDistance}
      onDistanceChange={(miles) => setFilters(f => ({ ...f, maxDistance: miles }))}
    />
    ```
  - [x] Verify TypeScript strict-mode compilation — no `any`, all props typed

- [x] **Task C4:** Create `src/utils/index.ts` export file (if not done in A1)
  - [x] `export { haversineDistance, DISTANCE_OPTIONS } from './distance';`

### Task Group D — Tests (depends on A1, B1, B2, C1 completing; can parallel with each other)

- [ ] **Task D1:** Update `FilterBar` unit tests in `src/components/FilterBar.test.tsx`
  - [ ] All existing cuisine chip tests must still pass — only add to the file, do NOT remove tests
  - [ ] Add shared props factory to reduce boilerplate:
    ```typescript
    const defaultProps = {
      cuisines: ['Japanese', 'Mexican'],
      activeCuisine: null,
      onCuisineChange: vi.fn(),
      userCoords: { lat: 33.4484, lng: -112.0740 },
      geoDenied: false,
      activeDistance: null,
      onDistanceChange: vi.fn(),
    };
    ```
  - [ ] Test: "distance row is hidden when geoDenied is true" — render with `geoDenied: true`, assert distance chip buttons are not in the document (AC 5)
  - [ ] Test: "distance row is hidden when userCoords is null" — render with `userCoords: null`, assert no distance chips (AC 6)
  - [ ] Test: "distance row renders Any + 4 preset chips when coords available" — AC 1
  - [ ] Test: "clicking a distance chip calls onDistanceChange with that miles value" — AC 2
  - [ ] Test: "clicking active distance chip calls onDistanceChange with null" — AC 3
  - [ ] Test: "clicking Any chip calls onDistanceChange with null" — AC 4
  - [ ] Test: "Any chip is aria-pressed=true when activeDistance is null" — AC 4
  - [ ] Test: "distance chip for 10 mi has aria-pressed=true when activeDistance is 10" — AC 2

- [ ] **Task D2:** Create `src/utils/distance.test.ts` (this is Task A2 — listed here for parallelism tracking)
  - [ ] (See A2 for full list — do not duplicate work)

- [ ] **Task D3:** Integration tests — update `src/test/FilterIntegration.test.tsx`
  - [ ] Update all existing `useGeolocation` mock calls to include the new mock shape (ensure no existing tests break from prop signature change)
  - [ ] Add describe block: "Distance filter integration (AC 2, 5, 6, 8)"
  - [ ] Test fixture: 3 restaurants — one at 3 mi from Phoenix center, one at 8 mi, one at 25 mi
    ```typescript
    // Use real Phoenix coords offset for predictable haversine results
    // ~3 mi north:  33.4919, -112.0740
    // ~8 mi east:   33.4484, -111.9534
    // ~25 mi south: 33.2148, -112.0740
    const mockRestaurants: Restaurant[] = [
      { id: 'r-near',   name: 'Near Place',   tier: 'loved',         cuisine: 'American', lat: 33.4919, lng: -112.0740, googleMapsUrl: 'https://maps.google.com/', dateAdded: '2024-01-01' },
      { id: 'r-mid',    name: 'Mid Place',    tier: 'recommended',   cuisine: 'Japanese', lat: 33.4484, lng: -111.9534, googleMapsUrl: 'https://maps.google.com/', dateAdded: '2024-01-01' },
      { id: 'r-far',    name: 'Far Place',    tier: 'on_my_radar',   cuisine: 'Mexican',  lat: 33.2148, lng: -112.0740, googleMapsUrl: 'https://maps.google.com/', dateAdded: '2024-01-01' },
    ];
    ```
  - [ ] Mock `useGeolocation` to return `{ coords: { lat: 33.4484, lng: -112.0740 }, loading: false, denied: false }`
  - [ ] Test: "when denied=true, distance chips do not appear in the DOM" (AC 5)
  - [ ] Test: "when coords=null and denied=false, distance chips do not appear" (AC 6)
  - [ ] Test: "filtering by 5 mi with Phoenix center coords shows only the near restaurant" — click '5 mi' chip, assert 1 pin visible (AC 2)
  - [ ] Test: "filtering by 10 mi shows near and mid restaurants but not far" (AC 2)
  - [ ] Test: "combined cuisine + distance filter — Japanese within 10 mi shows only mid" (AC 8)
  - [ ] Test: "clearing distance chip with Any restores all pins" (AC 4)

- [ ] **Task D4:** Update `src/test/App.test.tsx` baseline
  - [ ] Add the new required `FilterBar` props (`userCoords`, `geoDenied`, `activeDistance`, `onDistanceChange`) to any `FilterBar` mock render calls or snapshot helpers
  - [ ] Verify all 69 existing tests still pass after prop signature change
  - [ ] Add one smoke test: `FilterBar` with `geoDenied: false` and coords renders distance chips; with `geoDenied: true` does not

## Dev Notes

### Architecture Context

Epics 1 and 2 are done. Story 3.1 (Cuisine Filter) is done. Current `App.tsx` state:

```
AppWithMap holds:
- restaurants        — from useRestaurants()
- coords, geoLoading, geoDenied — from useGeolocation() (geoDenied currently void'd)
- selectedRestaurant — Restaurant | null
- filters            — FilterState { cuisine: string | null; maxDistance: number | null }
- filteredRestaurants — useMemo over restaurants + filters.cuisine only
- cuisines           — useMemo of unique sorted cuisine strings
```

Story 3.2 adds:
- `src/utils/distance.ts` — Haversine formula (NEW FILE)
- `src/utils/index.ts` — utils barrel export (NEW FILE)
- Extends `FilterBar` props with 4 new props (non-breaking addition pattern)
- Updates `filteredRestaurants` memo to include `maxDistance + coords` logic
- Removes `void geoDenied;` and actually uses `geoDenied` in FilterBar prop
- Adds `useEffect` to auto-clear `maxDistance` when geo is denied

### FilterState is Already Defined — Do Not Touch

`src/types/restaurant.ts` already exports:
```typescript
export interface FilterState {
  cuisine: string | null;
  maxDistance: number | null;
}
```
`maxDistance` is already in state initialized to `null`. Story 3.2 simply wires it up. Do not redefine or modify `FilterState`.

### The `geoDenied` Variable

In `App.tsx` line 51, `geoDenied` is already destructured but currently void'd:
```typescript
const { coords, loading: geoLoading, denied: geoDenied } = useGeolocation();
void geoDenied; // forward-compat: consumed by Story 3.2 DistanceFilter
```

In this story:
1. Remove the `void geoDenied;` line
2. Pass `geoDenied` directly to `FilterBar` as a prop
3. The `useEffect` reset guard also uses `geoDenied`

### Distance Filter Visibility Logic

Three states for the distance row:

| State | Condition | Behavior |
|-------|-----------|----------|
| Visible + interactive | `!geoDenied && coords !== null` | Show distance chips |
| Hidden (geo denied) | `geoDenied === true` | Don't render distance row |
| Hidden (no coords yet) | `coords === null && !geoDenied` | Don't render distance row |

The AC specifies "hidden or disabled." This story chooses **hidden** — the distance row does not render at all when location is unavailable. No placeholder, no "enable location" message. This matches the epics spec: "no error message is shown about the missing distance filter."

### Haversine Formula — Implementation Detail

```typescript
// src/utils/distance.ts
const R = 3958.8; // Earth mean radius in miles

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

This is standard Haversine with no third-party dependencies. Pure function — easy to test.

### Distance Preset Values

The epics spec mentions "5 to 30 miles and an Any option." Implementation uses:
- **Any** (null) — no distance filtering
- **5 mi** (5)
- **10 mi** (10)
- **20 mi** (20)
- **30 mi** (30)

These are exported as `DISTANCE_OPTIONS` constant from `distance.ts` so `FilterBar` can render them without hardcoding. Adding a new preset in the future only requires updating `DISTANCE_OPTIONS`.

### FilterBar Layout — Two Rows

When distance is available, the FilterBar renders two scrollable rows:

```
Row 1 (existing): [All] [American] [Japanese] [Mexican] ... (cuisine chips)
Row 2 (new):      [Any] [5 mi] [10 mi] [20 mi] [30 mi]  (distance chips)
```

Both rows use identical chip CSS classes (`chipBase`, `chipActive`, `chipInactive`) from the existing constants at the top of `FilterBar.tsx`. No new design tokens needed.

The FilterBar wrapper `<div>` gains slightly more height. The map overlay positioning (`absolute top-0 left-0 right-0 z-10`) in `App.tsx` does not need to change — it already auto-heights to its content.

### Design System Spec (DESIGN.md — Filter Chips)

```
Background (default): --color-surface (#FFFFFF)
Border: 1.5px solid --color-border (#E8E0D5)
Border-radius: rounded-full
Padding: px-3 py-1
Font: 12px Karla 600
Color: --color-text-secondary (#78716C)

Active state:
  Background: #D97706 (amber-600)
  Border: amber-600
  Color: white

Micro-interaction:
  Filter chip toggle: Background swap, 0.15s ease
```

Tailwind mapping (reuse from existing `FilterBar.tsx`):
- `chipBase`: `'rounded-full px-3 py-1 text-xs font-semibold font-sans whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200'`
- `chipActive`: `'bg-amber-600 text-white border border-amber-600'`
- `chipInactive`: `'bg-white text-stone-500 border border-[#E8E0D5] [border-width:1.5px]'`

### Combined Filter Logic

```typescript
// In App.tsx — updated filteredRestaurants memo
const filteredRestaurants = useMemo(
  () =>
    restaurants.filter((r) => {
      if (filters.cuisine && r.cuisine !== filters.cuisine) return false;
      if (filters.maxDistance !== null && coords !== null) {
        const dist = haversineDistance(coords.lat, coords.lng, r.lat, r.lng);
        if (dist > filters.maxDistance) return false;
      }
      return true;
    }),
  [restaurants, filters.cuisine, filters.maxDistance, coords]
);
```

Key: distance filter is a no-op when either `filters.maxDistance === null` (Any) or `coords === null` (no location). Both conditions allow the restaurant through.

### TypeScript Strict Mode

- No `any` types anywhere
- `haversineDistance` takes 4 `number` args, returns `number` — fully typed
- `DISTANCE_OPTIONS` is `ReadonlyArray<{ label: string; miles: number }>` typed via `as const`
- `FilterBarProps` addition: all 4 new props are required with explicit types
- `onDistanceChange: (miles: number | null) => void` — must accept null (for "Any" / toggle-off)
- Updated `useMemo` dependency array must include `coords` — lint will catch if omitted

### Accessibility

Distance row:
- Container: `role="group"`, `aria-label="Filter by distance"`
- Each chip: `<button>` element with `aria-pressed={isActive}`
- "Any" chip: `aria-pressed={activeDistance === null}`
- Focus ring: `focus-visible:ring-2 focus-visible:ring-amber-200` (same as cuisine chips)

The distance row is fully absent from the DOM when hidden (not just visually hidden), so screen readers won't encounter disabled or confusing elements.

### Performance

Distance filter path: user clicks chip → `onDistanceChange(miles)` → `setFilters` (O(1)) → `filteredRestaurants` memo recalculates — for ~200 records, Haversine 200x is negligible (<1ms). NFR2 (<100ms) is trivially satisfied by client-side filtering.

### No New Dependencies

Pure Math functions only. No npm packages. `DISTANCE_OPTIONS` replaces any temptation to reach for a library.

### Files to Create / Modify

| File | Change |
|------|--------|
| `src/utils/distance.ts` | **Create** — `haversineDistance`, `DISTANCE_OPTIONS` |
| `src/utils/index.ts` | **Create** — barrel export |
| `src/utils/distance.test.ts` | **Create** — unit tests for Haversine |
| `src/components/FilterBar.tsx` | **Modify** — add 4 props, add distance chip row |
| `src/components/FilterBar.test.tsx` | **Modify** — add 8 new tests for distance row |
| `src/App.tsx` | **Modify** — remove `void geoDenied`, update filteredRestaurants memo, add useEffect reset, pass new FilterBar props |
| `src/test/FilterIntegration.test.tsx` | **Modify** — update mock shape, add 6 integration tests |
| `src/test/App.test.tsx` | **Modify** — update any FilterBar mock prop calls, add 1 smoke test |

Do NOT modify:
- `src/types/restaurant.ts` — `FilterState` is already correct, no changes needed
- `src/hooks/useGeolocation.ts` — already returns `{ coords, loading, denied }` correctly
- `src/hooks/useRestaurants.ts` — filtering stays in App.tsx
- Any Epic 1 / Epic 2 component files
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — orchestrator manages this

### Story 3.3 Forward-Compatibility

Story 3.3 (Combined Filters & Clear All) adds a "Clear Filters" button that resets both `cuisine` and `maxDistance` to null simultaneously. The current `FilterState` shape and `setFilters(f => ({ ...f, ... }))` pattern already supports this. No changes needed in this story to enable 3.3.

## Dev Agent Record

_(Populated by the implementing dev agent after completion)_

### Agent Model Used

### Debug Log References

### Completion Notes List

### Senior Developer Review (AI)

### Review Follow-ups (AI)

### File List

### Agent Model Used

claude-sonnet-4-6 (parallel swarm: A+B+C dev agents in sequence, then tests, then code-review + test-runner)

### Debug Log References

- Replaced useEffect(setState) pattern with derived `effectiveMaxDistance` to satisfy ESLint react-hooks/set-state-in-effect
- Fixed integration test mock: `undefined !== null` caused distance row to render unexpectedly — added baseProps with explicit userCoords:null
- Corrected fixture coordinates (r-mid, r-far) to match story spec and added accurate distance comments

### Completion Notes List

- All tasks A1, A2, B1, B2, C1, C2, C3, C4, D1, D3 implemented; 90 tests passing
- ESLint clean — no errors or warnings; TypeScript strict — no errors

### Senior Developer Review (AI)

6 findings: 0 critical, 2 high, 2 medium, 2 low. All resolved.

### Review Follow-ups (AI)

- [x] F1: Removed useEffect; replaced with derived effectiveMaxDistance covering geoDenied + coords-null cases (AC 7)
- [x] F2: Changed outer FilterBar container aria-label from "Filter by cuisine" to "Filters"
- [x] F3: Fixed integration test fixture coordinates to match story spec with accurate comments
- [x] F4: Tightened Haversine test tolerance to ±0.1 mi of actual values
- [x] F5: Added AC7 mid-session coords-null integration test using rerender()
- [x] F6: Changed chipActive from amber-600 to amber-700 (WCAG AA 4.6:1 contrast)

### File List

| File | Change |
|------|--------|
| src/utils/distance.ts | Created |
| src/utils/index.ts | Created |
| src/utils/distance.test.ts | Created |
| src/components/FilterBar.tsx | Modified |
| src/components/FilterBar.test.tsx | Modified |
| src/App.tsx | Modified |
| src/test/App.test.tsx | Modified |
| src/test/FilterIntegration.test.tsx | Modified |
