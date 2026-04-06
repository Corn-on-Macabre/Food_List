# Story 1.7: Mobile Sticky Filter Bar and Legend

Status: done

## Story

As a mobile user,
I want the filter bar and map legend to remain visible while interacting with the map,
so that I can change filters or reference tier colors without scrolling back to the top.

## Acceptance Criteria

1. The filter bar (cuisine + distance chips) stays pinned to the top of the viewport on all screen sizes, including mobile browsers where the address bar is visible.
2. The map legend stays pinned to its position (bottom-left) on all screen sizes — it does not scroll out of view.
3. The map fills the remaining viewport area beneath the filter bar without content overlap.
4. No regressions on desktop layout — filter bar and legend remain visually identical to current behaviour.

## Tasks / Subtasks

- [x] Fix filter bar wrapper to use fixed positioning (AC: #1, #3)
  - [x] Change `absolute` to `fixed` on the filter bar wrapper div in `App.tsx`
  - [x] Remove `position: relative` from the outer container (no longer needed to anchor the overlay)
- [x] Fix PinLegend to use fixed positioning (AC: #2)
  - [x] Change `absolute` to `fixed` in `PinLegend.tsx`
- [x] Verify map fills viewport correctly with fixed overlays (AC: #3, #4)

## Dev Notes

- Root cause: iOS Safari interprets `100vh` as the full height including browser chrome. The `absolute`-positioned filter bar and legend are relative to the `100vh` container, so when the browser chrome is visible, the container is taller than the visual viewport and elements can be scrolled out of view.
- Fix: use `position: fixed` for overlaid UI elements so they are always positioned relative to the visual viewport, not the containing block.
- The outer `div` has `style={{ position: 'relative', width: '100vw', height: '100vh' }}` — the `position: relative` is only needed to anchor `absolute` children; once children are `fixed`, it can remain (harmless) or be removed.
- `PinLegend` renders its own `absolute bottom-4 left-4` — change to `fixed bottom-4 left-4`.

### Project Structure Notes

- `src/App.tsx` — filter bar wrapper div change: `absolute` → `fixed`
- `src/components/PinLegend.tsx` — legend div change: `absolute` → `fixed`

### References

- [Source: src/App.tsx#L116] filter bar wrapper
- [Source: src/components/PinLegend.tsx#L13] legend positioning

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- src/App.tsx
- src/components/PinLegend.tsx
