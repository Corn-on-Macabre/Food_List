# Story 6.2: Search by Restaurant Name

Status: ready-for-dev

## Story

As a user browsing the food map,
I want to type a restaurant name and see matching results instantly,
so that I can find a specific restaurant without scrolling through cuisine or tier filters.

## Acceptance Criteria

1. **Search input rendered** — A text input with a search icon (magnifying glass) and placeholder text "Search restaurants..." appears at the top of the `FilterBar`, above the cuisine chip row.

2. **Type-ahead filtering** — As the user types, restaurants whose `name` contains the search term are shown on the map. Matching is case-insensitive using `name.toLowerCase().includes(term.toLowerCase())`. No debounce is needed (~592 records, string.includes is <1ms).

3. **Combines with all existing filters** — The search term is ANDed with cuisine, tier, and distance filters. A restaurant must match ALL active filters to appear on the map.

4. **Clear button (X) in input** — When the search input has text, an X button appears inside the input that clears the search term when clicked. When the input is empty, the X button is hidden.

5. **Escape key clears search** — Pressing Escape while the search input is focused clears the search term.

6. **Clear Filters resets search** — Clicking the existing "Clear all filters" button resets the search term to `null` alongside cuisine, tier, and distance.

7. **hasActiveFilters includes searchTerm** — The "Clear all filters" button appears when `searchTerm` is non-null, even if no other filter is active.

8. **Empty results** — When the search term matches zero restaurants (alone or combined with other filters), no pins are displayed and the map remains interactive.

9. **Design tokens match** — The search input uses the existing FilterBar design tokens: `bg-white`, `border-[#E8E0D5]`, `focus:ring-[#FDE68A]`, amber accent for the search icon, `font-sans text-xs` text sizing consistent with chip labels.

10. **Accessibility** — The search input has `role="searchbox"`, `aria-label="Search restaurants by name"`, and the clear button has `aria-label="Clear search"`. The input is keyboard-navigable (Tab to reach, Escape to clear).

11. **FilterState extended** — `FilterState` in `src/types/restaurant.ts` includes `searchTerm: string | null` (null = no search active).

## Tasks / Subtasks

### Group A — Type system (no UI dependencies; start immediately)

- [ ] A1. Extend `FilterState` in `src/types/restaurant.ts` (AC: 11)
  - [ ] A1.1 Add `searchTerm: string | null` field to the `FilterState` interface.
  - [ ] A1.2 Verify TypeScript strict-mode still passes (`npx tsc --noEmit`).

### Group B — App-level wiring (depends on A1)

- [ ] B1. Wire `searchTerm` state and filtering in `src/App.tsx` (AC: 2, 3, 6, 7)
  - [ ] B1.1 Update `useState<FilterState>` initial value to include `searchTerm: null`.
  - [ ] B1.2 Add search predicate to the `filteredRestaurants` `useMemo` — before the cuisine predicate: `if (filters.searchTerm && !r.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;`
  - [ ] B1.3 Add `filters.searchTerm` to the `useMemo` dependency array.
  - [ ] B1.4 Update `hasActiveFilters` to include `filters.searchTerm !== null`.
  - [ ] B1.5 Update `handleClearFilters` to reset `searchTerm: null` in the new state object.
  - [ ] B1.6 Pass `searchTerm={filters.searchTerm}` and `onSearchChange` handler to `<FilterBar>`: `(term) => setFilters(f => ({ ...f, searchTerm: term }))`.

### Group C — FilterBar component (depends on A1; can develop in parallel with B)

- [ ] C1. Add search input to `src/components/FilterBar.tsx` (AC: 1, 4, 5, 9, 10)
  - [ ] C1.1 Add `searchTerm: string | null` and `onSearchChange: (term: string | null) => void` to the `FilterBarProps` interface.
  - [ ] C1.2 Add search input JSX above the filter chip `role="group"` container. Use a wrapper `div` with `relative` positioning for the search icon and clear button overlay.
  - [ ] C1.3 Render a magnifying glass search icon (inline SVG, no library dependency) positioned absolutely at the left of the input. Use `text-amber-600` for the icon color.
  - [ ] C1.4 Render the `<input>` element with:
    - `type="search"` and `role="searchbox"`
    - `aria-label="Search restaurants by name"`
    - `placeholder="Search restaurants..."`
    - `value={searchTerm ?? ''}`
    - `onChange` handler: call `onSearchChange(e.target.value || null)` (empty string becomes null)
    - `onKeyDown` handler: if `e.key === 'Escape'`, call `onSearchChange(null)` and `e.currentTarget.blur()`
    - Tailwind classes: `w-full pl-9 pr-8 py-2 mx-4 mt-2 text-xs font-sans bg-white border border-[#E8E0D5] rounded-full focus:outline-none focus:ring-2 focus:ring-[#FDE68A] placeholder:text-stone-400`
  - [ ] C1.5 Render the clear (X) button conditionally when `searchTerm` is non-null:
    - Positioned absolutely at the right of the input
    - `aria-label="Clear search"`
    - `onClick` calls `onSearchChange(null)`
    - Tailwind: `text-stone-400 hover:text-stone-600`

### Group D — Tests (can be written in parallel with B and C; run after both land)

- [ ] D1. Integration tests in `src/test/FilterIntegration.test.tsx` (AC: 2, 3, 5, 6, 7, 8)
  - [ ] D1.1 **Search filters pins by name** — Given three restaurants, typing "Tokyo" in the search input renders only the matching pin.
  - [ ] D1.2 **Search is case-insensitive** — Typing "tokyo" (lowercase) matches "Tokyo Ramen".
  - [ ] D1.3 **Search + cuisine combined** — Typing "Place" with cuisine "Japanese" active shows only the Japanese restaurant whose name contains "Place".
  - [ ] D1.4 **Search + tier combined** — Typing "Place" with tier "loved" active shows only the loved restaurant whose name contains "Place".
  - [ ] D1.5 **Clear Filters resets search** — After typing in search, clicking "Clear all filters" clears the search input and restores all pins.
  - [ ] D1.6 **hasActiveFilters true when only search is active** — Typing in search (no other filters) makes the "Clear all filters" button appear.
  - [ ] D1.7 **Escape key clears search** — After typing, pressing Escape clears the input and restores all pins.
  - [ ] D1.8 **Empty search results** — Typing a term that matches no restaurants shows zero pins.

  Follow the mock pattern from existing `FilterIntegration.test.tsx`: `vi.mock("../hooks", ...)` with `vi.mocked(useRestaurants).mockReturnValue(...)`. Use `fireEvent.change` for input and `fireEvent.keyDown` for Escape. Query the search input via `screen.getByRole("searchbox")`.

## Dev Notes

### FilterState extension

`FilterState` in `src/types/restaurant.ts` currently holds `cuisine`, `tier`, and `maxDistance`. Add `searchTerm: string | null` as a fourth field. All fields default to `null` — "no filter active."

### App.tsx wiring

Follow the identical pattern used for tier (Story 3.4):

```typescript
// Initial state
const [filters, setFilters] = useState<FilterState>({
  cuisine: null,
  tier: null,
  maxDistance: null,
  searchTerm: null,
});

// filteredRestaurants — add search predicate first (cheapest check)
const filteredRestaurants = useMemo(
  () =>
    restaurants.filter((r) => {
      if (filters.searchTerm && !r.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
      if (filters.cuisine && r.cuisine !== filters.cuisine) return false;
      if (filters.tier && r.tier !== filters.tier) return false;
      if (effectiveMaxDistance !== null && coords !== null) {
        const dist = haversineDistance(coords.lat, coords.lng, r.lat, r.lng);
        if (dist > effectiveMaxDistance) return false;
      }
      return true;
    }),
  [restaurants, filters.searchTerm, filters.cuisine, filters.tier, effectiveMaxDistance, coords]
);

// hasActiveFilters
const hasActiveFilters =
  filters.searchTerm !== null || filters.cuisine !== null || filters.tier !== null || filters.maxDistance !== null;

// handleClearFilters
function handleClearFilters() {
  setFilters({ cuisine: null, tier: null, maxDistance: null, searchTerm: null });
}
```

Pass to FilterBar:
```typescript
searchTerm={filters.searchTerm}
onSearchChange={(term) => setFilters(f => ({ ...f, searchTerm: term }))}
```

### FilterBar search input

The search input sits above the chip rows, inside the outer `flex flex-col` container but before the `role="group" aria-label="Filters"` div. This keeps it visually prominent and semantically separate from the chip filter groups.

Use `mx-4 mt-2` for horizontal and top margin matching the chip row `px-4` spacing. Use `rounded-full` to match the pill-shaped chip aesthetic.

The search icon is a simple inline SVG magnifying glass (no icon library needed):
```tsx
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
</svg>
```

The clear X button is a simple inline SVG:
```tsx
<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
</svg>
```

### No debounce needed

With ~592 restaurants and a simple `string.includes` check, filtering completes well under 1ms. No debounce, no `useDeferredValue`, no external search library. Keep it simple.

### Escape key behavior

When the user presses Escape in the search input:
1. Clear the search term (`onSearchChange(null)`)
2. Blur the input (`e.currentTarget.blur()`) so the user returns to map interaction

### Existing test updates

Existing tests in `FilterIntegration.test.tsx` that render `<App>` will continue to work because `searchTerm` defaults to `null` (no filtering applied). No modifications to existing tests are needed.

### Project Structure Notes

- Files to modify:
  - `src/types/restaurant.ts` — add `searchTerm` field to `FilterState`
  - `src/components/FilterBar.tsx` — add search input and new props
  - `src/App.tsx` — wire state, memo predicate, and props
  - `src/test/FilterIntegration.test.tsx` — add search integration tests

- No new files are required. No CSS files beyond `src/index.css` (which is not touched).
- No new dependencies. Search icon and clear icon are inline SVGs.
- Do not use `@react-google-maps/api` or any library other than `@vis.gl/react-google-maps`.
- Do not add `any` types.

### References

- `FilterState` and `Tier` types: [Source: src/types/restaurant.ts]
- Existing filter rows (cuisine, tier, distance): [Source: src/components/FilterBar.tsx]
- Filter wiring, `filteredRestaurants` memo, `hasActiveFilters`, `handleClearFilters`: [Source: src/App.tsx#AppWithMap lines 76-104]
- Integration test patterns and mock setup: [Source: src/test/FilterIntegration.test.tsx]
- Design tokens and tier colors: [Source: CLAUDE.md#Key Conventions]
- Story 3.4 (tier filter) as implementation pattern reference: [Source: _bmad-output/implementation-artifacts/3-4-tier-list-type-filter.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
