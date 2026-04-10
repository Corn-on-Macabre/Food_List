# Story 5.1: Google Places API Enrichment Pipeline

Status: complete

## Story

As a curator,
I want a local Node script that enriches restaurant records with Google Places data (rating, price level, photo reference),
so that I can add richer detail card information without manually looking up every restaurant.

## Acceptance Criteria

1. **Given** `scripts/enrich-places.mjs` is run via `node scripts/enrich-places.mjs`
   **When** `public/restaurants.json` contains restaurants where `enrichedAt` is missing or null
   **Then** the script calls the Google Places API (New) Text Search endpoint for each unenriched restaurant using the restaurant name + "Phoenix AZ" as the query
   **And** extracts `rating` (number), `userRatingCount` (number), `priceLevel` (string, e.g. `"PRICE_LEVEL_MODERATE"`), and `photos[0].name` (photo resource name) from the response
   **And** writes these values to the restaurant record as `rating?`, `userRatingCount?`, `priceLevel?`, `photoRef?`
   **And** sets `enrichedAt` to the current ISO date string (e.g. `"2026-04-05"`)
   **And** writes the updated array back to `public/restaurants.json` with 2-space indentation

2. **Given** the Google Places API returns no data for a field (e.g. no photos, no priceLevel)
   **When** the enrichment processes that restaurant
   **Then** the corresponding field is omitted from the record (not set to null or empty)
   **And** any fields that DO have valid data are still written

3. **Given** the Google Places API call fails for a specific restaurant (network error, 4xx/5xx)
   **When** the enrichment encounters the error
   **Then** that restaurant is skipped without affecting other records
   **And** the error is logged to stderr with the restaurant name and error message
   **And** the script continues processing remaining restaurants

4. **Given** the script processes multiple restaurants
   **When** API calls are made sequentially
   **Then** a configurable delay (default 200ms) is applied between each request to respect rate limits
   **And** the script logs progress to stdout (e.g. `[3/91] Enriching "Thai E-San"...`)

5. **Given** a restaurant already has a non-null `enrichedAt` value
   **When** the script runs
   **Then** that restaurant is skipped (not re-enriched)
   **And** the script logs that it was skipped

6. **Given** the script supports a `--force` flag
   **When** `node scripts/enrich-places.mjs --force` is run
   **Then** all restaurants are enriched regardless of existing `enrichedAt` values

7. **Given** the `Restaurant` interface in `src/types/restaurant.ts`
   **When** the enrichment fields are added
   **Then** the interface includes new optional fields: `rating?: number`, `userRatingCount?: number`, `priceLevel?: string`, `photoRef?: string`
   **And** the existing `enrichedAt?: string` field (already present) is unchanged
   **And** TypeScript compilation (`npx tsc --noEmit`) passes

8. **Given** the script reads the API key
   **When** `VITE_GOOGLE_MAPS_API_KEY` is not found in `.env`
   **Then** the script exits with a clear error message and non-zero exit code

9. **Given** curator-authored fields (name, tier, cuisine, notes, tags, source, featured, googleMapsUrl, lat, lng)
   **When** enrichment runs
   **Then** none of these fields are modified or overwritten by the enrichment pipeline

10. **Given** the script completes
    **When** all restaurants have been processed
    **Then** a summary is logged: total processed, enriched count, skipped count, error count

## Tasks / Subtasks

- [x] Task 1: Add enrichment fields to Restaurant type (AC: #7)
  - [x] 1.1 Add `rating?: number` to `Restaurant` interface in `src/types/restaurant.ts`
  - [x] 1.2 Add `userRatingCount?: number` to `Restaurant` interface
  - [x] 1.3 Add `priceLevel?: string` to `Restaurant` interface
  - [x] 1.4 Add `photoRef?: string` to `Restaurant` interface
  - [x] 1.5 Verify `enrichedAt?: string` already exists on the interface
  - [x] 1.6 Run `npx tsc --noEmit` to confirm compilation passes

- [x] Task 2: Create `scripts/enrich-places.mjs` scaffold (AC: #1, #8)
  - [x] 2.1 Create ESM Node script with shebang (`#!/usr/bin/env node`)
  - [x] 2.2 Read `.env` file and extract `VITE_GOOGLE_MAPS_API_KEY` (same pattern as `fix-coords.mjs`)
  - [x] 2.3 Exit with error if API key is missing
  - [x] 2.4 Load `public/restaurants.json`
  - [x] 2.5 Parse `--force` and `--dry-run` CLI flags

- [x] Task 3: Implement Places API Text Search call (AC: #1, #2, #3)
  - [x] 3.1 Build `POST https://places.googleapis.com/v1/places:searchText` request with `textQuery: "<name> Phoenix AZ"`, `locationBias` centered on Phoenix metro, and field mask for `places.rating,places.userRatingCount,places.priceLevel,places.photos`
  - [x] 3.2 Set headers: `X-Goog-Api-Key`, `X-Goog-FieldMask`, `Content-Type: application/json`
  - [x] 3.3 Extract first result's `rating`, `userRatingCount`, `priceLevel`, `photos[0].name`
  - [x] 3.4 Only set fields that have truthy/valid values (omit missing fields)
  - [x] 3.5 Wrap API call in try/catch; log errors to stderr and skip on failure

- [x] Task 4: Implement enrichment loop with rate limiting (AC: #4, #5, #6, #9)
  - [x] 4.1 Filter restaurants to those needing enrichment (`enrichedAt` missing/null), unless `--force`
  - [x] 4.2 Process sequentially with configurable delay between requests (default 200ms)
  - [x] 4.3 Log progress: `[n/total] Enriching "Name"...` or `[n/total] Skipping "Name" (already enriched)`
  - [x] 4.4 Write only enrichment fields (`rating`, `userRatingCount`, `priceLevel`, `photoRef`, `enrichedAt`); never touch curator fields

- [x] Task 5: Write results and summary (AC: #1, #10)
  - [x] 5.1 Write updated restaurants array to `public/restaurants.json` with `JSON.stringify(data, null, 2)`
  - [x] 5.2 If `--dry-run`, log what would change but do not write the file
  - [x] 5.3 Log summary: total, enriched, skipped, errored

## Dev Notes

- This is a **local curator tool**, not app code. It runs manually via `node scripts/enrich-places.mjs` and the curator commits the updated `restaurants.json` then redeploys. There is NO server, NO cron, NO runtime enrichment.
- Follow the existing script pattern from `scripts/fix-coords.mjs` for reading `.env`, resolving paths, and calling the Places API (New).
- The Google Places API (New) Text Search endpoint is `POST https://places.googleapis.com/v1/places:searchText`. Use native `fetch()` (Node 18+). Do NOT install axios or node-fetch.
- The `priceLevel` field from the API is a string enum (e.g. `"PRICE_LEVEL_INEXPENSIVE"`, `"PRICE_LEVEL_MODERATE"`, `"PRICE_LEVEL_EXPENSIVE"`, `"PRICE_LEVEL_VERY_EXPENSIVE"`). Store it as-is; Story 5.2 will map it to `$`/`$$`/`$$$`/`$$$$` for display.
- The `photoRef` stores the photo resource name (e.g. `"places/ChIJ.../photos/AUc..."`) which can be used later in Story 5.3 to construct a photo URL via the Places Photos API.
- Rate limiting: 200ms default delay is conservative. The Places API allows ~600 QPM, but we have ~200 restaurants so a single run takes ~40 seconds at 200ms delay.
- No tests required for this script (it's a one-off data tool, not app code shipped in the bundle).
- The `.env` file is already gitignored and contains `VITE_GOOGLE_MAPS_API_KEY`.
- API cost estimate: Text Search (New) = $32 per 1000 requests. ~200 restaurants = ~$6.40 per full run, well within the $200/month free tier (NFR8).

### Project Structure Notes

- `scripts/enrich-places.mjs` — new file, alongside existing `fix-coords.mjs`, `import-lists.mjs`, `import-reviews.mjs`
- `src/types/restaurant.ts` — add 4 optional fields to `Restaurant` interface
- `public/restaurants.json` — modified by the script (not by hand)
- No new dependencies needed; uses native `fetch()` and `fs`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5 / Story 5.1]
- [Source: src/types/restaurant.ts] — current Restaurant interface
- [Source: scripts/fix-coords.mjs] — existing script pattern for Places API (New) and .env reading
- [Source: CLAUDE.md] — project conventions, no backend, static deploy
- [Source: _bmad-output/planning-artifacts/epics.md#NFR7] — Places API failure must not break core map
- [Source: _bmad-output/planning-artifacts/epics.md#NFR8] — stay within $200/month free tier

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

- `src/types/restaurant.ts` — added 4 optional enrichment fields (rating, userRatingCount, priceLevel, photoRef)
- `scripts/enrich-places.mjs` — new enrichment pipeline script (Places API Text Search)
