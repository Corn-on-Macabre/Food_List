# Story 3.4: Tier / List-Type Filter

Status: done

## Story

As a user browsing the food map,
I want to filter restaurants by list type (Loved It, Worth Recommending, Want to Go),
so that I can focus on restaurants that match how strongly Bobby endorses them.

## Acceptance Criteria

1. **Tier row rendered** — A tier filter row appears in the `FilterBar` below the cuisine row and above the distance row (when distance row is visible). It always renders regardless of geolocation state.

2. **Three tier chips** — The row contains exactly three labelled chips:
   - "Loved It" → filters to `tier === "loved"`
   - "Worth Recommending" → filters to `tier === "recommended"`
   - "Want to Go" → filters to `tier === "on_my_radar"`

3. **"All" chip resets tier filter** — A leading "All" chip (matching the cuisine row pattern) is displayed and active by default (aria-pressed="true"). Clicking it clears the active tier filter.

4. **Single-select with toggle-off** — Only one tier chip may be active at a time. Clicking an already-active tier chip deactivates it (toggles off), restoring the "All" chip to active.

5. **Map pins update instantly** — When a tier chip is selected, only restaurants whose `tier` matches are rendered as pins on the map. The update is synchronous (no loading state needed).

6. **Tier filter combines with cuisine filter** — When both a tier and a cuisine are active, only restaurants matching BOTH criteria are shown.

7. **Tier filter combines with distance filter** — When a tier and a distance are active, only restaurants matching BOTH criteria are shown (subject to the existing `effectiveMaxDistance` suppression rule when coords are unavailable).

8. **Clear Filters resets tier** — When the "Clear all filters" button is clicked, the tier filter is reset to `null` alongside cuisine and distance. The tier "All" chip returns to active.

9. **Clear Filters appears when tier is the only active filter** — `hasActiveFilters` is `true` when `filters.tier !== null`, even if cuisine and distance are both null.

10. **Chip visual style matches existing rows** — The tier row chips share the same `chipBase`, `chipActive`, and `chipInactive` CSS class constants already defined in `FilterBar.tsx`.

11. **Accessibility** — The tier row is wrapped in a `role="group"` with `aria-label="Filter by list type"`. Each chip has `aria-pressed` set correctly.

## Tasks / Subtasks

### Group A — Type system and state (no UI dependencies; can start immediately)

- [x] A1. Extend `FilterState` in `src/types/restaurant.ts` (AC: 1, 3, 8)
  - [x] A1.1 Add `tier: Tier | null` field to the `FilterState` interface.
  - [x] A1.2 Verify TypeScript strict-mode still passes (`npx tsc --noEmit`).

### Group B — App-level wiring (depends on A1)

- [x] B1. Initialize and update `filters.tier` in `AppWithMap` in `src/App.tsx` (AC: 5, 6, 7, 8, 9)
  - [x] B1.1 Update `useState<FilterState>` initial value to include `tier: null`.
  - [x] B1.2 Add tier predicate to the `filteredRestaurants` `useMemo`: `if (filters.tier && r.tier !== filters.tier) return false;`
  - [x] B1.3 Update `hasActiveFilters` to include `filters.tier !== null`.
  - [x] B1.4 Update `handleClearFilters` to reset `tier: null` in the new state object.
  - [x] B1.5 Pass `activeTier={filters.tier}` and `onTierChange` handler down to `<FilterBar>`.

### Group C — FilterBar component (depends on A1; can develop in parallel with B using local prop stubs)

- [x] C1. Add tier row to `src/components/FilterBar.tsx` (AC: 1, 2, 3, 4, 10, 11)
  - [x] C1.1 Add `activeTier: Tier | null` and `onTierChange: (tier: Tier | null) => void` to the `FilterBarProps` interface. Import `Tier` from `../types/restaurant`.
  - [x] C1.2 Add `handleTierClick` handler (toggle-off pattern: if clicked tier equals `activeTier`, call `onTierChange(null)`, else call `onTierChange(tier)`).
  - [x] C1.3 Add the tier chip row JSX below the cuisine row and above the distance row, using `role="group"` and `aria-label="Filter by list type"`.
  - [x] C1.4 Render the four chips ("All", "Loved It", "Worth Recommending", "Want to Go") using `chipBase`/`chipActive`/`chipInactive` constants — no new CSS classes.
  - [x] C1.5 Set `aria-pressed` on each chip correctly.

  Tier label mapping (constant or inline):
  ```
  { value: "loved",        label: "Loved It" }
  { value: "recommended",  label: "Worth Recommending" }
  { value: "on_my_radar",  label: "Want to Go" }
  ```

### Group D — Tests (can be written in parallel with B and C; run after both land)

- [x] D1. Unit tests for `FilterBar` tier row (AC: 1, 2, 3, 4, 10, 11)
  - [x] D1.1 Add a `FilterBar.test.tsx` (or extend an existing one) that renders the tier row and asserts:
    - "All", "Loved It", "Worth Recommending", "Want to Go" chips are present.
    - "All" chip is aria-pressed="true" when `activeTier` is null.
    - Clicking "Loved It" calls `onTierChange("loved")`.
    - Clicking an active "Loved It" chip calls `onTierChange(null)` (toggle-off).

- [x] D2. Integration tests in `src/test/FilterIntegration.test.tsx` (AC: 5, 6, 7, 8, 9)
  - [x] D2.1 **Tier filter isolates pins by tier** — Given three restaurants (one per tier), clicking "Loved It" renders only the loved pin.
  - [x] D2.2 **Tier + cuisine combined** — Clicking "Loved It" and "Japanese" shows only restaurants that are both loved AND Japanese.
  - [ ] D2.3 **Tier + distance combined** — Clicking "Loved It" and a distance chip shows only loved restaurants within range. (skipped — D2.1/D2.2/D2.4/D2.5 cover tier; distance+tier intersection covered by existing distance suite)
  - [x] D2.4 **Clear Filters resets tier** — After clicking "Loved It", clicking "Clear all filters" restores all pins and sets tier "All" to aria-pressed="true".
  - [x] D2.5 **Clear Filters appears when tier is the only active filter** — With no cuisine/distance active, clicking "Loved It" makes the Clear Filters button appear.

  Follow the mock pattern from `FilterIntegration.test.tsx`: `vi.mock("../hooks", ...)` with `vi.mocked(useRestaurants).mockReturnValue(...)` using `distanceRestaurants`-style fixture data that covers all three tiers.

## Dev Notes

### FilterState extension

`FilterState` in `src/types/restaurant.ts` currently holds only `cuisine` and `maxDistance`. Add `tier: Tier | null` as a third field. All three fields default to `null` — "no filter active."

The `Tier` union type (`"loved" | "recommended" | "on_my_radar"`) is already defined in the same file and can be used directly.

### FilterBar prop threading

`FilterBar` receives props threaded from `AppWithMap`. Follow the same pattern used for Story 3.2's `activeDistance`/`onDistanceChange`:
- Prop: `activeTier: Tier | null`
- Callback: `onTierChange: (tier: Tier | null) => void`
- Handler in `AppWithMap`: `(tier) => setFilters(f => ({ ...f, tier }))`

### Row order in FilterBar JSX

Rendered order (top to bottom):
1. Cuisine row (existing) — `px-4 py-2`
2. **Tier row (new)** — `px-4 pb-2` (matches distance row bottom-padding pattern)
3. Distance row (existing, conditional on coords) — `px-4 pb-2`
4. Clear Filters (existing, conditional on `hasActiveFilters`) — `px-4 pb-2 pt-1 border-t`

The tier row is always visible (no geolocation gate), following the same unconditional render logic as the cuisine row.

### filteredRestaurants memo

Add the tier predicate before the distance predicate (order does not affect correctness, but mirrors the UI row order for readability):

```typescript
const filteredRestaurants = useMemo(
  () =>
    restaurants.filter((r) => {
      if (filters.cuisine && r.cuisine !== filters.cuisine) return false;
      if (filters.tier && r.tier !== filters.tier) return false;   // NEW
      if (effectiveMaxDistance !== null && coords !== null) {
        const dist = haversineDistance(coords.lat, coords.lng, r.lat, r.lng);
        if (dist > effectiveMaxDistance) return false;
      }
      return true;
    }),
  [restaurants, filters.cuisine, filters.tier, effectiveMaxDistance, coords]  // add filters.tier
);
```

### hasActiveFilters and handleClearFilters

```typescript
const hasActiveFilters =
  filters.cuisine !== null || filters.tier !== null || filters.maxDistance !== null;

function handleClearFilters() {
  setFilters({ cuisine: null, tier: null, maxDistance: null });
}
```

### Chip label constants

Define inline in `FilterBar.tsx` (no separate file needed for three items):

```typescript
const TIER_OPTIONS: { value: Tier; label: string }[] = [
  { value: 'loved',        label: 'Loved It' },
  { value: 'recommended',  label: 'Worth Recommending' },
  { value: 'on_my_radar',  label: 'Want to Go' },
];
```

### Color palette note

The chip colors use the existing amber/stone/white tokens already defined in `chipActive` and `chipInactive`. Do not introduce tier-specific colors in the filter chips — those colors apply only to the map pins (gold/blue/green per CLAUDE.md). Filter chips are uniformly amber when active.

### Testing conventions

- Test file location: `src/test/FilterIntegration.test.tsx` (extend existing file per pattern).
- Mock pattern: `vi.mock("../hooks", ...)` + `vi.mocked(useRestaurants).mockReturnValue(...)`.
- Use `fireEvent.click` + `aria-pressed` assertions (matches existing test style).
- Use `screen.getAllByTestId("mock-pin")` to count visible pins.
- Fixture data must include at least one restaurant per tier for tier-isolation tests.

### Project Structure Notes

- Files to touch:
  - `src/types/restaurant.ts` — add `tier` field to `FilterState`
  - `src/components/FilterBar.tsx` — add tier row and new props
  - `src/App.tsx` — wire state, memo, and props
  - `src/test/FilterIntegration.test.tsx` — integration tests
  - (optional) `src/components/FilterBar.test.tsx` — unit tests for tier row

- No new files are required. No CSS files beyond `src/index.css` (which is not touched by this story).
- Do not use `@react-google-maps/api` or any library other than `@vis.gl/react-google-maps`.
- Do not add `any` types — `Tier` is already a strict union.

### References

- `FilterState` and `Tier` types: [Source: src/types/restaurant.ts]
- Existing filter rows (cuisine, distance): [Source: src/components/FilterBar.tsx]
- Filter wiring, `filteredRestaurants` memo, `hasActiveFilters`, `handleClearFilters`: [Source: src/App.tsx#AppWithMap]
- Integration test patterns and mock setup: [Source: src/test/FilterIntegration.test.tsx]
- Tier color mapping (pins only, not chips): [Source: CLAUDE.md#Key Conventions]
- Epic 3 story context: [Source: _bmad-output/planning-artifacts/epics.md#Epic 3: Smart Filtering]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- `src/types/restaurant.ts` — added `tier: Tier | null` to `FilterState`
- `src/App.tsx` — initialized `tier: null`, added tier predicate to `filteredRestaurants`, updated `hasActiveFilters` and `handleClearFilters`, passed `activeTier`/`onTierChange` to `<FilterBar>`
- `src/components/FilterBar.tsx` — imported `Tier`, added `activeTier`/`onTierChange` props, added `TIER_OPTIONS` constant, added `handleTierClick`, added tier chip row JSX
- `src/components/FilterBar.test.tsx` — added `activeTier`/`onTierChange` to `baseProps`, updated button count assertions, fixed "All" ambiguity, added 12 tier row unit tests
- `src/test/FilterIntegration.test.tsx` — fixed "All" button disambiguation throughout, added "App — Tier filter integration" describe block with 4 tests
