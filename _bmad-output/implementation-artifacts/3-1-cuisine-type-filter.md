# Story 3.1: Cuisine Type Filter

Status: done

## Story

As a user,
I want to filter restaurants by cuisine type,
so that I can quickly narrow down to the kind of food I'm in the mood for.

## Acceptance Criteria

1. **Given** the map is displayed with restaurant pins **When** the user views the app **Then** a `FilterBar` component is visible containing a row of cuisine filter chips and an "All" chip, positioned between the header and the map (overlaid on the map at the top edge, full-width).

2. **Given** the `FilterBar` renders **When** restaurant data has loaded **Then** the chip list is populated with all unique cuisine values extracted from the loaded `restaurants` array, sorted alphabetically, with an "All" chip always first — no hardcoded cuisine list.

3. **Given** the user taps/clicks a cuisine chip **When** the chip is activated **Then** only restaurants matching the selected cuisine remain visible on the map (all non-matching pins are hidden), and the map updates in under 100ms (NFR2 — client-side filtering).

4. **Given** the user taps/clicks a cuisine chip that is already active **When** the chip is re-activated **Then** the filter is cleared (same behavior as clicking "All") and all restaurant pins reappear.

5. **Given** the user taps/clicks "All" **When** no cuisine is active **Then** the "All" chip is in its active (amber) state and all restaurant pins are visible.

6. **Given** a cuisine is selected that matches zero restaurants **When** the filter is applied **Then** no pins are displayed on the map and the map remains interactive.

7. **Given** the restaurant data is still loading **When** `FilterBar` renders **Then** the chip bar shows only the "All" chip (cuisine chips are not yet available) without throwing an error.

## Tasks / Subtasks

- [x] **Task 1:** Add `FilterState` to `App.tsx` state and derive filtered restaurants (AC: 3, 4, 5, 6)
  - [x] Import `FilterState` from `src/types/restaurant.ts` (already defined: `{ cuisine: string | null; maxDistance: number | null }`)
  - [x] Add `const [filters, setFilters] = useState<FilterState>({ cuisine: null, maxDistance: null })` in `AppWithMap`
  - [x] Derive `const filteredRestaurants = useMemo(() => restaurants.filter(r => !filters.cuisine || r.cuisine === filters.cuisine), [restaurants, filters.cuisine])` — keep `useMemo` import from React
  - [x] Replace `restaurants` with `filteredRestaurants` in the `RestaurantPin` map call inside `<Map>`
  - [ ] Pass `filters` and `onFiltersChange` down to `FilterBar` as props

- [x] **Task 2:** Derive sorted unique cuisine list (AC: 2, 7)
  - [x] Add `const cuisines = useMemo(() => Array.from(new Set(restaurants.map(r => r.cuisine))).sort(), [restaurants])` in `AppWithMap` (or inside `FilterBar` — see Dev Notes)
  - [x] This list is derived from the raw `restaurants` array (not `filteredRestaurants`) so all cuisine options remain visible even when a filter is active

- [x] **Task 3:** Create `src/components/FilterBar.tsx` (AC: 1, 2, 3, 4, 5, 6, 7)
  - [x] Create the file; export named `FilterBar` component
  - [x] Props interface:
    ```typescript
    interface FilterBarProps {
      cuisines: string[];
      activeCuisine: string | null;
      onCuisineChange: (cuisine: string | null) => void;
    }
    ```
  - [x] Render a horizontally scrollable chip row: `<div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">` (see Dev Notes — Layout)
  - [x] Render an "All" chip first, always present
  - [x] Render one chip per cuisine string from `cuisines` prop
  - [x] Active chip style (amber): `bg-amber-600 text-white border-amber-600`
  - [x] Inactive chip style: `bg-white text-stone-500 border border-stone-300`
  - [x] Both chip states: `rounded-full px-3 py-1 text-xs font-semibold font-sans whitespace-nowrap transition-colors duration-150 cursor-pointer`
  - [x] On chip click: call `onCuisineChange(cuisine)` for cuisine chips; call `onCuisineChange(null)` for "All"
  - [x] If the clicked chip is already active (`cuisine === activeCuisine`), call `onCuisineChange(null)` to toggle it off (AC: 4)
  - [x] Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200` on each chip `<button>` for keyboard accessibility
  - [x] Add `aria-pressed={isActive}` on each chip button
  - [x] Add `role="group"` and `aria-label="Filter by cuisine"` on the container div

- [x] **Task 4:** Add `FilterBar` to `App.tsx` render tree (AC: 1)
  - [x] Import `FilterBar` from `./components`
  - [x] Position: inside the `<div style={{ position: 'relative', width: '100vw', height: '100vh' }}>` wrapper, **above** `<APIProvider>` in the stacking order (overlay on map), using `absolute top-[60px] left-0 right-0 z-10`
  - [x] Wire `cuisines={cuisines}`, `activeCuisine={filters.cuisine}`, `onCuisineChange={(cuisine) => setFilters(f => ({ ...f, cuisine }))}`
  - [x] Add a background fade on the chip bar so it reads against any map tile: `bg-[rgba(255,251,245,0.92)] backdrop-blur-sm border-b border-stone-200`

- [x] **Task 5:** Export `FilterBar` from components index (AC: —)
  - [x] Add `export { FilterBar } from './FilterBar';` to `src/components/index.ts`

- [x] **Task 6:** Write unit tests for `FilterBar` (AC: 1–7)
  - [x] Create `src/components/FilterBar.test.tsx`
  - [x] Test: "renders All chip when cuisines is empty" — AC 7
  - [x] Test: "renders one chip per cuisine plus All chip" — AC 2
  - [x] Test: "clicking a cuisine chip calls onCuisineChange with that cuisine" — AC 3
  - [x] Test: "clicking active cuisine chip calls onCuisineChange with null" — AC 4
  - [x] Test: "clicking All chip calls onCuisineChange with null" — AC 5
  - [x] Test: "active chip has amber styling class; inactive chip has white styling class" — AC 3/5 visual

- [x] **Task 7:** Integration smoke test — verify filtered pins in App (AC: 3, 6)
  - [x] Extend `src/test/App.test.tsx` with: mock `useRestaurants` returning 2 restaurants with different cuisines → verify `filteredRestaurants` length changes when filter state changes (test via `setFilters` callback spy or by rendering with controlled props)
  - [x] All existing tests must continue to pass (17/17 baseline)

## Dev Notes

### Architecture Context

Epic 1 and 2 are fully done. The current `App.tsx` (`AppWithMap`) holds:
- `restaurants` — raw array from `useRestaurants()` (unchanged for this story)
- `selectedRestaurant` state — Restaurant or null
- `handleMapClick` — dismisses card on empty map click

This story adds:
- `filters` state (`FilterState`) — defaults to `{ cuisine: null, maxDistance: null }`
- `filteredRestaurants` memo — derived from `restaurants + filters.cuisine`
- `cuisines` memo — derived from raw `restaurants` array
- `FilterBar` component — chip UI

The `maxDistance` field in `FilterState` is already typed for Story 3.2 — do NOT remove it from state. Initialize it to `null` and leave it alone.

### FilterState is Already Defined

`src/types/restaurant.ts` already exports:
```typescript
export interface FilterState {
  cuisine: string | null;
  maxDistance: number | null;
}
```
Do not redefine it. Import it.

### Filter Logic

```typescript
// In AppWithMap — derive filtered list
const filteredRestaurants = useMemo(
  () => restaurants.filter(r => !filters.cuisine || r.cuisine === filters.cuisine),
  [restaurants, filters.cuisine]
);

// Derive sorted unique cuisine list from RAW restaurants (not filtered)
const cuisines = useMemo(
  () => Array.from(new Set(restaurants.map(r => r.cuisine))).sort(),
  [restaurants]
);
```

Key: cuisine list is always derived from `restaurants` (unfiltered), not `filteredRestaurants`. This ensures all cuisine chips remain visible when one is active — allowing the user to switch directly between cuisines without first clearing.

### FilterBar Layout and Positioning

The chip bar overlays the top of the map, just below where the header would be. The app has no visible header element in the DOM currently — the map fills `100vw × 100vh`. Position the `FilterBar` using `position: absolute` inside the relative container:

```tsx
// In AppWithMap render, inside the outermost relative div:
<div className="absolute top-0 left-0 right-0 z-10 bg-[rgba(255,251,245,0.92)] backdrop-blur-sm border-b border-stone-200">
  <FilterBar
    cuisines={cuisines}
    activeCuisine={filters.cuisine}
    onCuisineChange={(cuisine) => setFilters(f => ({ ...f, cuisine }))}
  />
</div>
```

This keeps the map at `100vh` and doesn't shrink it — the filter bar simply overlays the top edge.

### Chip Scroll Behavior

The chip row must scroll horizontally on mobile. Use `overflow-x-auto` with `whitespace-nowrap` children. To hide the scrollbar visually (it still scrolls):

```css
/* In src/index.css, add to the @theme / base block */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

Alternatively, do NOT use a custom class — just use `overflow-x-auto` and let the scrollbar show. That is acceptable for MVP. Only add the `.scrollbar-hide` utility if it fits cleanly.

### Filter Chip — Design System Spec (DESIGN.md)

From `DESIGN.md` "Filter Chips (Epic 3)":
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
```

Tailwind mapping:
- Inactive: `bg-white text-stone-500 border border-[#E8E0D5] rounded-full px-3 py-1 text-[12px] font-semibold`
- Active: `bg-amber-600 text-white border-amber-600 rounded-full px-3 py-1 text-[12px] font-semibold`
- Transition: `transition-colors duration-150`

Note: `text-stone-500` is `#78716C` — matches `--color-text-secondary`. Use Tailwind tokens where they map cleanly; use literal hex only where Tailwind v4 custom tokens are needed.

### TypeScript Strict Mode

- No `any` types anywhere
- `FilterBar` props must be fully typed with a named interface (not inline)
- `useMemo` return types inferred — do not cast
- `onCuisineChange: (cuisine: string | null) => void` — must accept null (for "All" / toggle-off)
- `useState<FilterState>` — explicit generic required

### Accessibility

- Each chip is a `<button>` element (keyboard navigable, activatable with Enter/Space)
- `aria-pressed={activeCuisine === cuisine}` on each cuisine chip; `aria-pressed={activeCuisine === null}` on "All"
- Container: `role="group" aria-label="Filter by cuisine"`
- Focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200`
- Chip text is the raw cuisine string from the data — no truncation — so it is always readable as-is

### Performance

Filter update path: user clicks chip → `onCuisineChange(cuisine)` → `setFilters` (O(1)) → `filteredRestaurants` memo recalculates → React rerenders only changed pins. For ~200 records the filter operation is <1ms. NFR2 (<100ms) is trivially satisfied.

### Files to Create / Modify

| File | Change |
|------|--------|
| `src/components/FilterBar.tsx` | **Create** — new FilterBar component |
| `src/components/FilterBar.test.tsx` | **Create** — unit tests |
| `src/components/index.ts` | **Modify** — add FilterBar export |
| `src/App.tsx` | **Modify** — add filters state, filteredRestaurants memo, cuisines memo, render FilterBar |
| `src/index.css` | **Modify (optional)** — add `.scrollbar-hide` utility if used |

Do NOT modify:
- `src/types/restaurant.ts` — `FilterState` is already correct
- `src/hooks/useRestaurants.ts` — filtering stays in App.tsx for this story (hook signature change deferred to Story 3.3 or refactor)
- Any Epic 1 / Epic 2 component files unless extending for new props

### No New Dependencies

Per architecture: pure React state + Tailwind. No new npm packages. The `useMemo` import is already available from React 18.

### Story 3.2 Forward-Compatibility

The `FilterState.maxDistance` field must be preserved in state as `null`. Do not simplify `FilterState` to only `cuisine` — Story 3.2 will add `maxDistance` filtering and the `useGeolocation` `denied` value to show/hide the distance control.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (parallel swarm: 2 dev agents + code-reviewer + test-runner)

### Debug Log References

- Integration test mock fix: Added AdvancedMarker + Pin to @vis.gl mock so RestaurantPin renders

### Completion Notes List

- All 7 tasks implemented and marked [x]
- 69 tests passing (48 baseline + 13 FilterBar unit + 3 App smoke + 5 FilterIntegration)
- FilterState.maxDistance preserved as null for Story 3.2 forward-compat
- geoDenied destructured but void'd to satisfy Story 3.2 forward-compat comment

### Senior Developer Review (AI)

6 findings: 0 critical, 2 high, 3 medium, 1 low. All resolved.

### Review Follow-ups (AI)

- [x] F1: Fixed chipInactive border to `border-[#E8E0D5] [border-width:1.5px]` (design token match)
- [x] F2: Added FilterIntegration.test.tsx with real 2-restaurant fixture + chip interaction tests (AC 3, 4, 5)
- [x] F3: Added `font-sans` to chipBase (Karla font for chips per DESIGN.md)
- [x] F4: Added `.scrollbar-hide` CSS utility to index.css + class to FilterBar chip container
- [x] F5: Destructured `denied` as `geoDenied` from useGeolocation() with void + comment for Story 3.2
- [x] F6: Added TODO comment on FilterBar wrapper for when Story 4.x adds app header at 60px

### File List

| File | Change |
|------|--------|
| `src/components/FilterBar.tsx` | Created — FilterBar chip component |
| `src/components/FilterBar.test.tsx` | Created — 13 unit tests |
| `src/components/index.ts` | Modified — added FilterBar export |
| `src/App.tsx` | Modified — filters state, filteredRestaurants, cuisines memos, FilterBar render |
| `src/index.css` | Modified — added .scrollbar-hide utility |
| `src/test/App.test.tsx` | Modified — added FilterBar smoke test describe block |
| `src/test/FilterIntegration.test.tsx` | Created — 5 integration tests with real restaurant fixtures |
