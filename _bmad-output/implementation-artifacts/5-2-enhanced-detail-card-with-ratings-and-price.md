# Story 5.2: Enhanced Detail Card with Ratings & Price

Status: complete

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-05 | Story created by SM (Claude) | Story 5.1 ready-for-dev; Epic 5 in-progress |

## Story

As a user,
I want to see Google ratings and price level on the restaurant detail card,
so that I can make a more informed decision without leaving the app.

## Acceptance Criteria

1. **Given** a restaurant has `rating` and `userRatingCount` fields from enrichment **When** the user views the restaurant detail card **Then** the rating is displayed as "X.X ★ (N)" where X.X is the rating value and N is the `userRatingCount` **And** the rating row appears below the restaurant name and tier badge, above the cuisine line.

2. **Given** a restaurant has `priceLevel` set to a known value **When** the user views the restaurant detail card **Then** the price level is displayed as dollar signs using this mapping: `PRICE_LEVEL_INEXPENSIVE` → `$`, `PRICE_LEVEL_MODERATE` → `$$`, `PRICE_LEVEL_EXPENSIVE` → `$$$`, `PRICE_LEVEL_VERY_EXPENSIVE` → `$$$$` **And** the price indicator appears on the same row as the rating (or adjacent to it).

3. **Given** a restaurant has `rating` but NOT `userRatingCount` **When** the detail card renders **Then** the rating is displayed as "X.X ★" without a count in parentheses.

4. **Given** a restaurant has `priceLevel` but NOT `rating` **When** the detail card renders **Then** only the dollar signs are displayed, with no rating shown **And** no empty space or placeholder is left for the missing rating.

5. **Given** a restaurant has `rating` but NOT `priceLevel` **When** the detail card renders **Then** only the rating is displayed, with no dollar signs shown **And** no empty space or placeholder is left for the missing price.

6. **Given** a restaurant has NEITHER `rating` NOR `priceLevel` (not enriched) **When** the detail card renders **Then** no rating/price row is shown at all **And** the card displays normally with base information (name, tier, Bobby's Pick badge, cuisine, notes, Google Maps link) **And** no "N/A", dashes, or empty space appears.

7. **Given** the rating and price row is rendered **When** the user views it **Then** it uses the warm stone/amber aesthetic consistent with the rest of the app: star in amber/gold (`text-amber-500`), rating text in `text-stone-700`, price text in `text-stone-500`, using Tailwind utility classes only.

8. **Given** a restaurant has a `priceLevel` value that does NOT match any known mapping (e.g. `PRICE_LEVEL_FREE` or an unexpected string) **When** the detail card renders **Then** the price level is not displayed for that restaurant **And** no error is thrown.

9. **Given** the `formatPriceLevel` utility function **When** called with each valid `priceLevel` string **Then** it returns the correct dollar sign string **And** when called with an unknown value or `undefined` it returns `undefined`.

10. **Given** the rating/price display **When** rendered on mobile (screen width < 768px) **Then** the text is legible and the row does not cause horizontal overflow **And** the layout is consistent with the existing card spacing.

## Tasks / Subtasks

### Task Group A — Create `formatPriceLevel` utility (AC: 2, 8, 9) [CAN START IMMEDIATELY]

- [x] **Task A1: Create `src/utils/priceLevel.ts`** (AC: 2, 8, 9)
  - [x] Create the file at `src/utils/priceLevel.ts`.
  - [x] Export a named function:
    ```ts
    const PRICE_LEVEL_MAP: Record<string, string> = {
      PRICE_LEVEL_INEXPENSIVE: "$",
      PRICE_LEVEL_MODERATE: "$$",
      PRICE_LEVEL_EXPENSIVE: "$$$",
      PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
    };

    export function formatPriceLevel(priceLevel: string | undefined): string | undefined {
      if (!priceLevel) return undefined;
      return PRICE_LEVEL_MAP[priceLevel];
    }
    ```
  - [x] The function returns `undefined` for unknown/unmapped values (not an empty string), ensuring the card can conditionally skip rendering.

---

### Task Group B — Update `RestaurantCard` to show rating and price (AC: 1, 3, 4, 5, 6, 7, 10) [DEPENDS ON A]

- [x] **Task B1: Import `formatPriceLevel` in `RestaurantCard.tsx`** (AC: 2)
  - [x] Open `src/components/RestaurantCard.tsx`.
  - [x] Add import: `import { formatPriceLevel } from "../utils/priceLevel";`

- [x] **Task B2: Add rating and price row to `RestaurantCard`** (AC: 1, 3, 4, 5, 6, 7, 10)
  - [x] Inside the component, derive the formatted price:
    ```ts
    const formattedPrice = formatPriceLevel(restaurant.priceLevel);
    ```
  - [x] Add a conditional row between the Bobby's Pick badge (`{restaurant.featured && ...}`) and the cuisine `<p>` element. The row only renders if at least one of `rating` or `formattedPrice` is truthy:
    ```tsx
    {(restaurant.rating != null || formattedPrice) && (
      <div className="mt-2 flex items-center gap-2 text-sm">
        {restaurant.rating != null && (
          <span className="text-stone-700">
            {restaurant.rating.toFixed(1)}{" "}
            <span className="text-amber-500">★</span>
            {restaurant.userRatingCount != null && (
              <span className="text-stone-400 ml-0.5">
                ({restaurant.userRatingCount.toLocaleString()})
              </span>
            )}
          </span>
        )}
        {restaurant.rating != null && formattedPrice && (
          <span className="text-stone-300">·</span>
        )}
        {formattedPrice && (
          <span className="text-stone-500 font-medium">{formattedPrice}</span>
        )}
      </div>
    )}
    ```
  - [x] The `·` separator only renders when both rating and price are present.
  - [x] Use `!= null` (not `!== undefined`) to safely check for `rating` since `0` is falsy but a valid (if unlikely) rating value.

---

### Task Group C — Tests for `formatPriceLevel` utility (AC: 2, 8, 9) [CAN START IN PARALLEL WITH B]

- [x] **Task C1: Create `src/test/priceLevel.test.ts`** (AC: 2, 8, 9)
  - [x] Create the test file at `src/test/priceLevel.test.ts`.
  - [x] Tests:
    1. Returns `"$"` for `"PRICE_LEVEL_INEXPENSIVE"`.
    2. Returns `"$$"` for `"PRICE_LEVEL_MODERATE"`.
    3. Returns `"$$$"` for `"PRICE_LEVEL_EXPENSIVE"`.
    4. Returns `"$$$$"` for `"PRICE_LEVEL_VERY_EXPENSIVE"`.
    5. Returns `undefined` for `"PRICE_LEVEL_FREE"` (unknown value).
    6. Returns `undefined` for `undefined` input.
    7. Returns `undefined` for an empty string.

---

### Task Group D — Tests for `RestaurantCard` rating and price display (AC: 1, 3, 4, 5, 6, 7, 8) [DEPENDS ON B]

- [x] **Task D1: Add rating and price tests to `src/test/RestaurantCard.test.tsx`** (AC: 1, 3, 4, 5, 6)
  - [x] Open `src/test/RestaurantCard.test.tsx`.
  - [x] Add mock restaurant fixtures:
    ```ts
    const mockEnrichedRestaurant: Restaurant = {
      ...mockRestaurant,
      rating: 4.3,
      userRatingCount: 287,
      priceLevel: "PRICE_LEVEL_MODERATE",
    };

    const mockRatingOnlyRestaurant: Restaurant = {
      ...mockRestaurant,
      rating: 4.7,
      userRatingCount: 1024,
    };

    const mockPriceOnlyRestaurant: Restaurant = {
      ...mockRestaurant,
      priceLevel: "PRICE_LEVEL_EXPENSIVE",
    };

    const mockRatingNoCountRestaurant: Restaurant = {
      ...mockRestaurant,
      rating: 3.9,
    };
    ```
  - [x] Add a new `describe("Rating and price display (Story 5.2)")` block with tests:
    1. Renders rating as "4.3" with star when `rating` is present (AC 1).
    2. Renders user rating count as "(287)" when `userRatingCount` is present (AC 1).
    3. Renders "$$" when `priceLevel` is `"PRICE_LEVEL_MODERATE"` (AC 2).
    4. Renders both rating and price with separator when both exist (AC 1, 2).
    5. Does not render rating/price row when neither `rating` nor `priceLevel` exists (AC 6) — use `mockRestaurantNoNotes` which has no enrichment fields.
    6. Renders only rating (no price section) when `priceLevel` is absent (AC 5).
    7. Renders only price (no rating section) when `rating` is absent (AC 4).
    8. Renders rating without count when `userRatingCount` is absent (AC 3).
    9. Does not render price for unknown `priceLevel` value like `"PRICE_LEVEL_FREE"` (AC 8).
    10. Star character is rendered with amber color class (AC 7).

---

## Dev Notes

### Architecture Context

This is a React 18 + Vite + TypeScript (strict mode) SPA. Tailwind CSS v4 via `@tailwindcss/vite`. Tests use Vitest + `@testing-library/react`. No backend — all state is in-memory. Restaurant data is loaded from `public/restaurants.json`.

### Key File Paths

| File | Role |
|------|------|
| `src/types/restaurant.ts` | `Restaurant` interface — `rating?`, `userRatingCount?`, `priceLevel?` already present (added in Story 5.1) |
| `src/components/RestaurantCard.tsx` | Public detail card — add rating/price row |
| `src/test/RestaurantCard.test.tsx` | Existing tests — add new rating/price test block |
| `src/utils/priceLevel.ts` | NEW: `formatPriceLevel` utility |
| `src/test/priceLevel.test.ts` | NEW: unit tests for `formatPriceLevel` |

### Scope Boundary — Photos Deferred to Story 5.3

This story displays `rating`, `userRatingCount`, and `priceLevel` only. The `photoRef` field is NOT consumed in this story. Do not add any photo rendering to the card.

### Scope Boundary — `SessionRestaurantCard` Not Modified

The `SessionRestaurantCard` is the admin/curator card. It does not need rating/price display because those fields are read-only enrichment data, not curator-editable. Only `RestaurantCard` (the public detail card) is modified in this story.

### `priceLevel` Mapping

Google Places API (New) returns `priceLevel` as an enum string:

| Google Value | Display |
|---|---|
| `PRICE_LEVEL_INEXPENSIVE` | `$` |
| `PRICE_LEVEL_MODERATE` | `$$` |
| `PRICE_LEVEL_EXPENSIVE` | `$$$` |
| `PRICE_LEVEL_VERY_EXPENSIVE` | `$$$$` |
| `PRICE_LEVEL_FREE` | Not displayed |
| Any unknown string | Not displayed |
| `undefined` | Not displayed |

Google also defines `PRICE_LEVEL_UNSPECIFIED` and `PRICE_LEVEL_FREE` — both should result in no display. The `formatPriceLevel` function handles this by only mapping the four known values and returning `undefined` for everything else.

### Rating Display Format

- Always show one decimal place via `toFixed(1)` (e.g., `4.0`, not `4`).
- Star character `★` in amber (`text-amber-500`) for visual warmth.
- User rating count formatted with `toLocaleString()` for thousands separator (e.g., `1,024`).
- Count is optional — if `userRatingCount` is undefined, show just "4.3 ★" without parentheses.

### Null Check Pattern

Use `!= null` (loose inequality) rather than `!== undefined` to check for `rating` and `userRatingCount`. This catches both `undefined` and `null` cases, and importantly does NOT treat `0` as missing (since `0` is falsy but technically a valid numeric value).

### Card Layout After This Story

The `RestaurantCard` content order becomes:
1. Close button (drag handle on mobile)
2. `<h2>` — restaurant name
3. Tier badge (amber/blue/emerald pill)
4. Bobby's Pick badge (conditional, from Story 4.6)
5. **Rating and price row (conditional, NEW in this story)**
6. Cuisine type
7. Notes (conditional)
8. "Open in Google Maps" CTA button

### Test Pattern

Existing `RestaurantCard` tests use `screen.getByText()` and `screen.queryByText()` for content assertions. Follow the same pattern. For checking that a row is NOT rendered, use `queryByText` and assert `not.toBeInTheDocument()`.

The star character `★` may need to be tested within a parent element since it is in a nested `<span>`. Use `getByText` with a function matcher or test for the numeric rating value and the star separately.
