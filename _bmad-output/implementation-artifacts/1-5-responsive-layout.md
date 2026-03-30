---
story_key: 1-5-responsive-layout
epic: 1
story: 5
status: in-progress
created: 2026-03-27
---

# Story 1.5: Responsive Layout

## User Story

As a user,
I want the app to work well on my phone, tablet, and laptop,
So that I can find restaurants whether I'm standing in a hallway or sitting at my desk.

## Acceptance Criteria

**Given** the user opens the app on a mobile device (screen width < 768px)
**When** the page renders
**Then** the map consumes the majority of the viewport
**And** the pin legend is positioned so it does not block map interaction
**And** all UI elements are usable on a 375px-wide screen without horizontal scrolling

**Given** the user opens the app on a tablet (768px - 1024px)
**When** the page renders
**Then** the layout adapts with appropriate spacing and sizing

**Given** the user opens the app on a desktop (screen width > 1024px)
**When** the page renders
**Then** the full functionality is available with a desktop-appropriate layout
**And** the map and all controls are fully functional

**Given** the static asset bundle
**When** the production build is created
**Then** the total bundle size (HTML, CSS, JS, restaurants.json) is under 500KB excluding Google Maps API payload (NFR4)

## Dev Notes

- This story is **primarily verification** since the full-viewport map layout (`width: 100vw; height: 100vh`) is inherently responsive across all screen sizes. No layout restructuring is expected.
- Tailwind v4 is configured via `@tailwindcss/vite` plugin — no `tailwind.config.js` needed. All responsive work uses Tailwind utility classes only.
- Mobile-first means the current implementation (full-viewport map, absolute-positioned PinLegend at `bottom-4 left-4`) is already optimal for all screen sizes.
- The `PinLegend` renders at the bottom-left corner (well away from map center and interactive controls). This is a non-blocking position on mobile.
- Loading and error overlays use `absolute inset-0 flex items-center justify-center` — centered at any viewport width including 375px.
- The config error screen uses `w-screen h-screen flex items-center justify-center` — also centered and responsive by default.
- Bundle size tracking (estimated from previous builds): JS ~224KB gzipped, CSS ~12KB, restaurants.json <50KB, HTML <1KB = total **well under 290KB**, comfortably below the 500KB NFR4 cap.
- If any responsive issues are found during audit tasks, they must be fixed before marking those tasks complete. Use Tailwind utility classes only for any fixes.
- All tests are in Vitest + React Testing Library. Run with `npm test`.

## Task Groups

### Group A: Audit and Verify Responsive Behavior

**A1 — Verify map fills viewport on all screen sizes**
- Confirm `AppWithMap` renders a container with `style={{ position: 'relative', width: '100vw', height: '100vh' }}` and the inner `<Map>` has `style={{ width: '100vw', height: '100vh' }}`.
- Source: `src/App.tsx` lines 53–60.
- Status: [x] PASS — verified. Outer div line 53: `position: 'relative', width: '100vw', height: '100vh'`; inner `<Map>` line 56: `width: '100vw', height: '100vh'`. No fix needed.

**A2 — Verify PinLegend does not block map interaction on mobile**
- Confirm `PinLegend` uses `absolute bottom-4 left-4` positioning (bottom-left corner).
- The bottom-left corner is away from the map center and standard map controls (zoom, street view appear bottom-right or top-right).
- Source: `src/components/PinLegend.tsx` line 15.
- Status: [x] PASS — verified. Line 15 className includes `absolute bottom-4 left-4`. No fix needed.

**A3 — Verify no horizontal scroll at 375px**
- All top-level elements use `vw`/`vh` or absolute positioning — none have fixed pixel widths exceeding viewport.
- The PinLegend content (3 rows, text + 3px swatch) is compact and well within 375px.
- The config error card uses `p-6 bg-white rounded shadow text-center` inside a centered flex container — no fixed width.
- Status: [x] PASS — verified. No element uses fixed px widths wider than viewport. All top-level containers use 100vw/100vh or absolute/relative positioning. No fix needed.

**A4 — Verify loading overlay is readable at 375px**
- Loading overlay: `absolute inset-0 flex items-center justify-center bg-white/60 pointer-events-none`
- Inner card: `p-6 bg-white rounded shadow text-center` with single-line text "Loading restaurants..."
- Status: [x] PASS — verified. `App.tsx` line 72 confirms exact classes. Centered at any viewport width including 375px. No fix needed.

**A5 — Verify error overlay is readable at 375px**
- Error overlay: `absolute inset-0 z-20 flex items-center justify-center bg-white/60`
- Inner card: `p-6 bg-white rounded shadow text-center` — same pattern as loading.
- Status: [x] PASS — verified. `App.tsx` line 80 confirms exact classes. Centered at any viewport width including 375px. No fix needed.

**A6 — Fix any responsive issues found in A1–A5**
- If any audit step fails, apply the minimum fix using Tailwind utility classes.
- No custom CSS; no layout restructuring.
- Status: [x] COMPLETE — No issues found. All A1–A5 audits passed without requiring fixes.

### Group B: Bundle Size Verification (NFR4)

**B1 — Run production build and capture dist/ sizes**
- Command: `npm run build`
- After build, list `dist/` and sum: `index.html` + all `.js` files + all `.css` files + `restaurants.json`
- Target: total < 500KB (excluding Google Maps API network payload)
- Status: [x] COMPLETE — Build successful. See B2 for sizes.

**B2 — Document NFR4 compliance**
- Record actual file sizes in this story's implementation notes once build is run.
- Mark NFR4 as PASS if total < 500KB.
- Status: [x] PASS — Total 242.26 KB, well under 500 KB cap. See NFR4 Compliance section below.

### Group C: Responsive Smoke Tests

Add tests to `src/App.test.tsx` (or a new `src/App.responsive.test.tsx` if preferred) covering:

- Status: [x] PASS — All 4 responsive smoke tests added to `src/App.test.tsx` and passing (28/28 tests pass).

**C1 — Map container renders with full-viewport dimensions**
```typescript
it('renders map container with full-viewport dimensions', () => {
  vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'AIza-real-key-123');
  const { container } = render(<App />);
  const mapWrapper = container.firstChild as HTMLElement;
  expect(mapWrapper).toHaveStyle({ width: '100vw', height: '100vh' });
});
```

**C2 — PinLegend renders at bottom-left corner**
```typescript
it('renders PinLegend with absolute bottom-left positioning', () => {
  vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'AIza-real-key-123');
  render(<App />);
  const legend = screen.getByRole('region', { name: 'Map Legend' });
  expect(legend.className).toMatch(/absolute/);
  expect(legend.className).toMatch(/bottom-4/);
  expect(legend.className).toMatch(/left-4/);
});
```

**C3 — Loading overlay is centered**
```typescript
it('loading overlay uses inset-0 centering when restaurants are loading', () => {
  // Mock fetch to never resolve so loading stays true
  vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));
  vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'AIza-real-key-123');
  const { container } = render(<App />);
  const overlay = container.querySelector('.absolute.inset-0.flex.items-center.justify-center');
  expect(overlay).toBeInTheDocument();
});
```

**C4 — Error overlay is centered**
```typescript
it('error overlay uses inset-0 centering', async () => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
  vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'AIza-real-key-123');
  render(<App />);
  const errorHeading = await screen.findByText('Data Error');
  const overlay = errorHeading.closest('.inset-0');
  expect(overlay).not.toBeNull();
});
```

## Implementation Notes

### Responsive Audit (Group A) — Completed 2026-03-27

All five audit checkpoints passed. No fixes were required. The existing implementation is inherently responsive:

- **A1 PASS:** Map container uses `width: 100vw, height: 100vh` (outer div + inner `<Map>`). Source: `src/App.tsx` lines 53, 56.
- **A2 PASS:** PinLegend uses `absolute bottom-4 left-4`, bottom-left corner away from map center and zoom controls. Source: `src/components/PinLegend.tsx` line 15.
- **A3 PASS:** No element has a fixed pixel width exceeding viewport. All containers use vw/vh or absolute positioning.
- **A4 PASS:** Loading overlay uses `absolute inset-0 flex items-center justify-center`. Source: `src/App.tsx` line 72.
- **A5 PASS:** Error overlay uses `absolute inset-0 z-20 flex items-center justify-center`. Source: `src/App.tsx` line 80.
- **A6 COMPLETE:** No fixes needed — all audits passed.

### NFR4 Compliance (Group B) — Build run 2026-03-27

Build tool: Vite v8.0.3. Build command: `npm run build`.

| File | Raw Size |
|------|----------|
| `dist/index.html` | 459 B (0.45 KB) |
| `dist/assets/index-BTjI-RUr.css` | 12,043 B (12.04 KB) |
| `dist/assets/index-Cw8sCHZX.js` | 224,158 B (224.15 KB) |
| `dist/restaurants.json` | 5,619 B (5.62 KB) |
| **Total** | **242,279 B (242.26 KB)** |

Gzip sizes (reported by Vite): HTML 0.29 KB, CSS 3.21 KB, JS 70.57 KB — gzipped total ~74 KB.

**NFR4 STATUS: PASS** — 242.26 KB raw total is 51.5% of the 500 KB cap. Margin: 257.74 KB remaining.

### Responsive Smoke Tests (Group C) — Completed 2026-03-27

Added a `describe('Responsive layout')` block to `src/App.test.tsx` with four tests:

- **C1 PASS:** Asserts `container.firstChild` has inline style `width: 100vw; height: 100vh`.
- **C2 PASS:** Asserts PinLegend (`role="region"` / `aria-label="Map Legend"`) className matches `/absolute/`, `/bottom-4/`, `/left-4/`.
- **C3 PASS:** With fetch never resolving (loading stays true), asserts "Loading restaurants..." text and `.absolute.inset-0.flex.items-center.justify-center` overlay are present.
- **C4 PASS:** With fetch rejecting, asserts "Could not load restaurant data" text appears async and its ancestor matches `.inset-0`.

All 28 tests pass (5 test files).

## File List

- `src/App.test.tsx` (modified — added `describe('Responsive layout')` block with C1–C4 tests)
