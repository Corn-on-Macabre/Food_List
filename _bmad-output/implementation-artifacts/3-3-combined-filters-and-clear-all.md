# Story 3.3: Combined Filters & Clear All

Status: done

## Story

As a user,
I want to combine cuisine and distance filters and clear them all at once,
so that I can refine my search precisely and reset when I want to browse everything.

## Acceptance Criteria

1. **Given** both cuisine and distance filters are active **When** the map renders **Then** only restaurants matching BOTH the selected cuisine AND within the specified distance are shown — AND logic, already implemented in Story 3.1+3.2 (verified via existing tests).

2. **Given** one or more filters are active (`filters.cuisine !== null` OR `filters.maxDistance !== null`) **When** the user views the FilterBar **Then** a "Clear Filters" button is visible in the filter bar.

3. **Given** one or more filters are active **When** the user clicks "Clear Filters" **Then** both `filters.cuisine` and `filters.maxDistance` reset to null simultaneously in a single `setFilters` call, all pins reappear, and the map updates immediately.

4. **Given** no filters are active (both cuisine and maxDistance are null) **When** the user views the FilterBar **Then** the "Clear Filters" button is NOT visible (hidden, not disabled).

5. **Given** the user applies filters **When** they view the FilterBar **Then** the active filter state is visually indicated — the active cuisine chip shows amber-700 background, the active distance chip shows amber-700 background (both already implemented by Stories 3.1 and 3.2).

## Tasks / Subtasks

- [x] **Task 1:** Add `onClearFilters` and `hasActiveFilters` props to `FilterBarProps` (AC: 2, 3, 4)
  - [x] Extend `FilterBarProps` in `src/components/FilterBar.tsx`:
    ```typescript
    interface FilterBarProps {
      // ... existing props ...
      hasActiveFilters: boolean;
      onClearFilters: () => void;
    }
    ```
  - [x] Both props are required — no optionals
  - [x] Update the function signature destructuring to include the two new props

- [x] **Task 2:** Render "Clear Filters" button in `FilterBar` (AC: 2, 3, 4)
  - [x] Add a "Clear Filters" button that renders ONLY when `hasActiveFilters` is true
  - [x] Position: in a third row below the distance row (or inline at the end of the filter bar), right-aligned
  - [x] Use a wrapper div with `flex justify-end px-4 pb-2`:
    ```tsx
    {hasActiveFilters && (
      <div className="flex justify-end px-4 pb-2">
        <button
          onClick={onClearFilters}
          className="text-xs font-sans font-semibold text-amber-700 hover:text-amber-900 underline underline-offset-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 rounded"
        >
          Clear Filters
        </button>
      </div>
    )}
    ```
  - [x] Add `aria-label="Clear all filters"` on the button for screen reader clarity
  - [x] No chip styling — this is a text link button to differentiate from filter chips

- [x] **Task 3:** Wire `hasActiveFilters` and `onClearFilters` in `App.tsx` (AC: 2, 3, 4)
  - [x] Derive `hasActiveFilters` in `AppWithMap`:
    ```typescript
    const hasActiveFilters = filters.cuisine !== null || filters.maxDistance !== null;
    ```
    Note: use `filters.maxDistance` (not `effectiveMaxDistance`) so the clear button reflects user intent even when geolocation is unavailable.
  - [x] Add `onClearFilters` handler:
    ```typescript
    function handleClearFilters() {
      setFilters({ cuisine: null, maxDistance: null });
    }
    ```
  - [x] Pass both new props to `<FilterBar>`:
    ```tsx
    <FilterBar
      ...
      hasActiveFilters={hasActiveFilters}
      onClearFilters={handleClearFilters}
    />
    ```
    (done)

- [x] **Task 4:** Write unit tests for Clear Filters (AC: 2, 3, 4)
  - [x] Update `src/components/FilterBar.test.tsx` — add to `baseProps`:
    ```typescript
    hasActiveFilters: false,
    onClearFilters: vi.fn(),
    ```
  - [x] Test: "Clear Filters button is not visible when no filters active" (AC 4)
  - [x] Test: "Clear Filters button is visible when hasActiveFilters is true" (AC 2)
  - [x] Test: "clicking Clear Filters calls onClearFilters once" (AC 3)
  - [x] Test: "Clear Filters button has aria-label='Clear all filters'" (accessibility)

- [x] **Task 5:** Integration tests for combined filter + clear (AC: 1, 2, 3, 4)
  - [x] Extend `src/test/FilterIntegration.test.tsx` with a new describe block
  - [x] Use the 2-restaurant fixture from the existing cuisine filtering tests
  - [x] Test: "Clear Filters button absent when no filter active" (AC 4)
  - [x] Test: "Clear Filters appears after cuisine filter applied" (AC 2)
  - [x] Test: "clicking Clear Filters resets both filters and all pins reappear" (AC 3)
  - [x] Test: "Clear Filters button disappears after clearing filters" (AC 4)

## Dev Notes

### Architecture Context

Stories 3.1 and 3.2 are done. The combined filter (AND logic) is already fully implemented in `filteredRestaurants` memo in `App.tsx`. Story 3.3 only adds the "Clear Filters" affordance — no filter logic changes needed.

Current `AppWithMap` state:
```
- filters: FilterState { cuisine: string | null; maxDistance: number | null }
- setFilters: React.Dispatch<React.SetStateAction<FilterState>>
- effectiveMaxDistance: derived (null when geoDenied or coords===null)
- filteredRestaurants: useMemo using both filters
- cuisines: useMemo derived from raw restaurants
```

Story 3.3 adds:
- `hasActiveFilters`: derived boolean (one expression, no new state)
- `handleClearFilters`: single `setFilters({ cuisine: null, maxDistance: null })` call
- Two new `FilterBarProps`: `hasActiveFilters: boolean`, `onClearFilters: () => void`
- "Clear Filters" conditional render in `FilterBar`

### hasActiveFilters Derivation

```typescript
const hasActiveFilters = filters.cuisine !== null || filters.maxDistance !== null;
```

Key: use `filters.maxDistance` (user's stated intent), not `effectiveMaxDistance` (runtime value). This ensures the clear button appears when the user has *selected* a distance, even if location is currently unavailable. When the user clicks Clear, both reset to null — which is always correct regardless of geolocation state.

### Clear Button Design

Not a chip — a text link button. This distinguishes it from filter chips and indicates "destructive / reset" semantics:

- Typography: `text-xs font-sans font-semibold` (12px Karla 600 — same as chips)
- Color: `text-amber-700 hover:text-amber-900` (brand CTA color — matches DESIGN.md)
- Decoration: `underline underline-offset-2` (text link affordance)
- Animation: `transition-colors duration-150` (consistent with chips)
- Focus: `focus-visible:ring-2 focus-visible:ring-amber-200 rounded` (keyboard accessibility)
- Visibility: conditional render — not hidden/disabled — avoids layout shift on mobile

Position: right-aligned in a `flex justify-end` div below the chip rows. The FilterBar background and border-b remain unchanged.

### TypeScript Strict Mode

- No `any` types
- `hasActiveFilters: boolean` — required prop, not optional
- `onClearFilters: () => void` — required prop, not optional
- `handleClearFilters` in App.tsx: plain function, no params needed

### Accessibility

- Button is a `<button>` element (keyboard activatable with Enter/Space)
- `aria-label="Clear all filters"` provides screen-reader context beyond "Clear Filters" label text
- Focus ring: `focus-visible:ring-2 focus-visible:ring-amber-200`
- Not rendered when no filters active — avoids confusing inactive buttons for screen reader users

### Files to Create / Modify

| File | Change |
|------|--------|
| `src/components/FilterBar.tsx` | **Modify** — add 2 props, add Clear Filters conditional render |
| `src/components/FilterBar.test.tsx` | **Modify** — add hasActiveFilters/onClearFilters to baseProps, add 4 tests |
| `src/App.tsx` | **Modify** — derive hasActiveFilters, add handleClearFilters, pass new props |
| `src/test/FilterIntegration.test.tsx` | **Modify** — add 5 integration tests for clear all |

Do NOT modify:
- `src/types/restaurant.ts` — FilterState unchanged
- `src/utils/distance.ts` — no changes
- `src/hooks/` — no changes
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — orchestrator manages this

### No New Dependencies

Pure React state. No new packages. The `handleClearFilters` handler uses the existing `setFilters` with a literal object — no functional form needed since there are no intermediate state reads.

### Epic 3 Completion

After Story 3.3, Epic 3 is complete. All filtering (cuisine + distance + combined + clear) is implemented client-side. The `FilterState` type and `filters` state need no further changes for the remaining epics.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Senior Developer Review (AI)

### Review Follow-ups (AI)

### File List

### Agent Model Used

claude-sonnet-4-6 (story creator inline + dev agent + parallel code-review)

### Debug Log References

- F2 (revert amber-700 to amber-600) rejected: amber-700 was deliberately chosen in Story 3.2 review F6 for WCAG AA 4.6:1 contrast. amber-600 fails AA at 3.2:1. Kept amber-700.

### Completion Notes List

- All 5 tasks implemented and marked [x]
- 98 tests passing (90 baseline + 4 unit + 4 integration)
- ESLint + TypeScript clean

### Senior Developer Review (AI)

7 findings: 0 critical, 2 high, 3 medium, 2 low. F2 intentionally not applied (WCAG regression). All others resolved.

### Review Follow-ups (AI)

- [x] F1: Added inline comments in FilterBarProps explaining hasActiveFilters uses filters.maxDistance (user intent) not effectiveMaxDistance
- [x] F2: NOT applied — amber-700 is correct WCAG AA choice per Story 3.2 review F6; DESIGN.md spec of amber-600 fails AA contrast
- [x] F3: Changed focus ring from ring-amber-200 to ring-amber-600 in chipBase and Clear Filters button
- [x] F4: Added pt-1 border-t border-stone-100 to Clear Filters wrapper for visual separation
- [x] F5: Already resolved — tests were written (Tasks 4+5 marked [x])
- [x] F6: Added comment on activeDistance prop in FilterBarProps about effectiveMaxDistance behavior
- [x] F7: Moved Clear Filters outside role="group" div — now a sibling of filter chip group in accessibility tree

### File List

| File | Change |
|------|--------|
| src/components/FilterBar.tsx | Modified — 2 new props, Clear Filters button, ARIA restructure, focus ring fix |
| src/components/FilterBar.test.tsx | Modified — baseProps updated, 4 new tests |
| src/App.tsx | Modified — hasActiveFilters derived, handleClearFilters, FilterBar props updated |
| src/test/FilterIntegration.test.tsx | Modified — 4 new integration tests |
