# Story 1.4: User Geolocation & Map Centering

Status: ready-for-dev

## Story

As a user,
I want the map to auto-center on my current location,
so that I can immediately see restaurants near me without manual navigation.

## Acceptance Criteria

1. **Given** the user opens the app **When** the browser prompts for geolocation permission and the user grants it **Then** the map re-centers on the user's current coordinates **And** a `useGeolocation` hook manages the geolocation state.

2. **Given** the user opens the app **When** the user denies geolocation permission or the browser does not support it **Then** the map remains centered on the Phoenix metro default (33.4484, -112.0740) **And** no error is shown to the user — the app works normally without location.

3. **Given** the geolocation API returns coordinates **When** the map re-centers **Then** the transition is smooth and does not disrupt any pins already rendered.

## Tasks / Subtasks

### Group A: useGeolocation Hook (AC: 1, 2)

- [x] Create `src/hooks/useGeolocation.ts` (AC: 1, 2)
  - [x] Define return type interface: `{ coords: { lat: number; lng: number } | null; loading: boolean; denied: boolean }`
  - [x] Initialize state: `coords = null`, `loading = true`, `denied = false`
  - [x] In a `useEffect` with empty deps array, check if `navigator.geolocation` exists
  - [x] If `navigator.geolocation` is NOT available: set `loading = false`, leave `coords = null` — no error, no state change for `denied`
  - [x] If `navigator.geolocation` IS available: call `navigator.geolocation.getCurrentPosition(successCallback, errorCallback)`
  - [x] `successCallback(position)`: set `coords = { lat: position.coords.latitude, lng: position.coords.longitude }`, set `loading = false`
  - [x] `errorCallback(error)`: set `loading = false`; if `error.code === 1` (PERMISSION_DENIED) also set `denied = true`; leave `coords = null` in all error cases
  - [x] No AbortController needed — the Geolocation API handles its own lifecycle
  - [x] No PositionOptions needed — use default accuracy for MVP
  - [x] Verify the hook compiles with `tsc --noEmit` with zero errors

- [x] Export `useGeolocation` from `src/hooks/index.ts`
  - [x] Add `export { useGeolocation } from './useGeolocation';` to `src/hooks/index.ts`

### Group B: Wire Into App.tsx (AC: 1, 2, 3)

- [x] Import and call `useGeolocation` in `AppWithMap` (AC: 1, 2)
  - [x] Add `useGeolocation` to the import from `'./hooks'`: `import { useRestaurants, useGeolocation } from './hooks';`
  - [x] Call `const { coords, loading: geoLoading } = useGeolocation();` inside `AppWithMap` (alias `loading` to `geoLoading` to avoid shadowing the restaurants `loading`)
  - [x] Define `const mapCenter = coords ?? PHOENIX_CENTER;` — use user coords when available, fall back to Phoenix default

- [x] Switch Map from `defaultCenter` (uncontrolled) to `center` (controlled) prop (AC: 1, 3)
  - [x] Remove the `defaultCenter={PHOENIX_CENTER}` prop from `<Map>`
  - [x] Add `center={geoLoading ? PHOENIX_CENTER : mapCenter}` — only update center after geolocation resolves to avoid a jarring jump during load; while geolocation is still in-flight keep the map at Phoenix default
  - [x] Keep `defaultZoom={11}` unchanged — zoom does not change
  - [x] Keep `mapId`, `style`, and all other Map props unchanged
  - [x] Run `tsc -b && vite build` and confirm zero errors

### Group C: Tests for useGeolocation Hook (AC: 1, 2)

- [x] Create `src/hooks/useGeolocation.test.ts` (AC: 1, 2)
  - [x] Mock `navigator.geolocation` using `Object.defineProperty(navigator, 'geolocation', ...)` before each test; restore/reset after each test
  - [x] Test 1 — geolocation not available: set `navigator.geolocation` to `undefined`; render hook; assert `coords === null`, `loading === false`, `denied === false`
  - [x] Test 2 — geolocation succeeds: mock `getCurrentPosition` to call `successCallback` with `{ coords: { latitude: 33.5, longitude: -112.1 } }`; render hook; assert `coords = { lat: 33.5, lng: -112.1 }`, `loading === false`, `denied === false`
  - [x] Test 3 — permission denied: mock `getCurrentPosition` to call `errorCallback` with `{ code: 1 }`; render hook; assert `coords === null`, `loading === false`, `denied === true`
  - [x] Test 4 — other geolocation error: mock `getCurrentPosition` to call `errorCallback` with `{ code: 2 }`; render hook; assert `coords === null`, `loading === false`, `denied === false`
  - [x] Run `vitest run` and confirm all tests pass

## Dev Notes

### File Locations

```
src/
  hooks/
    useGeolocation.ts        # New hook — created in Group A
    useGeolocation.test.ts   # Hook tests — created in Group C
    index.ts                 # Modified to export useGeolocation — updated in Group A
  App.tsx                    # Modified to use useGeolocation and controlled center — updated in Group B
```

### Mocking navigator.geolocation in Vitest/jsdom

jsdom (the test environment used by Vitest in this project) does NOT implement `navigator.geolocation`. You must mock it manually. The standard pattern:

```typescript
// In beforeEach / within each test:
const mockGetCurrentPosition = vi.fn();

Object.defineProperty(navigator, 'geolocation', {
  value: { getCurrentPosition: mockGetCurrentPosition },
  configurable: true, // must be configurable so tests can re-define or restore
  writable: true,
});

// To simulate success:
mockGetCurrentPosition.mockImplementation((success) => {
  success({ coords: { latitude: 33.5, longitude: -112.1 } });
});

// To simulate error:
mockGetCurrentPosition.mockImplementation((_success, error) => {
  error({ code: 1 }); // PERMISSION_DENIED
});

// To simulate geolocation unavailable:
Object.defineProperty(navigator, 'geolocation', {
  value: undefined,
  configurable: true,
  writable: true,
});
```

Use `renderHook` from `@testing-library/react` to render the hook and `waitFor` to handle the async state updates:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';

const { result } = renderHook(() => useGeolocation());
await waitFor(() => expect(result.current.loading).toBe(false));
```

### Map center prop vs defaultCenter

The `@vis.gl/react-google-maps` `<Map>` component supports two patterns:

- `defaultCenter` — uncontrolled: sets the initial center but React does not control subsequent pan/zoom. The map ignores React re-renders for center.
- `center` — controlled: React owns the center. Every render with a new value causes the map to re-center.

Story 1.4 requires the map to re-center when geolocation resolves, so the controlled `center` prop must be used. The map will still allow user panning and zooming between renders.

To prevent a jarring double-center (Phoenix → user location) during the geolocation loading window, keep `center={PHOENIX_CENTER}` while `geoLoading` is `true`, then switch to `mapCenter` once loading resolves:

```tsx
<Map
  style={{ width: '100vw', height: '100vh' }}
  center={geoLoading ? PHOENIX_CENTER : mapCenter}
  defaultZoom={11}
  mapId="food-list-map"
>
```

### No Geolocation Error UI

Per ACs 2, no error message or loading indicator is shown for geolocation failures. The app silently falls back to the Phoenix default. Do NOT add a toast, banner, or any user-visible feedback for permission denial or geolocation errors.

### Hook Interface

```typescript
interface UseGeolocationResult {
  coords: { lat: number; lng: number } | null;
  loading: boolean;
  denied: boolean;
}
```

`denied` is exposed so future stories (e.g., Story 3.2: Distance Filter) can conditionally show/hide the distance filter control when geolocation is unavailable. It is not used in this story but must be returned from the hook.

### Hook Sketch

```typescript
// src/hooks/useGeolocation.ts
import { useState, useEffect } from 'react';

interface Coords {
  lat: number;
  lng: number;
}

interface UseGeolocationResult {
  coords: Coords | null;
  loading: boolean;
  denied: boolean;
}

export function useGeolocation(): UseGeolocationResult {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLoading(false);
      },
      (error) => {
        if (error.code === 1) setDenied(true);
        setLoading(false);
      }
    );
  }, []);

  return { coords, loading, denied };
}
```

### App.tsx Integration Sketch

```tsx
// In AppWithMap:
const { restaurants, loading, error } = useRestaurants();
const { coords, loading: geoLoading } = useGeolocation();

const mapCenter = coords ?? PHOENIX_CENTER;

// In the JSX:
<Map
  style={{ width: '100vw', height: '100vh' }}
  center={geoLoading ? PHOENIX_CENTER : mapCenter}
  defaultZoom={11}
  mapId="food-list-map"
>
```

### Geolocation Accuracy

No `PositionOptions` are passed to `getCurrentPosition` for MVP. Default accuracy is sufficient — the map re-centers to roughly the user's city-level location, which is all that is needed to surface nearby restaurants.

### References

- Epic 1, Story 1.4: `_bmad-output/planning-artifacts/epics.md` — full ACs
- `src/App.tsx` — current state; `AppWithMap` is the integration point; `PHOENIX_CENTER` constant already defined
- `src/hooks/useRestaurants.ts` — hook pattern to follow (useState + useEffect, typed interface)
- `src/hooks/index.ts` — export barrel to update
- `@vis.gl/react-google-maps` v1.8.1 — `center` prop for controlled map centering
- Story 3.2 (future): will consume `denied` from `useGeolocation` to conditionally render the distance filter

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Group A complete: `useGeolocation` hook created and exported from barrel; `tsc --noEmit` passes with zero errors.
- Group C (2026-03-27): Created `src/hooks/useGeolocation.test.ts` with 4 tests covering all geolocation states (unavailable, success, permission denied, other error). Used `Object.defineProperty` to mock `navigator.geolocation` in jsdom. All 4 tests pass; 24 total tests pass with zero failures.
- Group B (2026-03-27): Wired `useGeolocation` into `AppWithMap` in `src/App.tsx`. Added import, called hook with `geoLoading` alias, computed `mapCenter`, switched `<Map>` from uncontrolled `defaultCenter` to controlled `center={geoLoading ? PHOENIX_CENTER : mapCenter}`. Build passes (`tsc -b && vite build` zero errors); all 24 tests pass.

### File List

- `src/hooks/useGeolocation.ts` — created (new hook, Group A)
- `src/hooks/index.ts` — updated (added `useGeolocation` export, Group A)
- `src/hooks/useGeolocation.test.ts` — created (hook tests, Group C)
- `src/App.tsx` — updated (wired `useGeolocation`, controlled map center, Group B)

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-03-27 | Bob (SM) | Story file created, status set to ready-for-dev |
