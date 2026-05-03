# Story 6.3: Shareable Restaurant Links

Status: ready-for-dev

## Story

As a user browsing bobby.menu,
I want to share a direct link to a specific restaurant,
so that when I send it to a friend, they land directly on that restaurant with the pin selected and detail card open.

## Acceptance Criteria

1. **Route `/r/:slug` resolves to the map** — When a user navigates to `/r/:slug`, the app renders the same `AppWithMap` component as `/`, but passes the slug as a pre-selection parameter.

2. **Deep link auto-selects restaurant** — On page load with a `/r/:slug` URL, the app finds the matching restaurant by `id` field (existing slug IDs), selects it (opens the detail card), and centers the map on its coordinates.

3. **Invalid slug fallback** — If the slug doesn't match any restaurant, the app falls back to the default map view (Phoenix metro center) and shows a brief toast notification: "Restaurant not found".

4. **Share button on RestaurantCard** — A share/copy-link button appears on the RestaurantCard below the restaurant name. Clicking it copies the shareable URL (`{origin}/r/{restaurant.id}`) to the clipboard and shows a brief "Link copied!" confirmation.

5. **Web Share API on mobile** — On devices that support the Web Share API (`navigator.share`), the share button triggers the native share sheet instead of clipboard copy. The share includes the restaurant name as the title and the URL.

6. **Toast notification component** — A minimal toast component auto-dismisses after 2.5 seconds. Used for "Link copied!" and "Restaurant not found" messages. Positioned above the RestaurantCard on mobile, at bottom-right on desktop.

7. **URL updates on pin click** — When a user clicks a pin on the map, the browser URL updates to `/r/{restaurant.id}` using `replaceState` (no navigation/re-render). When the card is dismissed, the URL resets to `/`.

8. **Back button works** — Browser back button from a `/r/:slug` URL navigates back as expected (no broken history entries).

## Tasks / Subtasks

### Group A — Toast component (no dependencies; start immediately)

- [ ] A1. Create `src/components/Toast.tsx` (AC: 6)
  - [ ] A1.1 Create a `Toast` component with props: `message: string`, `visible: boolean`, `onHide: () => void`.
  - [ ] A1.2 When `visible` becomes true, auto-dismiss after 2500ms by calling `onHide`.
  - [ ] A1.3 Use Tailwind classes: `fixed z-50 px-4 py-2 rounded-lg bg-stone-800 text-white text-sm font-medium shadow-lg transition-opacity duration-300`. Position: `bottom-[calc(70vh+1rem)] left-1/2 -translate-x-1/2` on mobile, `bottom-6 right-6 left-auto translate-x-0` on md+.
  - [ ] A1.4 Fade in/out with opacity transition. When `visible` is false, set `opacity-0 pointer-events-none`.
  - [ ] A1.5 Export from `src/components/index.ts`.

### Group B — Routing and deep link resolution (depends on codebase understanding)

- [ ] B1. Add `/r/:slug` route in `src/App.tsx` (AC: 1, 2, 3, 8)
  - [ ] B1.1 Add a new `Route` element: `<Route path="/r/:slug" element={<AppWithMap apiKey={apiKey} />} />`.
  - [ ] B1.2 In `AppWithMap`, use `useParams()` from react-router-dom to extract `slug` parameter.
  - [ ] B1.3 Add a `useEffect` that runs when `restaurants` load and `slug` is present: find the restaurant where `r.id === slug`, call `setSelectedRestaurant(found)`. If not found, show toast "Restaurant not found".
  - [ ] B1.4 When a restaurant is found via deep link, center the map on its coordinates using `MapCenterer` — set an `initialCenter` state that overrides `resolvedCenter` when coming from a deep link.

### Group C — Share button on RestaurantCard (depends on Toast from A)

- [ ] C1. Add share button to `src/components/RestaurantCard.tsx` (AC: 4, 5)
  - [ ] C1.1 Add a share button below the restaurant name / tier badge area, before the Google Maps link.
  - [ ] C1.2 Implement share logic: if `navigator.share` is available, call `navigator.share({ title: restaurant.name, url })`. Otherwise, use `navigator.clipboard.writeText(url)`.
  - [ ] C1.3 Construct the URL as `${window.location.origin}/r/${restaurant.id}`.
  - [ ] C1.4 On successful copy/share, call a callback (`onShareSuccess`) that the parent uses to show the toast.
  - [ ] C1.5 Style the button: inline SVG share icon, Tailwind classes matching the existing card design tokens (`text-stone-500 hover:text-amber-700`).

### Group D — URL sync on pin click/dismiss (AC: 7)

- [ ] D1. Sync browser URL with selected restaurant in `src/App.tsx` (AC: 7)
  - [ ] D1.1 When `setSelectedRestaurant` is called with a restaurant, call `window.history.replaceState(null, '', `/r/${restaurant.id}`)`.
  - [ ] D1.2 When the card is dismissed (`setSelectedRestaurant(null)`), call `window.history.replaceState(null, '', '/')`.
  - [ ] D1.3 Use `replaceState` (not `pushState`) to avoid polluting the browser history with every pin click.

### Group E — Integration and toast wiring in App.tsx

- [ ] E1. Wire toast state and share callback in `src/App.tsx` (AC: 3, 4, 6)
  - [ ] E1.1 Add `toastMessage` and `toastVisible` state.
  - [ ] E1.2 Create `showToast(message: string)` helper that sets message and visible.
  - [ ] E1.3 Pass `onShareSuccess={() => showToast('Link copied!')}` to `RestaurantCard`.
  - [ ] E1.4 Show toast for "Restaurant not found" when deep link slug doesn't match.
  - [ ] E1.5 Render `<Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />` in AppWithMap.

### Group F — Tests

- [ ] F1. Unit test for Toast component (AC: 6)
  - [ ] F1.1 Test that toast renders with message when visible is true.
  - [ ] F1.2 Test that toast auto-hides after timeout.
  - [ ] F1.3 Test that toast is hidden when visible is false.

- [ ] F2. Integration test for deep link (AC: 1, 2, 3)
  - [ ] F2.1 Test that navigating to `/r/valid-slug` selects the matching restaurant.
  - [ ] F2.2 Test that navigating to `/r/nonexistent-slug` falls back to default map.
  - [ ] F2.3 Test that the toast shows "Restaurant not found" for invalid slugs.

- [ ] F3. Integration test for share button (AC: 4, 5)
  - [ ] F3.1 Test that clicking share copies URL to clipboard (mock navigator.clipboard).
  - [ ] F3.2 Test that share button triggers navigator.share when available (mock navigator.share).

## Dev Notes

### Routing architecture

The app already uses React Router with `BrowserRouter` in `main.tsx`. Current routes:
- `/` → `AppWithMap`
- `/admin` → Protected `AdminDashboard`
- `*` → Redirect to `/`

Add `/r/:slug` as a new route pointing to the same `AppWithMap` component. The slug is extracted via `useParams()` and used to pre-select a restaurant on load.

**Important:** The catch-all `*` route must remain LAST. Place `/r/:slug` before it.

### Restaurant ID reuse

Restaurants already have slug-based `id` fields generated by `generateSlugId()` in `src/utils/generateSlugId.ts`. These are URL-safe (lowercase, dashes, no special chars). Reuse these directly — do NOT create a new ID scheme.

Example IDs from the data: `"pho-43"`, `"tacos-el-patron"`, `"jg-steakhouse"`.

### URL sync strategy

Use `window.history.replaceState` (not React Router's `navigate`) to avoid re-renders when updating the URL on pin click. This is a cosmetic URL update — the actual state management happens via React state. The deep link route (`/r/:slug`) handles initial page load only.

### Map centering for deep links

When a deep link resolves to a restaurant, the map should center on that restaurant's coordinates. The existing `MapCenterer` component pans to user geolocation. For deep links, override this: if a restaurant was found via slug, pan to `{ lat: restaurant.lat, lng: restaurant.lng }` instead.

### Share button design

Place the share button inline with the restaurant name or as a small icon button in the card header. Use a standard share icon (arrow-up-from-box pattern). On mobile, the native share sheet provides a better UX than clipboard copy.

```tsx
// Share icon SVG (inline, no library)
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
</svg>
```

### Toast component

Keep it minimal — no animation library. Use Tailwind transitions (`transition-opacity duration-300`) and a `setTimeout` for auto-dismiss. The toast is rendered in `AppWithMap` and positioned above the RestaurantCard bottom sheet on mobile.

### Existing test patterns

Follow the mock pattern from `FilterIntegration.test.tsx`: `vi.mock("../hooks", ...)` with `vi.mocked(useRestaurants).mockReturnValue(...)`. For routing tests, wrap components in `<MemoryRouter initialEntries={['/r/test-slug']}>`.

### Project Structure Notes

- Files to create:
  - `src/components/Toast.tsx` — new toast notification component

- Files to modify:
  - `src/App.tsx` — add `/r/:slug` route, deep link resolution, URL sync, toast wiring
  - `src/components/RestaurantCard.tsx` — add share button
  - `src/components/index.ts` — export Toast

- No new dependencies. Share icon is inline SVG. Web Share API and Clipboard API are browser-native.
- Do not use `@react-google-maps/api` or any library other than `@vis.gl/react-google-maps`.
- Do not add `any` types.

### References

- Restaurant type with `id` slug field: [Source: src/types/restaurant.ts]
- Slug generation utility: [Source: src/utils/generateSlugId.ts]
- Current routing setup: [Source: src/App.tsx lines 48-66]
- AppWithMap with selectedRestaurant state: [Source: src/App.tsx lines 68-199]
- RestaurantCard component: [Source: src/components/RestaurantCard.tsx]
- BrowserRouter wrapper: [Source: src/main.tsx]
- Component barrel exports: [Source: src/components/index.ts]
- Story 6.2 as implementation pattern reference: [Source: _bmad-output/implementation-artifacts/6-2-search-by-restaurant-name.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
