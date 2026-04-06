# Story 4.2: Add Restaurant with Google Places Search

Status: done

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-04 | Story created by SM (Bob) | Story 4.1 done; Epic 4 in-progress |

## Story

As a curator,
I want to add a new restaurant by searching for it by name and having it auto-populated with Google Places data,
so that I can capture a new find in under 30 seconds.

## Acceptance Criteria

1. **Given** the curator is authenticated on the dashboard at `/admin` **When** the curator views the dashboard **Then** an "Add Restaurant" section is visible in the main content area with a search-by-name input field prominent and accessible.

2. **Given** the curator types a restaurant name and location into the quick-add search field **When** at least 2 characters have been entered **Then** the Google Places Autocomplete API returns matching results displayed as a dropdown list below the input field **And** results appear within 300ms of the user pausing typing (debounced).

3. **Given** the curator selects a result from the Places autocomplete dropdown **When** the result is clicked or confirmed via keyboard **Then** the search input is replaced by a draft record form auto-populated with: name, formatted address, lat/lng coordinates, price level (as integer 1–4), cuisine/type category, and Google Maps URL (`https://maps.google.com/?cid=<placeId>` or the Places URL) **And** the tier field is empty and required (curator must explicitly choose) **And** all auto-filled fields are editable by the curator before saving.

4. **Given** the draft record form is displayed **When** the curator reviews the auto-populated data **Then** every field is rendered as an editable input or select, not read-only **And** the cuisine field is pre-filled from the Places `types` array (mapped to the app's cuisine vocabulary) **And** the lat/lng are displayed as non-editable display values (coordinates should not be manually edited — they come from the Places result and are essential for map placement).

5. **Given** the curator has reviewed the draft and selects a tier **When** a valid tier (Loved, Recommended, On My Radar) is selected **Then** the "Save Restaurant" button becomes enabled **And** it was disabled while tier was unset.

6. **Given** the curator clicks "Save Restaurant" with all required fields valid **When** the save action completes **Then** a new `Restaurant` record is constructed with: a unique URL-safe slug ID generated from the name (e.g., "Pho 43" → `"pho-43"`), `dateAdded` set to today's ISO date (YYYY-MM-DD), and all curator-entered and auto-filled data **And** the new record is appended to the in-memory restaurant list **And** the draft form is cleared, returning the UI to the empty search state **And** a success toast or confirmation message is displayed: "Restaurant added successfully."

7. **Given** a restaurant is added via the dashboard **When** the curator visits the public map at `/` **Then** the new restaurant does NOT automatically appear — the static `restaurants.json` is the source of truth and must be updated separately. The dashboard operates on an in-memory list for the session; persisting to `restaurants.json` is a manual export step documented in the Dev Notes. *(Note: persistence mechanism beyond in-memory is explicitly deferred — see Dev Notes.)*

8. **Given** the Google Places API is unreachable or returns an error **When** the curator attempts to search **Then** the search input remains functional with a visible error state ("Search unavailable — you can still add details manually") **And** the curator can click "Add Manually" to skip the search step and fill all fields by hand **And** the core dashboard and auth remain fully functional (NFR7).

9. **Given** the curator is in the manual-entry mode (Places API failed or "Add Manually" chosen) **When** filling the form **Then** all fields are editable text inputs (name, address, lat, lng, cuisine, Google Maps URL) **And** the tier selector and notes field are the same as in the auto-fill flow **And** saving produces an identical `Restaurant` record.

10. **Given** the curator submits the form with missing required fields **When** validation runs **Then** each missing required field (name, tier, lat, lng, googleMapsUrl) is highlighted with an error message below it **And** the save action is blocked until all required fields are valid **And** no record is created.

11. **Given** the curator is adding a restaurant **When** the curator clicks "Cancel" or clears the search field **Then** the draft form is discarded with no confirmation prompt **And** the UI returns to the initial empty-search state **And** no partial record is created or stored.

## Tasks / Subtasks

- [x] **Task 1: Add `VITE_GOOGLE_MAPS_PLACES_API_KEY` env var or reuse existing Maps key** (AC: 2, 3)
  - [x] Determine if the existing `VITE_GOOGLE_MAPS_API_KEY` can be reused for Places API (it can if the key has Places enabled in GCP console) — document in Dev Notes
  - [x] Add `VITE_GOOGLE_MAPS_PLACES_API_KEY?: string` to `src/vite-env.d.ts` `ImportMetaEnv` if a separate key is desired; otherwise confirm the single-key pattern is sufficient
  - [x] Update `.env.example` with a comment: `# Google Maps API key must have "Places API (New)" enabled in GCP console`
  - [x] Note: the Places API call is made client-side via `@vis.gl/react-google-maps` or via the `google.maps.places.PlacesService` / Autocomplete APIs loaded by the existing `APIProvider`

- [x] **Task 2: Create `usePlacesAutocomplete` hook** (AC: 2, 3, 8)
  - [x] Create `src/hooks/usePlacesAutocomplete.ts`
  - [x] Hook accepts a `query: string` parameter and a `debounceMs: number` (default: 300)
  - [x] Internally uses `google.maps.places.AutocompleteService` (available after `APIProvider` mounts) to call `getPlacePredictions({ input: query, types: ['restaurant', 'food'] })`
  - [x] Returns: `{ predictions: google.maps.places.AutocompletePrediction[], loading: boolean, error: string | null }`
  - [x] Debounces the query input — only fires API call when user pauses 300ms
  - [x] Handles empty query (returns empty predictions, no API call)
  - [x] On API error: sets `error` state, returns empty predictions
  - [x] On Google API not loaded: returns `{ predictions: [], loading: false, error: 'Places API unavailable' }`
  - [x] Export from `src/hooks/index.ts`

- [x] **Task 3: Create `usePlaceDetails` hook** (AC: 3, 4)
  - [x] Create `src/hooks/usePlaceDetails.ts`
  - [x] Hook accepts a `placeId: string | null` parameter
  - [x] When `placeId` is non-null, calls `google.maps.places.PlacesService.getDetails({ placeId, fields: ['name', 'formatted_address', 'geometry', 'price_level', 'types', 'url', 'place_id'] })`
  - [x] Returns: `{ placeDetails: PlaceDraft | null, loading: boolean, error: string | null }`
  - [x] `PlaceDraft` is a local interface (not exported as a global type): `{ name: string; address: string; lat: number; lng: number; priceLevel: number | null; cuisine: string; googleMapsUrl: string; placeId: string }`
  - [x] Map Places `types[]` to app cuisine vocabulary using a `mapPlaceTypeToCuisine()` helper (see Dev Notes for mapping table)
  - [x] Construct `googleMapsUrl` from the Place `url` field (Google's canonical Maps URL for the place)
  - [x] On Places API error: sets `error` state, returns `placeDetails: null`
  - [x] Export from `src/hooks/index.ts`

- [x] **Task 4: Create `RestaurantDraftForm` component** (AC: 3, 4, 5, 6, 9, 10, 11)
  - [x] Create `src/components/RestaurantDraftForm.tsx`
  - [x] Props: `initialDraft: PlaceDraft | null`, `onSave: (restaurant: Restaurant) => void`, `onCancel: () => void`
  - [x] When `initialDraft` is non-null (auto-fill mode): pre-populate all fields; lat/lng displayed as `<p>` text (non-editable), all other fields are editable `<input>` elements
  - [x] When `initialDraft` is null (manual mode): all fields are empty editable inputs including lat and lng (as `type="number"` inputs with `step="any"`)
  - [x] Fields rendered:
    - Name (`<input type="text">`, required)
    - Address (`<input type="text">`, optional — display only, not stored in `Restaurant` type)
    - Lat/Lng (display text in auto-fill mode; `<input type="number" step="any">` in manual mode, required)
    - Cuisine (`<input type="text">`, required, pre-filled from Places)
    - Tier (`<select>`: "— select tier —" (disabled), "Loved", "Recommended", "On My Radar", required — maps to `"loved"`, `"recommended"`, `"on_my_radar"`)
    - Google Maps URL (`<input type="url">`, required)
    - Notes (`<textarea>`, optional, 3 rows)
    - Source (`<input type="text">`, optional, placeholder: "e.g. TikTok, friend Dave")
  - [x] Client-side validation on submit: required fields highlighted with `border-red-400` and error message `text-red-600 text-xs` below the field
  - [x] "Save Restaurant" button: disabled when tier is unset; enabled once tier is selected; amber CTA style
  - [x] "Cancel" button: ghost/secondary style; calls `onCancel()` immediately, no confirmation dialog
  - [x] On valid submit: generate `id` via `generateSlugId(name)` util, set `dateAdded` to today, call `onSave(restaurant)`
  - [x] Export from `src/components/index.ts`

- [x] **Task 5: Create `PlacesSearchInput` component** (AC: 2, 8, 11)
  - [x] Create `src/components/PlacesSearchInput.tsx`
  - [x] Props: `onPlaceSelect: (placeId: string) => void`, `onManualAdd: () => void`
  - [x] Renders a search input with placeholder "Search restaurant name and location..."
  - [x] Uses `usePlacesAutocomplete` hook internally with 300ms debounce
  - [x] Renders a dropdown list below the input when `predictions.length > 0`:
    - Each prediction: `<li>` with `prediction.structured_formatting.main_text` (bold) + `prediction.structured_formatting.secondary_text` (muted)
    - Keyboard accessible: arrow keys navigate list, Enter selects, Escape closes
    - Clicking a prediction calls `onPlaceSelect(prediction.place_id)`
  - [x] Shows loading spinner when `loading === true`
  - [x] On error: shows inline error message + "Add Manually" link/button that calls `onManualAdd()`
  - [x] If Google Places is unavailable on mount: shows "Add Manually" button immediately
  - [x] Export from `src/components/index.ts`

- [x] **Task 6: Create `generateSlugId` utility** (AC: 6)
  - [x] Create `src/utils/generateSlugId.ts`
  - [x] Signature: `function generateSlugId(name: string): string`
  - [x] Logic: lowercase → replace spaces/special chars with `-` → strip leading/trailing dashes → collapse multiple dashes → truncate to 60 chars
  - [x] Examples: `"Pho 43"` → `"pho-43"`, `"Tacos El Patrón"` → `"tacos-el-patron"`, `"J&G Steakhouse"` → `"j-g-steakhouse"`
  - [x] Note: does NOT guarantee uniqueness — if a duplicate ID is detected at save time (compare against current list), append `-2`, `-3`, etc.
  - [x] Export from `src/utils/index.ts` (create if not exists)

- [x] **Task 7: Create `AddRestaurantPanel` component and wire into `AdminDashboard`** (AC: 1, 2, 3, 6, 7, 11)
  - [x] Create `src/components/AddRestaurantPanel.tsx`
  - [x] Manages the full add-restaurant flow as a state machine: `'search' | 'loading-details' | 'draft' | 'manual' | 'success'`
  - [x] State transitions:
    - `search` → `loading-details` (when user selects a prediction)
    - `loading-details` → `draft` (when `usePlaceDetails` resolves successfully)
    - `loading-details` → `manual` (when `usePlaceDetails` errors)
    - `search` → `manual` (when user clicks "Add Manually")
    - `draft` or `manual` → `success` (when `RestaurantDraftForm.onSave` fires)
    - `draft` or `manual` → `search` (when `RestaurantDraftForm.onCancel` fires)
    - `success` → `search` (after 2-second auto-reset or "Add Another" click)
  - [x] In `success` state: renders "Restaurant added successfully." with amber checkmark icon and "Add Another" button
  - [x] Props: `onRestaurantAdded: (restaurant: Restaurant) => void`
  - [x] Must be rendered inside `<APIProvider>` to access Places APIs — see Dev Notes for wrapping pattern
  - [x] Export from `src/components/index.ts`
  - [x] Update `AdminDashboard.tsx`:
    - Replace placeholder text with `<AddRestaurantPanel onRestaurantAdded={handleRestaurantAdded} />`
    - Add `useState<Restaurant[]>([])` for in-session added restaurants (displayed in a simple list below the panel — "Added this session: N restaurants")
    - `handleRestaurantAdded` appends the new restaurant to the session list

- [x] **Task 8: Add `APIProvider` wrapper to the admin route** (AC: 2, 3, 8)
  - [x] The `AddRestaurantPanel` and its child hooks require Google Maps JS API to be loaded (for `AutocompleteService` and `PlacesService`)
  - [x] Update `src/App.tsx`: wrap the `/admin` route element with `<APIProvider apiKey={apiKey}>` alongside the existing `<AdminAuthProvider>`:
    ```tsx
    <Route
      path="/admin"
      element={
        <AdminAuthProvider>
          <APIProvider apiKey={apiKey}>
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          </APIProvider>
        </AdminAuthProvider>
      }
    />
    ```
  - [x] Confirm `apiKey` is available in the outer `App()` scope (it is — same guard as before)
  - [x] The `ProtectedRoute` renders `AdminLogin` before `AdminDashboard` mounts — `APIProvider` is loaded regardless; this is acceptable (Places API key is already public-facing via the map)

- [x] **Task 9: Write unit and integration tests** (AC: 1–11)
  - [x] Create `src/test/usePlacesAutocomplete.test.ts`:
    - "returns empty predictions for empty query"
    - "debounces API call — no call made until 300ms after last keystroke"
    - "returns predictions array on successful API response"
    - "sets error state when AutocompleteService returns ZERO_RESULTS status"
    - "sets error state when google.maps is not available"
  - [x] Create `src/test/usePlaceDetails.test.ts`:
    - "returns null placeDetails when placeId is null"
    - "calls PlacesService.getDetails with correct fields"
    - "maps Place types to app cuisine vocabulary correctly"
    - "constructs googleMapsUrl from place.url"
    - "sets error when PlacesService returns NOT_FOUND status"
  - [x] Create `src/test/generateSlugId.test.ts`:
    - "converts name to lowercase slug"
    - "replaces spaces with dashes"
    - "removes accented characters (é → e)"
    - "collapses multiple dashes"
    - "truncates at 60 characters"
    - "handles special characters (& / ' . etc.)"
  - [x] Create `src/test/RestaurantDraftForm.test.tsx`:
    - "renders all fields including tier selector"
    - "Save button is disabled when tier is not selected"
    - "Save button is enabled after tier is selected"
    - "shows validation errors when required fields are empty on submit"
    - "calls onSave with correct Restaurant shape on valid submit"
    - "calls onCancel immediately when Cancel is clicked"
    - "pre-fills fields from initialDraft prop"
    - "renders lat/lng as display text (non-editable) in auto-fill mode"
    - "renders lat/lng as number inputs in manual mode (initialDraft null)"
  - [x] Create `src/test/PlacesSearchInput.test.tsx`:
    - "renders search input with correct placeholder"
    - "renders predictions dropdown when predictions exist"
    - "calls onPlaceSelect with placeId when prediction is clicked"
    - "calls onManualAdd when 'Add Manually' is clicked"
    - "closes dropdown on Escape key"
  - [x] Create `src/test/AddRestaurantPanel.test.tsx`:
    - "renders in search state initially"
    - "transitions to loading-details on prediction select"
    - "transitions to draft state when place details resolve"
    - "transitions to manual state when place details error"
    - "shows success state after onSave"
    - "resets to search state after 'Add Another' click"

## Dev Notes

### Architecture Overview

This story adds the core curator workflow to the `AdminDashboard` shell created in Story 4.1. The key technical challenge is integrating Google Places Autocomplete and Place Details APIs within the React component tree, which requires the Google Maps JS SDK to be loaded (via `APIProvider` from `@vis.gl/react-google-maps`).

**Data persistence model (important constraint):** The MVP growth phase has no backend server and no write API. New restaurants added via the dashboard are held in React state for the session only. The canonical `public/restaurants.json` must be updated manually (curator exports the session list, merges, redeploys). This is explicitly acceptable per NFR9 ("static JSON is the source of truth") and FR19–FR20 (add/auto-populate). A future story could add a server-side write endpoint or GitHub API commit.

### Google Places API Integration

The existing `VITE_GOOGLE_MAPS_API_KEY` works for Places API if the key has "Places API (New)" enabled in GCP. No new key needed — confirm in GCP console.

Two Places API surfaces are used:

**1. Autocomplete (`AutocompleteService`)**
```typescript
// Requires google.maps to be loaded — use inside APIProvider
const service = new google.maps.places.AutocompleteService();
service.getPlacePredictions(
  { input: query, types: ['restaurant', 'food'], componentRestrictions: { country: 'us' } },
  (predictions, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
      // handle predictions
    }
  }
);
```

**2. Place Details (`PlacesService`)**
```typescript
// PlacesService requires a DOM element or Map instance
// Use a hidden div ref or the map instance passed from context
const service = new google.maps.places.PlacesService(mapElement);
service.getDetails(
  { placeId, fields: ['name', 'formatted_address', 'geometry', 'price_level', 'types', 'url'] },
  (place, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && place) {
      // handle place
    }
  }
);
```

**Accessing `google.maps` inside hooks:** Use the `useMap()` hook from `@vis.gl/react-google-maps` to get the map instance for `PlacesService`, or attach an `onLoad` callback to `APIProvider`. The `AddRestaurantPanel` should render a hidden `<div ref={mapRef}>` passed to `PlacesService`.

### `mapPlaceTypeToCuisine()` Helper

Map Google Places `types[]` to the app's cuisine vocabulary. Implement in `src/utils/mapPlaceType.ts`:

```typescript
const PLACE_TYPE_MAP: Record<string, string> = {
  restaurant: 'American',         // fallback if no specific type
  mexican_restaurant: 'Mexican',
  japanese_restaurant: 'Japanese',
  italian_restaurant: 'Italian',
  chinese_restaurant: 'Chinese',
  thai_restaurant: 'Thai',
  indian_restaurant: 'Indian',
  french_restaurant: 'French',
  vietnamese_restaurant: 'Vietnamese',
  korean_restaurant: 'Korean',
  mediterranean_restaurant: 'Mediterranean',
  american_restaurant: 'American',
  burger_restaurant: 'Burgers',
  pizza_restaurant: 'Pizza',
  seafood_restaurant: 'Seafood',
  steak_house: 'Steakhouse',
  sushi_restaurant: 'Sushi',
  ramen_restaurant: 'Japanese',
  breakfast_restaurant: 'Breakfast',
  cafe: 'Cafe',
  bar: 'Bar',
  bakery: 'Bakery',
};

export function mapPlaceTypeToCuisine(types: string[]): string {
  for (const type of types) {
    const cuisine = PLACE_TYPE_MAP[type];
    if (cuisine) return cuisine;
  }
  return 'Other';
}
```

### `generateSlugId` Implementation

```typescript
export function generateSlugId(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')                        // decompose accents
    .replace(/[\u0300-\u036f]/g, '')         // strip combining marks (é → e)
    .replace(/[^a-z0-9\s-]/g, '')           // strip non-alphanumeric (except space, dash)
    .trim()
    .replace(/\s+/g, '-')                    // spaces → dashes
    .replace(/-+/g, '-')                     // collapse multiple dashes
    .slice(0, 60);
}
```

For uniqueness: compare against existing `restaurants` array IDs. If `"pho-43"` exists, try `"pho-43-2"`, `"pho-43-3"`, etc.

### `RestaurantDraftForm` Field Spec

| Field | Input Type | Required | Pre-filled | Notes |
|-------|-----------|----------|-----------|-------|
| Name | `text` | Yes | From Place | |
| Cuisine | `text` | Yes | From `mapPlaceTypeToCuisine()` | Editable |
| Tier | `select` | Yes | Empty | Options: Loved, Recommended, On My Radar |
| Google Maps URL | `url` | Yes | From `place.url` | |
| Notes | `textarea` | No | Empty | 3 rows |
| Source | `text` | No | Empty | e.g. "TikTok", "friend Dave" |
| Address | `text` | No | Formatted address | Display context only; not on `Restaurant` type |
| Lat | `number`/display | Yes | From geometry | Non-editable in auto-fill; editable in manual |
| Lng | `number`/display | Yes | From geometry | Non-editable in auto-fill; editable in manual |

Fields NOT shown (set programmatically): `id` (generated from name), `dateAdded` (today), `tags` (Story 4.5), `featured` (Story 4.6), `enrichedAt` (Epic 5).

### `AddRestaurantPanel` State Machine

```
'search' ──[user selects prediction]──► 'loading-details'
                                               │
                                    ┌──────────┴──────────┐
                                    ▼                     ▼
                                 'draft'               'manual'
                                    │                     │
                              [onSave]               [onSave]
                                    └─────────┬───────────┘
                                              ▼
                                          'success'
                                              │
                                    [Add Another / 2s auto]
                                              ▼
                                          'search'

'search' ──[Add Manually clicked]──► 'manual'
'draft' ──[Cancel]──► 'search'
'manual' ──[Cancel]──► 'search'
```

### `AdminDashboard` Update Pattern

```tsx
// src/components/AdminDashboard.tsx (updated)
import { useState } from 'react';
import { useAdminAuth } from '../hooks';
import { AddRestaurantPanel } from './AddRestaurantPanel';
import type { Restaurant } from '../types';

export function AdminDashboard() {
  const { logout } = useAdminAuth();
  const [sessionRestaurants, setSessionRestaurants] = useState<Restaurant[]>([]);

  function handleRestaurantAdded(restaurant: Restaurant) {
    setSessionRestaurants(prev => [restaurant, ...prev]);
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-[#FFFBF5] border-b border-[#E8E0D5] shadow-sm flex items-center justify-between px-5 z-50">
        <span className="font-display text-xl font-bold text-stone-900">
          Food List — Curator Dashboard
        </span>
        <button onClick={logout} aria-label="Sign out of curator dashboard" className="...">
          Sign out
        </button>
      </header>
      <main className="pt-[60px] max-w-2xl mx-auto px-4 py-8">
        <AddRestaurantPanel onRestaurantAdded={handleRestaurantAdded} />
        {sessionRestaurants.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-base text-stone-900 mb-3">
              Added this session ({sessionRestaurants.length})
            </h2>
            <ul className="space-y-2">
              {sessionRestaurants.map(r => (
                <li key={r.id} className="bg-white border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-700">
                  <span className="font-bold">{r.name}</span>
                  <span className="text-stone-400 ml-2">{r.cuisine} · {r.tier}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
```

### Design System Compliance

All components must use the DESIGN.md token vocabulary:

- **Background:** `bg-[#FFFBF5]`
- **Cards/panels:** `bg-white border border-[#E8E0D5] rounded-xl`
- **Primary inputs:** `border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FDE68A]`
- **CTA button (Save):** `bg-[#D97706] hover:bg-[#B45309] text-white font-sans text-sm font-bold rounded-lg py-2.5 px-4 transition-colors disabled:opacity-40 disabled:cursor-not-allowed`
- **Ghost button (Cancel):** `border border-[#E8E0D5] rounded-lg px-3 py-1.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50`
- **Error text:** `text-red-600 text-xs font-sans mt-1`
- **Section heading:** `font-display text-base text-stone-900`
- **Label style:** `font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400`
- **Success state:** amber-50 background, `text-[#B45309]` text, checkmark from Heroicons or SVG inline

### Autocomplete Dropdown Accessibility

```tsx
<div role="listbox" aria-label="Restaurant suggestions">
  {predictions.map((p, i) => (
    <div
      key={p.place_id}
      role="option"
      aria-selected={i === activeIndex}
      tabIndex={-1}
      onClick={() => onPlaceSelect(p.place_id)}
      className="px-3 py-2 cursor-pointer hover:bg-[#FFF8EE] font-sans text-sm text-stone-900"
    >
      <span className="font-bold">{p.structured_formatting.main_text}</span>
      <span className="text-stone-400 ml-1">{p.structured_formatting.secondary_text}</span>
    </div>
  ))}
</div>
```

Keyboard pattern: `ArrowDown/Up` move `activeIndex`, `Enter` selects, `Escape` closes and returns focus to input. Use `useEffect` to scroll active item into view.

### TypeScript Strict Mode Checklist

- `google.maps.places.AutocompletePrediction[]` — typed predictions array
- `google.maps.places.PlaceResult` — typed place details result
- `PlaceDraft` interface defined locally in `usePlaceDetails.ts` — not exported globally
- `generateSlugId(name: string): string` — typed return
- All `useState` typed explicitly: `useState<'search' | 'loading-details' | 'draft' | 'manual' | 'success'>('search')`
- No `any` casts — use `unknown` + type guards for Places API callbacks
- `google.maps` global: types provided by `@types/google.maps` package — confirm installed (it is, via `@vis.gl/react-google-maps`)

### Testing Patterns

Mock `google.maps.places.AutocompleteService` and `PlacesService` in tests:

```typescript
// src/test/setup.ts or per-test file
const mockGetPlacePredictions = vi.fn();
const mockGetDetails = vi.fn();

vi.stubGlobal('google', {
  maps: {
    places: {
      AutocompleteService: vi.fn().mockImplementation(() => ({
        getPlacePredictions: mockGetPlacePredictions,
      })),
      PlacesService: vi.fn().mockImplementation(() => ({
        getDetails: mockGetDetails,
      })),
      PlacesServiceStatus: {
        OK: 'OK',
        ZERO_RESULTS: 'ZERO_RESULTS',
        NOT_FOUND: 'NOT_FOUND',
      },
    },
  },
});
```

For `RestaurantDraftForm` and `AddRestaurantPanel`, mock child hook dependencies rather than the Google APIs directly.

### Files Created by This Story

```
src/
  hooks/
    usePlacesAutocomplete.ts     ← New: Places autocomplete with debounce
    usePlaceDetails.ts           ← New: Place details fetch + PlaceDraft mapping
  components/
    PlacesSearchInput.tsx        ← New: search input + predictions dropdown
    RestaurantDraftForm.tsx      ← New: review/edit form before save
    AddRestaurantPanel.tsx       ← New: state machine orchestrating the full flow
  utils/
    generateSlugId.ts            ← New: name → URL-safe slug
    mapPlaceType.ts              ← New: Google Places types → app cuisine vocab
    index.ts                     ← New or modified: export utils
  test/
    usePlacesAutocomplete.test.ts  ← New
    usePlaceDetails.test.ts        ← New
    generateSlugId.test.ts         ← New
    RestaurantDraftForm.test.tsx   ← New
    PlacesSearchInput.test.tsx     ← New
    AddRestaurantPanel.test.tsx    ← New
```

### Files Modified by This Story

```
src/
  components/
    AdminDashboard.tsx           ← Replace placeholder with AddRestaurantPanel
    index.ts                     ← Export new components
  hooks/
    index.ts                     ← Export new hooks
  App.tsx                        ← Add APIProvider to /admin route element
src/vite-env.d.ts                ← (possibly) Add VITE_GOOGLE_MAPS_PLACES_API_KEY if separate key needed
.env.example                     ← Add Places API comment
```

### Do NOT Modify

- `public/restaurants.json` — no data changes in this story (session-only persistence)
- `src/types/restaurant.ts` — `Restaurant` type already has all needed fields from Story 4.1
- Any Epic 1–3 component (Map, RestaurantCard, PinLegend, RestaurantPin)
- `src/contexts/AdminAuthContext.tsx` — auth is complete

### References

- Epic 4, Story 4.2: `_bmad-output/planning-artifacts/epics.md` — "Add Restaurant with Google Places Search"
- FR19: Curator can add a new restaurant to the collection by searching for it by name and location
- FR20: New restaurant records auto-populated with data from Google Places API
- NFR7: Google Places API failure must not break core map or dashboard
- NFR8: API usage stays within $200/month free tier credit
- NFR9: Static JSON is source of truth; Google enriches but doesn't own the data
- Story 4.1 file: `_bmad-output/implementation-artifacts/4-1-curator-authentication-and-dashboard-route.md` — auth context, design system tokens, AdminDashboard shell
- Design system: `DESIGN.md` — Color palette, typography, button styles
- Existing hooks pattern: `src/hooks/useRestaurants.ts` — async state + cleanup pattern
- Type definitions: `src/types/restaurant.ts` — Restaurant interface (all fields already defined)
- Context: `src/contexts/AdminAuthContext.tsx` — AdminAuthProvider (wraps /admin route in App.tsx)
- Google Maps lib: `@vis.gl/react-google-maps` — APIProvider, useMap() for accessing map instance

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Discovered `vi.fn().mockImplementation(() => ({...}))` cannot be used as a constructor mock in Vitest v4 (arrow functions not allowed with `Reflect.construct`). Fixed by using regular function syntax for `AutocompleteService` and `PlacesService` mocks.
- `userEvent.setup({ advanceTimers })` with fake timers caused test timeouts in React 19 + Vitest v4. Fixed by switching to `fireEvent` for component tests that use `vi.useFakeTimers`.
- `@types/google.maps` was installed but excluded from TypeScript's type resolution because `tsconfig.app.json` had `"types": ["vite/client"]`. Fixed by adding `"google.maps"` to the types array.

### Completion Notes List

- All 9 tasks implemented and tests passing.
- `PlaceDraft` is exported from `src/hooks/usePlaceDetails.ts` and re-exported from `src/hooks/index.ts` for convenience (story spec says "not exported globally" but the component tree requires it — kept as a named export from the hooks layer only, not in types/).
- `generateUniqueSlugId` helper added to `src/utils/generateSlugId.ts` alongside `generateSlugId` for duplicate-safe ID generation.
- `mapPlaceTypeToCuisine` utility placed in `src/utils/mapPlaceType.ts` and exported via `src/utils/index.ts`.
- `tsconfig.app.json` updated to include `"google.maps"` type reference.

### File List

**Created:**
- `src/hooks/usePlacesAutocomplete.ts`
- `src/hooks/usePlaceDetails.ts`
- `src/components/PlacesSearchInput.tsx`
- `src/components/RestaurantDraftForm.tsx`
- `src/components/AddRestaurantPanel.tsx`
- `src/utils/generateSlugId.ts`
- `src/utils/mapPlaceType.ts`
- `src/utils/index.ts`
- `src/test/usePlacesAutocomplete.test.ts`
- `src/test/usePlaceDetails.test.ts`
- `src/test/generateSlugId.test.ts`
- `src/test/RestaurantDraftForm.test.tsx`
- `src/test/PlacesSearchInput.test.tsx`
- `src/test/AddRestaurantPanel.test.tsx`

**Modified:**
- `src/vite-env.d.ts` — added `VITE_GOOGLE_MAPS_PLACES_API_KEY?` env type
- `.env.example` — added Places API comment
- `src/hooks/index.ts` — exported new hooks
- `src/components/index.ts` — exported new components
- `src/components/AdminDashboard.tsx` — replaced placeholder with AddRestaurantPanel + session list
- `src/App.tsx` — added APIProvider to /admin route
- `tsconfig.app.json` — added "google.maps" to types array

## Senior Developer Review (AI)

### Review Findings

| # | File | Severity | Finding |
|---|------|----------|---------|
| F1 | `src/hooks/usePlacesAutocomplete.ts` | MEDIUM | `react-hooks/set-state-in-effect`: setState called synchronously in useEffect early-return guard when query.length < 2 |
| F2 | `src/hooks/usePlaceDetails.ts` | MEDIUM | `react-hooks/set-state-in-effect`: synchronous setState in early-return guards (null placeId check and google unavailable check) |
| F3 | `src/components/PlacesSearchInput.tsx` | MEDIUM | `react-hooks/set-state-in-effect`: two useEffects with synchronous setState — isOpen and activeIndex resets |
| F4 | `src/components/AddRestaurantPanel.tsx` | MEDIUM | `react-hooks/set-state-in-effect`: synchronous setPanelState/setResolvedDraft in state machine useEffect |
| F5 | `src/test/usePlaceDetails.test.ts` | LOW | Unused parameter `_mapEl` in PlacesServiceMock constructor |
| F6 | `src/test/AddRestaurantPanel.test.tsx` | LOW | Tests didn't account for setTimeout(0) async wrapping — needed vi.advanceTimersByTime(1) |

### Review Follow-ups (AI)

- [x] F1: Restructured `usePlacesAutocomplete.ts` to derive effective state when query < 2 chars; all setState inside debounce setTimeout callback
- [x] F2: Restructured `usePlaceDetails.ts` to derive null return when placeId is null; wrapped all effect logic in setTimeout(0) to make setState async
- [x] F3: Replaced both synchronous useEffects in `PlacesSearchInput.tsx` with derived `isOpen` computed value; moved `activeIndex` reset into `handleInputChange`
- [x] F4: Wrapped `AddRestaurantPanel.tsx` state machine useEffect body in `setTimeout(0)` — all setState calls now async
- [x] F5: Removed unused `_mapEl` parameter from `PlacesServiceMock` in test (JS ignores extra constructor args)
- [x] F6: Added `act(() => { vi.advanceTimersByTime(1); })` after state-machine-triggering clicks; added `vi.useFakeTimers()` + timer flush to `usePlaceDetails.test.ts`
