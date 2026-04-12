# Story 6.1: Auto-Populate Restaurant Details from Address Input

Status: ready-for-dev

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-11 | Story created by SM (Bob) | Epic 6 started; curator QoL enhancement to eliminate manual lat/lng entry |

## Story

As a curator,
I want the manual-entry mode to auto-populate lat/lng from an address autocomplete field,
so that I never have to look up and type raw coordinates when adding a restaurant.

## Context & Gap Analysis

Story 4.2 implemented a full Google Places Autocomplete flow (`PlacesSearchInput` -> `usePlaceDetails` -> `RestaurantDraftForm`) that auto-fills name, address, lat/lng, cuisine, etc. from a restaurant search. However, the **manual entry fallback** (triggered by clicking "Add Manually" or when the Places API is down) still requires the curator to type raw latitude/longitude numbers into `<input type="number">` fields. This is the gap.

**Current manual-entry pain points:**
1. Lat/lng are raw number inputs (`RestaurantDraftForm.tsx` lines 169-209) with no way to derive them from an address.
2. The curator must leave the app, find coordinates in Google Maps, and manually copy them.
3. There is no address-to-coordinates flow in manual mode at all.

**This story eliminates that gap by:**
1. Adding an `AddressGeocodeInput` component that uses Google Places Autocomplete (type `geocode` or `address`) to let the curator type an address and have lat/lng auto-populated.
2. Integrating this component into the manual-entry section of `RestaurantDraftForm` so the lat/lng number inputs are replaced with the address autocomplete + auto-filled coordinates.
3. Keeping a manual coordinate override as a disclosed fallback for edge cases (e.g., food trucks with no address).

## Acceptance Criteria

1. **Given** the curator is in manual-entry mode in `RestaurantDraftForm` (i.e., `initialDraft` is null) **When** the form renders **Then** the lat/lng raw number inputs are replaced by an `AddressGeocodeInput` component that shows a text input with placeholder "Type an address to auto-fill coordinates..." **And** a "Lat/Lng" display area below it shows the resolved coordinates or "No address selected" in muted text.

2. **Given** the curator types at least 3 characters into the address autocomplete field **When** the input is debounced (300ms) **Then** Google Places Autocomplete API returns address predictions (using types `['address']` or `['geocode']`) displayed as a dropdown list **And** predictions appear within 300ms of the user pausing typing.

3. **Given** the curator selects an address prediction from the dropdown **When** the prediction is selected (click or keyboard Enter) **Then** the form's `lat`, `lng`, and `address` fields are auto-populated from the Places Geocoding response **And** the coordinate display updates to show the resolved lat/lng values **And** the address input updates to show the formatted address.

4. **Given** the curator has selected an address and coordinates are populated **When** the curator views the form **Then** the lat/lng values are displayed as read-only text (same style as auto-fill mode) **And** a small "Edit manually" link is visible below the coordinates that, when clicked, switches to raw number inputs for lat/lng.

5. **Given** the curator clicks "Edit manually" to override coordinates **When** the raw inputs appear **Then** they are pre-filled with the current lat/lng values (from the geocoded address or empty) **And** the curator can type arbitrary coordinates **And** a "Use address lookup" link returns to the autocomplete mode.

6. **Given** the Google Places API is unreachable **When** the address autocomplete field is rendered **Then** an error message appears: "Address lookup unavailable" **And** the form falls back to showing raw lat/lng number inputs directly (same as current behavior) **And** the rest of the form is fully functional.

7. **Given** the curator is in auto-fill mode (selected a restaurant from `PlacesSearchInput`) **When** the `RestaurantDraftForm` renders with a non-null `initialDraft` **Then** the lat/lng section remains unchanged (read-only coordinate display, no address autocomplete needed) **And** this story introduces no regressions to the auto-fill flow.

8. **Given** the curator submits the form after using address autocomplete **When** validation runs **Then** lat and lng are still validated as required numeric fields **And** the `Restaurant` record is constructed identically to the current flow **And** the `address` field from the geocode is stored in the form state but not persisted to the `Restaurant` type (address is not in the `Restaurant` interface).

## Tasks / Subtasks

### Task Group A: Address Autocomplete Hook (can be done in parallel with Task Group B)

- [x] **Task 1: Create `useAddressAutocomplete` hook** (AC: 2, 6)
  - [x] 1.1 Create `src/hooks/useAddressAutocomplete.ts`
  - [x] 1.2 Hook signature: `useAddressAutocomplete(query: string, debounceMs?: number)` returning `{ predictions: google.maps.places.AutocompletePrediction[], loading: boolean, error: string | null }`
  - [x] 1.3 Internally uses `google.maps.places.AutocompleteService.getPlacePredictions()` with `{ input: query, types: ['geocode'] }` -- note: uses `'geocode'` type instead of `'restaurant'`/`'food'` to match addresses rather than restaurant names
  - [x] 1.4 Same debounce pattern as existing `usePlacesAutocomplete.ts` (300ms default, skip for query < 3 chars)
  - [x] 1.5 Same API-unavailable and error handling pattern as `usePlacesAutocomplete.ts`
  - [x] 1.6 Export from `src/hooks/index.ts`
  - [x] 1.7 **Implementation note:** This hook is intentionally separate from `usePlacesAutocomplete` (not a refactor of it) because the `types` parameter differs and the two hooks serve different purposes. If a future story wants to merge them with a configurable `types` param, that is a separate refactor story.

- [x] **Task 2: Create `useAddressGeocode` hook** (AC: 3, 6)
  - [x] 2.1 Create `src/hooks/useAddressGeocode.ts`
  - [x] 2.2 Hook signature: `useAddressGeocode(placeId: string | null)` returning `{ result: { lat: number; lng: number; formattedAddress: string } | null, loading: boolean, error: string | null }`
  - [x] 2.3 When `placeId` is non-null, call `google.maps.places.PlacesService.getDetails()` with `{ placeId, fields: ['geometry', 'formatted_address'] }` -- minimal fields to keep within API quota (NFR8)
  - [x] 2.4 Extract `geometry.location.lat()`, `geometry.location.lng()`, and `formatted_address` from the response
  - [x] 2.5 Same DOM-element pattern as existing `usePlaceDetails.ts` (hidden div ref for `PlacesService`)
  - [x] 2.6 Same error handling pattern as `usePlaceDetails.ts`
  - [x] 2.7 Export from `src/hooks/index.ts`
  - [x] 2.8 **Alternative approach considered:** Using `google.maps.Geocoder` instead of `PlacesService.getDetails`. The Geocoder approach would work but `PlacesService.getDetails` is already proven in this codebase (`usePlaceDetails.ts`) and the autocomplete already gives us a `place_id`. Stick with the proven pattern.

### Task Group B: Address Geocode Input Component (can be done in parallel with Task Group A)

- [x] **Task 3: Create `AddressGeocodeInput` component** (AC: 1, 2, 3, 4, 5, 6)
  - [x] 3.1 Create `src/components/AddressGeocodeInput.tsx`
  - [x] 3.2 Props interface:
    ```typescript
    interface AddressGeocodeInputProps {
      lat: string;            // current lat value from parent form
      lng: string;            // current lng value from parent form
      address: string;        // current address value from parent form
      onCoordsResolved: (lat: string, lng: string, address: string) => void;
      onManualEdit: (field: 'lat' | 'lng', value: string) => void;
    }
    ```
  - [x] 3.3 Component has two internal modes: `'autocomplete'` (default) and `'manual'`
  - [x] 3.4 **Autocomplete mode rendering:**
    - Address text input with placeholder "Type an address to auto-fill coordinates..."
    - Uses `useAddressAutocomplete` hook for predictions dropdown
    - Dropdown styled identically to `PlacesSearchInput` (same classes: `bg-white border border-[#E8E0D5] rounded-xl shadow-lg`)
    - Keyboard navigation: ArrowUp/ArrowDown/Enter/Escape (same pattern as `PlacesSearchInput`)
    - On prediction select: calls `useAddressGeocode` with the `place_id`, then calls `onCoordsResolved(lat, lng, formattedAddress)`
    - Below the input: coordinate display as read-only `<p>` text (same style as auto-fill mode in `RestaurantDraftForm` line 163-167) showing lat/lng or "No address selected" in `text-stone-400`
    - "Edit coordinates manually" link (`text-xs text-stone-400 hover:text-stone-600`) below coordinates
  - [x] 3.5 **Manual mode rendering:**
    - Two `<input type="number" step="any">` fields for lat/lng (same as current `RestaurantDraftForm` manual inputs)
    - Pre-filled with current lat/lng values
    - On change: calls `onManualEdit(field, value)`
    - "Use address lookup" link to switch back to autocomplete mode
  - [x] 3.6 **Error state:** When `useAddressAutocomplete` returns an error, auto-switch to manual mode with error message "Address lookup unavailable"
  - [x] 3.7 Export from `src/components/index.ts`
  - [x] 3.8 Uses same design tokens as existing form: `LABEL_CLASS`, `INPUT_CLASS`, `INPUT_ERROR_CLASS` from `RestaurantDraftForm` -- extract these to a shared constant or inline the same values

### Task Group C: Integration into RestaurantDraftForm (depends on A and B)

- [x] **Task 4: Integrate `AddressGeocodeInput` into `RestaurantDraftForm`** (AC: 1, 7, 8)
  - [x] 4.1 In `src/components/RestaurantDraftForm.tsx`, import `AddressGeocodeInput`
  - [x] 4.2 Replace the manual-mode lat/lng section (lines 159-209, the `{!isAutoFill && ...}` branch) with `<AddressGeocodeInput>` component
  - [x] 4.3 Wire `onCoordsResolved` to update `fields.lat`, `fields.lng`, and `fields.address` via the existing `update()` function (or a new multi-field updater)
  - [x] 4.4 Wire `onManualEdit` to update individual lat/lng fields via `update()`
  - [x] 4.5 **Keep auto-fill mode unchanged:** The `{isAutoFill && ...}` branch (lines 162-168 and 188-196) must remain as-is -- read-only coordinate display from `initialDraft`
  - [x] 4.6 Validation: No changes needed -- `validate()` already checks `fields.lat` and `fields.lng` as required numeric values, which works for both autocomplete-resolved and manually-entered coordinates
  - [x] 4.7 Verify that the `address` field update from geocoding does not break the form -- `fields.address` already exists and is a display-only field not stored in `Restaurant`

- [x] **Task 5: Extract shared form styling constants** (AC: none -- code quality)
  - [x] 5.1 The constants `LABEL_CLASS`, `INPUT_CLASS`, `INPUT_ERROR_CLASS`, `ERROR_MSG_CLASS` are currently defined in `RestaurantDraftForm.tsx` and will be needed by `AddressGeocodeInput.tsx`
  - [x] 5.2 Extract these to `src/components/formStyles.ts` (or a similar shared location)
  - [x] 5.3 Update `RestaurantDraftForm.tsx` to import from the shared location
  - [x] 5.4 Use the shared constants in `AddressGeocodeInput.tsx`
  - [x] 5.5 **Alternative:** Inline the same Tailwind classes in `AddressGeocodeInput`. Acceptable but less DRY. Prefer extraction.

### Task Group D: Smoke Test the Full Flow (depends on C)

- [ ] **Task 6: Manual integration verification** (AC: 1, 2, 3, 4, 5, 6, 7, 8)
  - [ ] 6.1 Verify auto-fill flow (PlacesSearch -> RestaurantDraftForm with initialDraft) is unchanged
  - [ ] 6.2 Verify manual flow: type address -> select prediction -> lat/lng auto-populate -> save produces valid Restaurant
  - [ ] 6.3 Verify manual coordinate override: click "Edit manually" -> type coordinates -> save
  - [ ] 6.4 Verify error fallback: with Places API unavailable, form falls back to raw number inputs
  - [ ] 6.5 Verify keyboard navigation in address dropdown matches PlacesSearchInput behavior
  - [ ] 6.6 Verify no TypeScript strict mode violations (`npm run typecheck` or equivalent)

## Dev Notes

### Architecture Decision: Separate Hook vs. Refactoring `usePlacesAutocomplete`

The existing `usePlacesAutocomplete` hook hardcodes `types: ['restaurant', 'food']`. This story needs `types: ['geocode']` for address lookup. Two approaches were considered:

1. **Refactor `usePlacesAutocomplete` to accept a `types` parameter** -- cleaner long-term but touches a working hook used by `PlacesSearchInput` and risks regression.
2. **Create a new `useAddressAutocomplete` hook** -- duplicates the debounce/API pattern but isolates changes to new files only.

**Decision: Option 2.** This is a QoL enhancement story, not a refactoring story. The duplication is minimal (~40 lines) and the risk of regression is zero. A future refactoring story can merge the two hooks if desired.

### Architecture Decision: `useAddressGeocode` vs. Reusing `usePlaceDetails`

The existing `usePlaceDetails` hook fetches 7 fields (`name`, `formatted_address`, `geometry`, `price_level`, `types`, `url`, `place_id`) and returns a full `PlaceDraft`. The address geocode only needs 2 fields (`geometry`, `formatted_address`). Reusing `usePlaceDetails` would:
- Fetch unnecessary fields, wasting API quota
- Return a `PlaceDraft` that would need to be partially mapped

**Decision: New `useAddressGeocode` hook** with minimal field request. This keeps API costs low (NFR8) and the interface clean.

### Google Places API Types for Address Autocomplete

The `types` parameter for `AutocompleteService.getPlacePredictions` accepts:
- `'geocode'` -- returns addresses and geocoded locations (best fit for this story)
- `'address'` -- returns only street addresses (too restrictive -- excludes landmarks, intersections)
- `'establishment'` -- returns businesses (this is what the restaurant search uses)

**Use `'geocode'`** for the broadest useful address matching.

### Files to Create
- `src/hooks/useAddressAutocomplete.ts` -- address autocomplete predictions
- `src/hooks/useAddressGeocode.ts` -- place_id to lat/lng resolution
- `src/components/AddressGeocodeInput.tsx` -- composite address input with geocoding
- `src/components/formStyles.ts` -- shared form styling constants

### Files to Modify
- `src/components/RestaurantDraftForm.tsx` -- integrate `AddressGeocodeInput` in manual mode, import shared styles
- `src/hooks/index.ts` -- export new hooks
- `src/components/index.ts` -- export new component (if barrel file exists)

### Files NOT to Modify
- `src/components/PlacesSearchInput.tsx` -- restaurant search is unchanged
- `src/hooks/usePlacesAutocomplete.ts` -- restaurant autocomplete is unchanged
- `src/hooks/usePlaceDetails.ts` -- restaurant detail fetch is unchanged
- `src/components/AddRestaurantPanel.tsx` -- state machine is unchanged (manual mode still passes `initialDraft: null`)

### Design Tokens (from existing codebase)
- Background: `bg-[#FFFBF5]`
- Border: `border-[#E8E0D5]`
- CTA button: `bg-[#D97706]`
- Focus ring: `focus:ring-[#FDE68A]`
- Error border: `border-red-400`
- Error text: `text-red-600 text-xs`
- Muted text: `text-stone-400`
- Dropdown active: `bg-[#FFF8EE]`

### Project Structure Notes

- All new hooks go in `src/hooks/` following the `use*.ts` naming convention
- All new components go in `src/components/` following PascalCase naming
- The `AddressGeocodeInput` component is used only within `RestaurantDraftForm` but is a separate file for clarity and testability
- No new routes, no new types in `restaurant.ts`, no changes to `restaurants.json` schema

### References

- [Source: src/hooks/usePlacesAutocomplete.ts] -- pattern for debounced autocomplete hook
- [Source: src/hooks/usePlaceDetails.ts] -- pattern for PlacesService.getDetails with hidden div
- [Source: src/components/PlacesSearchInput.tsx] -- pattern for dropdown UI and keyboard navigation
- [Source: src/components/RestaurantDraftForm.tsx#L159-L209] -- manual lat/lng inputs to be replaced
- [Source: src/components/AddRestaurantPanel.tsx] -- state machine context; manual mode passes `initialDraft: null`
- [Source: src/types/restaurant.ts] -- Restaurant interface (no address field -- address is form-only)
- [Source: _bmad-output/implementation-artifacts/4-2-add-restaurant-with-google-places-search.md] -- predecessor story

## Dev Agent Record

### Agent Model Used

(to be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
