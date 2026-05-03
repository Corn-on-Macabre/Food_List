# Story 8.3: URL-Based Submission with Auto-Extraction

Status: ready-for-dev

## Story

As a signed-in user,
I want to paste a Google Maps link and have restaurant details auto-filled,
so that submitting a recommendation is fast and accurate.

## Acceptance Criteria

1. **URL detection** — When the user pastes a Google Maps URL into the location field of the SubmissionForm, the system detects it and attempts auto-extraction.

2. **URL parsing** — The system handles common Google Maps URL formats: `google.com/maps/place/...`, `maps.app.goo.gl/...`, `goo.gl/maps/...`. Extracts place name, coordinates, or place ID when available.

3. **Places API extraction** — When a place can be identified from the URL, the system calls Google Places API to retrieve: name, address, lat/lng, cuisine type, rating, price level.

4. **Auto-fill form** — On successful extraction, the form fields are pre-populated: restaurant name and location/address. The user can review, edit, and add their recommendation note before submitting.

5. **Fallback to manual** — If the URL can't be parsed or Places API fails, the form falls back to manual entry with a brief message: "Couldn't extract details automatically. Please fill in the form manually."

6. **TypeScript passes** — `npx tsc --noEmit` clean.

7. **Existing tests unaffected** — All previously passing tests continue to pass.

## Tasks / Subtasks

### Group A — URL parsing utility

- [ ] A1. Create `src/utils/parseGoogleMapsUrl.ts` (AC: 2)
  - [ ] A1.1 Export `parseGoogleMapsUrl(url: string): ParsedMapsUrl | null`
  - [ ] A1.2 Handle format: `https://www.google.com/maps/place/PLACE+NAME/@LAT,LNG,...` — extract name and coordinates
  - [ ] A1.3 Handle format: `https://maps.app.goo.gl/SHORTCODE` — return the URL as-is for redirect resolution (these are short URLs that need to be followed)
  - [ ] A1.4 Handle format: `https://goo.gl/maps/SHORTCODE` — same as above
  - [ ] A1.5 Handle format with place ID: `...place_id=XXXX...` or `...data=...!1sXXXX...` — extract place ID if present
  - [ ] A1.6 Return null for non-Google-Maps URLs
  - [ ] A1.7 Interface: `ParsedMapsUrl { name?: string; lat?: number; lng?: number; placeId?: string; originalUrl: string }`

### Group B — Places lookup helper

- [ ] B1. Create `src/api/placesLookup.ts` (AC: 3)
  - [ ] B1.1 Export `lookupPlaceFromUrl(parsed: ParsedMapsUrl): Promise<PlaceLookupResult | null>`
  - [ ] B1.2 If placeId available: use Places API `getPlace()` to fetch details
  - [ ] B1.3 If name + coordinates available: use Places API `searchNearby()` or `findPlace()` to match
  - [ ] B1.4 If only name available: use Places API text search
  - [ ] B1.5 Return: `PlaceLookupResult { name: string; address: string; lat: number; lng: number; cuisine?: string; rating?: number; priceLevel?: string }`
  - [ ] B1.6 Return null on any failure (graceful degradation)
  - [ ] B1.7 Use the existing Google Maps API key (already loaded via APIProvider) — access via `google.maps.places` global

### Group C — Enhance SubmissionForm with URL detection

- [ ] C1. Add URL detection to SubmissionForm location field (AC: 1, 4, 5)
  - [ ] C1.1 On paste or change in location field, check if value looks like a Google Maps URL (starts with known prefixes)
  - [ ] C1.2 If URL detected: show "Extracting details..." loading indicator
  - [ ] C1.3 Call `parseGoogleMapsUrl()` then `lookupPlaceFromUrl()`
  - [ ] C1.4 On success: pre-fill name field (if empty) and replace location field with extracted address
  - [ ] C1.5 On failure: show brief inline message "Couldn't extract details automatically" and keep the URL in the field for manual editing
  - [ ] C1.6 Don't block form submission during extraction — user can always submit manually

### Group D — Verification

- [ ] D1. TypeScript check (AC: 6)
- [ ] D2. Run existing test suite (AC: 7)

## Dev Notes

### URL parsing is client-side only
No server-side URL resolution needed for MVP. Short URLs (goo.gl) are tricky because they need HTTP redirects to resolve. For MVP, if user pastes a short URL, just keep it as the location value — don't try to resolve it. Focus on the full `google.com/maps/place/...` format which contains extractable data in the URL itself.

### Places API access pattern
The app already loads Google Maps JavaScript API via `<APIProvider apiKey={...}>`. The Places API (New) is available as `google.maps.places.Place` in components rendered within the APIProvider. However, SubmissionForm renders outside the APIProvider in App.tsx.

**Two options:**
1. Move SubmissionForm rendering inside the APIProvider (simplest)
2. Pass the API key and load Places separately

Option 1 is preferred — just move the SubmissionForm render inside the `<APIProvider>` block in AppWithMap.

### Existing Google Places patterns in the codebase
- `src/hooks/usePlacesAutocomplete.ts` — uses `google.maps.places.AutocompleteService`
- `src/hooks/usePlaceDetails.ts` — uses `google.maps.places.PlacesService`
- These hooks use the "legacy" Places API. The AddRestaurantPanel uses these for admin restaurant search.
- For story 8-3, follow the same pattern but keep it simpler — a one-shot lookup, not autocomplete.

### Keep it simple
The URL parsing doesn't need to handle every edge case. Focus on the most common format users will paste: the full Google Maps URL from the address bar or the share button. If it can't parse, fall back gracefully.

### Files to create
- `src/utils/parseGoogleMapsUrl.ts`
- `src/api/placesLookup.ts`

### Files to modify
- `src/components/SubmissionForm.tsx` — add URL detection and auto-fill logic
- `src/App.tsx` — ensure SubmissionForm renders within APIProvider (may need to restructure slightly)

### DO NOT
- Do not try to resolve short URLs (goo.gl) server-side
- Do not add new npm dependencies for URL parsing
- Do not change the submissions table schema
- Do not modify any other components besides SubmissionForm and App.tsx

### References
- SubmissionForm: [Source: src/components/SubmissionForm.tsx]
- App.tsx: [Source: src/App.tsx]
- Places hooks: [Source: src/hooks/usePlacesAutocomplete.ts, src/hooks/usePlaceDetails.ts]
- Google Maps URL formats: standard patterns from google.com/maps

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
