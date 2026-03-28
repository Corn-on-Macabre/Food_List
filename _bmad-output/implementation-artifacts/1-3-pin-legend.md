# Story 1.3: Pin Legend

Status: ready-for-dev

## Story

As a user,
I want to see a legend on the map explaining what each pin color means,
so that I understand the curation tiers without needing instructions.

## Acceptance Criteria

1. **Given** the map is displayed with restaurant pins **When** the user views the map **Then** a pin legend overlay is visible showing three entries: Gold = "Loved", Blue = "Recommended", Green = "On My Radar" **And** the legend is always visible without requiring interaction to reveal it **And** the legend does not obscure critical map content **And** the legend colors exactly match the pin colors on the map.

2. **Given** the legend is rendered **When** any screen size is used **Then** the legend is always visible and does not require the user to hover, click, or toggle to reveal it.

3. **Given** the legend is positioned on the map **When** the user interacts with map content (pan, zoom, click pins) **Then** the legend does not cover the center of the map or any region critical to navigation.

4. **Given** the legend displays tier colors **When** the color swatches are rendered **Then** the swatch colors match exactly the values in TIER_COLORS: loved = `#F59E0B`, recommended = `#3B82F6`, on_my_radar = `#10B981`.

## Tasks / Subtasks

### Group A: PinLegend Component (AC: 1, 2, 3, 4)

- [x] Create `src/components/PinLegend.tsx` (AC: 1, 2, 3, 4)
  - [x] Import `TIER_COLORS` from `'../constants/tierColors'`
  - [x] Import `Tier` type from `'../types'`
  - [x] Define a `TIER_LABELS` array (ordered: loved, recommended, on_my_radar) mapping each `Tier` to its display label: `"Loved"`, `"Recommended"`, `"On My Radar"`
  - [x] Render an outer `<div>` with: `role="region"` `aria-label="Map Legend"` and Tailwind classes for a white card: `absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 flex flex-col gap-1.5 z-10`
  - [x] For each tier entry render a row `<div>` with `className="flex items-center gap-2"`
  - [x] Inside each row render a color swatch: `<span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: TIER_COLORS[tier] }} />`
  - [x] Inside each row render a label: `<span className="text-xs text-gray-700 font-medium">{label}</span>`
  - [x] Component takes no props — it is purely presentational using the constants
  - [x] Verify the component compiles with `tsc --noEmit` with zero errors

- [x] Export `PinLegend` from `src/components/index.ts`
  - [x] Add `export { PinLegend } from './PinLegend';` to the existing `src/components/index.ts`

### Group B: Wire Into App.tsx (AC: 1, 2, 3)

- [x] Update `src/App.tsx` to render `PinLegend` inside the map container (AC: 1, 2, 3)
  - [x] Import `PinLegend` from `'./components'`
  - [x] Render `<PinLegend />` inside the outermost `<div>` of `AppWithMap` (the `relative` container), OUTSIDE of `<APIProvider>` / `<Map>` — it is a UI overlay, not a map element
  - [x] Place the `<PinLegend />` after the closing `</APIProvider>` tag and before the loading/error overlays
  - [x] Do NOT add any wrapper div or change the existing structure — a single self-closing `<PinLegend />` insertion is all that is needed
  - [x] Confirm the existing `position: 'relative'` on the outer div is still present (it was added in Story 1.2 — do not remove it)
  - [x] Run `tsc -b && vite build` and confirm zero errors

### Group C: Tests for PinLegend Component (AC: 1, 4)

- [x] Create `src/components/PinLegend.test.tsx` (AC: 1, 4)
  - [x] Import `render`, `screen` from `@testing-library/react`
  - [x] Test: renders without crashing
  - [x] Test: all three tier labels are present in the DOM — `"Loved"`, `"Recommended"`, `"On My Radar"` each found via `screen.getByText`
  - [x] Test: renders exactly three color swatches (query by a stable attribute — e.g., a `data-testid="tier-swatch"` or by querying `span` elements within the legend — pick whichever is consistent with the implementation)
  - [x] Test: each swatch has the correct `backgroundColor` inline style matching `TIER_COLORS` — `#F59E0B`, `#3B82F6`, `#10B981`
  - [x] Test: the outer container has `role="region"` and `aria-label="Map Legend"` (use `screen.getByRole('region', { name: 'Map Legend' })`)
  - [x] Run `vitest run` and confirm all tests pass

## Dev Notes

### File Locations

```
src/
  components/
    PinLegend.tsx          # New component — created in Group A
    PinLegend.test.tsx     # Component tests — created in Group C
    index.ts               # Modified to export PinLegend — updated in Group A
  App.tsx                  # Modified to render PinLegend — updated in Group B
```

### Component Positioning

`PinLegend` uses `absolute bottom-4 left-4` (Tailwind) to pin itself to the bottom-left corner of the map container. The parent `<div>` in `AppWithMap` already has `style={{ position: 'relative', width: '100vw', height: '100vh' }}` from Story 1.2 — this is the positioning context. The `z-10` class ensures the legend renders above the Google Map canvas. The bottom-left corner is the conventional legend position and avoids obscuring the center map area where users primarily interact.

### PinLegend Component Sketch

```tsx
// src/components/PinLegend.tsx
import { TIER_COLORS } from '../constants/tierColors';
import type { Tier } from '../types';

const TIER_ENTRIES: { tier: Tier; label: string }[] = [
  { tier: 'loved',        label: 'Loved' },
  { tier: 'recommended',  label: 'Recommended' },
  { tier: 'on_my_radar',  label: 'On My Radar' },
];

export function PinLegend() {
  return (
    <div
      role="region"
      aria-label="Map Legend"
      className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 flex flex-col gap-1.5 z-10"
    >
      {TIER_ENTRIES.map(({ tier, label }) => (
        <div key={tier} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full inline-block flex-shrink-0"
            style={{ backgroundColor: TIER_COLORS[tier] }}
          />
          <span className="text-xs text-gray-700 font-medium">{label}</span>
        </div>
      ))}
    </div>
  );
}
```

### App.tsx Insertion Point

The `<PinLegend />` goes in `AppWithMap`, inside the outermost `<div>`, outside of `<APIProvider>`:

```tsx
// AppWithMap return — after </APIProvider>, before loading/error overlays:
<div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
  <APIProvider apiKey={apiKey}>
    <Map ...>
      {restaurants.map(r => <RestaurantPin key={r.id} restaurant={r} />)}
    </Map>
  </APIProvider>

  <PinLegend />   {/* ← insert here */}

  {loading && ( ... )}
  {error !== null && ( ... )}
</div>
```

### TIER_COLORS Source of Truth

Always import from `src/constants/tierColors.ts`. Never hardcode hex values in `PinLegend.tsx`. The canonical values are:

```typescript
loved: '#F59E0B'       // gold
recommended: '#3B82F6' // blue
on_my_radar: '#10B981' // green
```

These must match the pin colors established in Story 1.2 (AC 4 of this story).

### Accessibility

- `role="region"` with `aria-label="Map Legend"` makes the legend a landmark for screen readers.
- Color alone does not convey meaning — each swatch is paired with a text label, satisfying WCAG 1.4.1 (Use of Color).

### Testing Pattern for Inline Styles

`@testing-library/react` surfaces inline styles via the DOM. To assert `backgroundColor`:

```tsx
const swatches = document.querySelectorAll('[data-testid="tier-swatch"]');
expect(swatches[0]).toHaveStyle({ backgroundColor: '#F59E0B' });
```

Or add `data-testid="tier-swatch"` to each `<span>` swatch to make querying reliable. Either approach is acceptable — be consistent.

### No Props Needed

`PinLegend` is a pure, static presentational component. It derives all content from the `TIER_COLORS` constant and the `TIER_ENTRIES` definition inside the file. No props are passed from `App.tsx`.

### Tailwind Version Note

This project uses Tailwind CSS v4 via `@tailwindcss/vite`. All standard utility classes (absolute, bottom-4, left-4, bg-white, rounded-lg, shadow-md, px-3, py-2, flex, flex-col, gap-1.5, z-10, items-center, gap-2, w-3, h-3, rounded-full, inline-block, flex-shrink-0, text-xs, text-gray-700, font-medium) are available without any additional configuration.

### References

- Epic 1, Story 1.3: `_bmad-output/planning-artifacts/epics.md` — full ACs
- Story 1.2 completed file: `_bmad-output/implementation-artifacts/1-2-restaurant-data-loading-and-pin-display.md` — established `TIER_COLORS`, positioning context in `App.tsx`
- `src/constants/tierColors.ts` — canonical tier color values (do NOT duplicate)
- `src/App.tsx` — existing structure; `AppWithMap` is the integration point
- NFR: No new NFRs introduced; legend is a static DOM element with negligible performance impact

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Group A complete (2026-03-27): Created `src/components/PinLegend.tsx` — purely presentational component with `role="region"` / `aria-label="Map Legend"`, three tier rows each with a `data-testid="tier-swatch"` color swatch and text label, colors sourced from `TIER_COLORS`. Added `export { PinLegend }` to `src/components/index.ts`. `tsc --noEmit` passed with zero errors.
- Group C complete (2026-03-27): Created `src/components/PinLegend.test.tsx` with 6 tests covering: render without crash, all three tier labels present, exactly three swatches rendered, and correct backgroundColor for each tier (loved gold, recommended blue, on_my_radar green). `vitest run` — 4 test files, 19 tests, all passed.
- Group B complete (2026-03-27): Updated `src/App.tsx` — added `PinLegend` to import from `'./components'`, inserted `<PinLegend />` after `</APIProvider>` and before loading/error overlays in `AppWithMap`. `tsc -b && vite build` passed with zero errors; `vitest run` — 4 test files, 19 tests, all passed.

### File List

- src/components/PinLegend.tsx
- src/components/PinLegend.test.tsx
- src/components/index.ts (modified)
- src/App.tsx (modified)

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-03-27 | Bob (SM) | Story file created, status set to ready-for-dev |
