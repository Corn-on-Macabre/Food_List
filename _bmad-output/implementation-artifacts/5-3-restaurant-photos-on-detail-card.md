# Story 5.3: Restaurant Photos on Detail Card

Status: complete

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-05 | Story created and implemented by Dev (Claude) | Story 5.2 complete; Epic 5 in-progress |

## Story

As a user,
I want to see a photo of the restaurant on the detail card,
so that I get a visual sense of the place before visiting.

## Acceptance Criteria

1. **Given** a restaurant has been enriched and has a `photoRef` from Google Places **When** the user views the restaurant detail card **Then** a restaurant photo is displayed prominently at the top of the card, above the restaurant name.

2. **Given** a restaurant has no `photoRef` (not enriched or Google returned no photo) **When** the user views the restaurant detail card **Then** no photo placeholder or broken image is shown **And** the card layout adjusts gracefully without the photo.

3. **Given** the photo URL fails to load (network error, expired URL) **When** the image fails **Then** the photo is hidden gracefully without breaking the card layout.

4. **Given** a restaurant photo is displayed **When** the user views it **Then** the image has `loading="lazy"` for performance, an accessible `alt` attribute with the restaurant name, rounded top corners matching the card shape, and `object-cover` fill.

5. **Given** the photo URL **When** constructed from `photoRef` **Then** it uses the format `https://places.googleapis.com/v1/{photoRef}/media?maxHeightPx=300&maxWidthPx=400&key={API_KEY}` where API_KEY comes from `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`.

## Tasks / Subtasks

### Task Group A — Update `RestaurantCard` to show photo (AC: 1, 2, 3, 4, 5) [CAN START IMMEDIATELY]

- [x] **Task A1: Add photo section to `RestaurantCard.tsx`** (AC: 1, 2, 3, 4, 5)
  - [x] Add `useState` import for error handling state.
  - [x] Construct photo URL from `restaurant.photoRef` and `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`.
  - [x] Add photo `<img>` element at top of card (above drag handle / close button) when `photoRef` exists and image has not errored.
  - [x] Image uses `loading="lazy"`, `alt={restaurant.name}`, `object-cover`, `w-full`, `h-48`, `rounded-t-xl` (mobile) / no rounding on desktop panel.
  - [x] `onError` handler sets state flag to hide the image gracefully.
  - [x] When `photoRef` is absent or image has errored, render nothing — no placeholder, no empty space.

---

### Task Group B — Tests for photo display (AC: 1, 2, 3, 4) [DEPENDS ON A]

- [x] **Task B1: Add photo tests to `src/test/RestaurantCard.test.tsx`** (AC: 1, 2, 3, 4)
  - [x] Add mock restaurant fixture with `photoRef`.
  - [x] Test: photo renders when `photoRef` is present (check img element and src contains photoRef).
  - [x] Test: photo is absent when `photoRef` is not set.
  - [x] Test: photo has correct alt text matching restaurant name.
  - [x] Test: photo has `loading="lazy"` attribute.

---

## Dev Notes

### Architecture Context

This is a React 18 + Vite + TypeScript (strict mode) SPA. Tailwind CSS v4 via `@tailwindcss/vite`. Tests use Vitest + `@testing-library/react`. No backend — all state is in-memory.

### Key File Paths

| File | Role |
|------|------|
| `src/types/restaurant.ts` | `Restaurant` interface — `photoRef?` already present (added in Story 5.1) |
| `src/components/RestaurantCard.tsx` | Public detail card — add photo section |
| `src/test/RestaurantCard.test.tsx` | Existing tests — add new photo test block |

### Photo URL Construction

The `photoRef` field contains a Google Places photo resource name like `places/ChIJ.../photos/AUc...`. The full URL is:

```
https://places.googleapis.com/v1/{photoRef}/media?maxHeightPx=300&maxWidthPx=400&key={API_KEY}
```

Where `API_KEY` = `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`.

### Card Layout After This Story

The `RestaurantCard` content order becomes:
1. **Photo (conditional, NEW in this story)**
2. Close button (drag handle on mobile)
3. `<h2>` — restaurant name
4. Tier badge (amber/blue/emerald pill)
5. Bobby's Pick badge (conditional)
6. Rating and price row (conditional, from Story 5.2)
7. Cuisine type
8. Notes (conditional)
9. "Open in Google Maps" CTA button

### Scope Boundary — `SessionRestaurantCard` Not Modified

Only `RestaurantCard` (the public detail card) is modified in this story.
