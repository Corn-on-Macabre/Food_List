# Codebase Concerns

**Analysis Date:** 2026-04-18

## Tech Debt

**Geolocation has no cancellation mechanism:**
- Issue: `navigator.geolocation.getCurrentPosition()` has no AbortController API. If `useGeolocation` component unmounts before position resolves, the callback fires on the unmounted component.
- Files: `src/hooks/useGeolocation.ts`, `src/App.tsx` (lines 17-32, 29-31)
- Impact: Memory leak warning potential; silent state updates on unmounted components (though React 18 treats as no-op)
- Fix approach: Document that React 18 handles this safely as no-op, or wrap callback in mounted ref check for older React versions

**TODO marker for header positioning:**
- Issue: `src/App.tsx` line 119 has TODO comment about changing `top-[60px]` when app header is implemented (Story 4.x)
- Files: `src/App.tsx` (line 119)
- Impact: Hardcoded pixel value will break layout when header component is added
- Fix approach: Replace with dynamic header height constant once Story 4 header is built

**Concurrent write protection is synchronous:**
- Issue: `server/index.js` line 48 uses synchronous `writing` flag to detect concurrent writes, but throws error instead of queuing
- Files: `server/index.js` (lines 34-59)
- Impact: If two requests attempt simultaneous writes, second request gets 500 error; no queue/retry logic
- Fix approach: Implement async queue (e.g., PQueue) or use file locks (atomically write .tmp then rename, which already handles this better than current flag check)

**Async enrichment fire-and-forget:**
- Issue: `server/index.js` lines 167-177 enriches restaurant asynchronously after POST response, with `.catch(() => {})` swallowing errors
- Files: `server/index.js` (lines 167-177)
- Impact: Enrichment failures silently fail; no logging/alerting; concurrent enrichment calls for same restaurant race each other
- Fix approach: Log enrichment failures, add deduplication (one enrichment per restaurant at a time), or move enrichment to pre-response phase

**Unvalidated partial updates:**
- Issue: `server/index.js` line 195-216 accepts PATCH/PUT with only tier/cuisine validation; other fields (lat, lng, notes, tags, etc.) are updated without validation
- Files: `server/index.js` (lines 186-221)
- Impact: Invalid coords, malformed tags, or oversized notes can corrupt restaurant data
- Fix approach: Validate all updatable fields against Restaurant type schema; use `validateRestaurant()` for immutable fields only

**React hook dependencies incomplete:**
- Issue: `src/components/AddressGeocodeInput.tsx` lines 73-83 has click-outside effect with `isOpen` dependency, but `isOpen` depends on `predictions` which can change without triggering the cleanup
- Files: `src/components/AddressGeocodeInput.tsx` (lines 73-83)
- Impact: Event listener may be added/removed redundantly or out of sync with actual dropdown state
- Fix approach: Verify `isOpen` is properly memoized or add `predictions.length` to dependency array

**AdminAuth stores password in state:**
- Issue: `src/contexts/AdminAuthContext.tsx` lines 28-32 stores `VITE_ADMIN_PASSWORD` in React state as a string
- Files: `src/contexts/AdminAuthContext.tsx` (lines 19-32)
- Impact: Password string readable in React DevTools; persists in memory for session duration; not encrypted
- Fix approach: Never store password in state; pass from context only for API calls; clear from memory after use; or use token-based auth instead

## Security Considerations

**Bearer token passed as password:**
- Risk: `src/api/restaurants.ts` line 8 passes admin password as `Authorization: Bearer <password>` header
- Files: `src/api/restaurants.ts` (lines 5-9), `server/index.js` (lines 21-31)
- Current mitigation: HTTPS (assumed in production via Nginx)
- Recommendations:
  - Use HTTP-only cookies instead of Authorization header
  - Implement JWT token with expiration
  - Hash password server-side instead of plain string comparison

**ADMIN_PASSWORD in environment:**
- Risk: `server/index.js` line 9 reads `ADMIN_PASSWORD` from `process.env`
- Files: `server/index.js` (line 9), `src/contexts/AdminAuthContext.tsx` (line 19)
- Current mitigation: `.env` files not committed (.gitignore enforced)
- Recommendations:
  - Ensure `.env` files are in `.gitignore` (verify)
  - Consider using secret manager (AWS Secrets Manager, HashiCorp Vault) for production
  - Rotate password regularly

**Google Maps API key exposed:**
- Risk: `VITE_GOOGLE_MAPS_API_KEY` embedded in front-end, visible to all users
- Files: `src/App.tsx` (line 31), `vite.config.ts` implicit
- Current mitigation: API restrictions in Google Cloud Console (assumed)
- Recommendations:
  - Verify API key has HTTP referrer restrictions set to only allow production domain
  - Verify key is restricted to Maps JavaScript API only
  - Monitor for quota abuse; set daily limits

**File path traversal in DELETE/PUT:**
- Risk: `server/index.js` lines 29, 39 use `encodeURIComponent(id)` which is safe, but `req.params.id` is not further validated
- Files: `src/api/restaurants.ts` (lines 29, 39)
- Current mitigation: `encodeURIComponent()` prevents path traversal; file operations use fixed `DATA_FILE` path
- Recommendations:
  - Validate `id` is alphanumeric + hyphens (restaurant slug format)
  - Add allowlist of valid characters

**CORS wide open:**
- Risk: `server/index.js` line 17 uses `app.use(cors())` with no options, allowing requests from any origin
- Files: `server/index.js` (line 17)
- Current mitigation: Requests still require valid Bearer token
- Recommendations:
  - Restrict CORS to production domain only: `cors({ origin: 'https://phx-food-list.com' })`
  - Implement CSRF tokens for mutation endpoints

## Performance Bottlenecks

**9000-line static JSON file:**
- Problem: `public/restaurants.json` is 9025 lines; on page load, entire file fetched and loaded into memory
- Files: `public/restaurants.json`, `src/hooks/useRestaurants.ts`
- Cause: No pagination, filtering, or server-side data reduction
- Improvement path:
  - For ~200 restaurants this is acceptable (< 200KB gzipped)
  - If dataset grows beyond 500 restaurants, implement server-side search/filter
  - Consider clustering API calls by cuisine or tier to reduce payload

**Large test file creates memory pressure:**
- Problem: `src/test/SessionRestaurantCard.test.tsx` is 1076 lines; test suite may be slow
- Files: `src/test/SessionRestaurantCard.test.tsx`
- Cause: Comprehensive test coverage; single file contains 50+ test cases
- Improvement path:
  - Split into separate files by feature (tier editing, notes, tags, featured)
  - Use shared factory functions to reduce test boilerplate

**Map redraws on every filter change:**
- Problem: `src/App.tsx` line 81-96 `filteredRestaurants` is recalculated on any filter change; all pins are re-rendered
- Files: `src/App.tsx` (lines 81-96), `src/components/ClusteredPins.tsx`
- Cause: No memoization at marker level; clusterer recalculates on every addition
- Improvement path:
  - Memoize `filteredRestaurants` more aggressively
  - Move restaurant filtering to worker thread if dataset grows
  - Implement lazy marker rendering

**Address geocoding debounces but doesn't cancel:**
- Problem: `src/hooks/useAddressAutocomplete.ts` line 38 debounces 300ms but multiple requests may be in flight
- Files: `src/components/AddressGeocodeInput.tsx`, `src/hooks/useAddressAutocomplete.ts`
- Cause: Debounce delay applies but doesn't abort pending requests
- Improvement path:
  - Add AbortController to fetch call in autocomplete hook
  - Cancel pending request on new query

## Fragile Areas

**SessionRestaurantCard state management:**
- Files: `src/components/SessionRestaurantCard.tsx` (lines 23-37)
- Why fragile:
  - 7 separate `useState` calls with intricate state relationships (isEditing, isEditingNotes, isEditingSource, selectedTier, noteText, sourceText, activeTags, customTagInput)
  - Mutual exclusion logic repeated 4 times (lines 113-122, 176-184, 198-207, 278-281) to close other editors
  - selectedTier synced manually via onClick handler; no useEffect sync
  - If parent prop changes, local state can diverge from prop
- Safe modification:
  - Extract mutual exclusion into `useReducer`
  - Create `useEditor` hook to consolidate editor state
  - Add validation in parent (AdminDashboard) before calling child callbacks
- Test coverage: Tests cover happy path but not state divergence scenarios

**AdminDashboard dual state management:**
- Files: `src/components/AdminDashboard.tsx` (lines 17-21)
- Why fragile:
  - `allRestaurants` and `sessionRestaurants` both track same data; kept in sync manually via map operations (lines 54-117)
  - If update succeeds in one list but fails in the other, lists diverge
  - No version/revision tracking; concurrent edits can overwrite unnoticed
- Safe modification:
  - Use single source of truth (allRestaurants only)
  - Derive session list from allRestaurants via filter (dates >= today)
  - Add error boundaries around update operations
- Test coverage: Unit tests for individual handlers; no concurrent update tests

**AddressGeocodeInput mode switching:**
- Files: `src/components/AddressGeocodeInput.tsx` (lines 37-45)
- Why fragile:
  - Mode derived from `autocompleteError` instead of explicit state (line 45)
  - If autocomplete hook changes error handling, mode may become incorrect
  - Click-outside listener added/removed based on `isOpen` which depends on `predictions`; if predictions change unexpectedly, listener state mismatches
- Safe modification:
  - Make mode explicit state with validation
  - Separate concerns: autocomplete (search), manual entry, geocoding into three hooks
  - Add integration test covering mode transitions

**RestaurantDraftForm ID collision detection:**
- Files: `src/components/RestaurantDraftForm.tsx` (lines 96-102)
- Why fragile:
  - Slug ID generation via `generateSlugId(fields.name)` then collision check with counter
  - If name is empty/whitespace, slug will be invalid
  - No check that final ID meets slug validation rules (alphanumeric, hyphens only)
- Safe modification:
  - Validate name length (> 3 chars) before slug generation
  - Test slug generation with edge cases (special chars, very long names, duplicates)
  - Consider UUID instead of slug if uniqueness is priority

## Scaling Limits

**Single JSON file as database:**
- Current capacity: ~200 restaurants (9KB each = 1.8MB total)
- Limit: Reads/writes on single file will experience contention at ~1000 restaurants and beyond
- Scaling path:
  - 200-500 restaurants: Current approach acceptable
  - 500-5000 restaurants: Migrate to SQLite or PostgreSQL
  - 5000+ restaurants: Add read replica, implement caching (Redis), paginate API responses

**Server enrichment is fire-and-forget:**
- Current capacity: ~5 concurrent enrichment requests (30s each = 2.5 min total)
- Limit: Google Places API rate limits (100 QPS default); enrichment queue not managed
- Scaling path:
  - Implement job queue (Bull, RabbitMQ)
  - Batch enrichments
  - Cache enrichment results (24h TTL)

**In-memory marker clustering:**
- Current capacity: ~300 markers before UI lag (depends on device)
- Limit: MarkerClusterer recalculates cluster hierarchy on every marker addition
- Scaling path:
  - Implement virtual marker rendering (only render visible clusters)
  - Server-side clustering with geoHash
  - Incremental clusterer updates instead of full rebuild

## Dependencies at Risk

**@vis.gl/react-google-maps v1.8.1:**
- Risk: Relatively young library; v1 still evolving; no v2 LTS guarantee
- Impact: Breaking changes in minor versions possible; Maps API deprecations
- Migration plan: Monitor releases; test before upgrading; have fallback to `google-maps-react` if needed

**React Router v7.14.0:**
- Risk: Major version; may have breaking changes in maintenance updates
- Impact: `/admin` route implementation; navigation
- Migration plan: Lock to v7.x; review changelog before upgrades

**Tailwind CSS v4.2.2:**
- Risk: Vite plugin integration; breaking CSS output possible
- Impact: Component styling; potential visual regressions
- Migration plan: Test build output before deploy; have CSS reset fallback

## Missing Critical Features

**No data backup/restore:**
- Problem: Single `restaurants.json` file on server; no version history; no easy rollback
- Blocks: Cannot undo accidental deletions or corrupted edits
- Workaround: Manual rsync backups before major curator sessions

**No audit log:**
- Problem: No record of who changed what when
- Blocks: Cannot track curator activity; cannot debug data inconsistencies
- Workaround: Enable filesystem audit logging on server (auditctl)

**No rate limiting on API:**
- Problem: `server/index.js` has no rate limiting; brute-force attacks possible on auth
- Blocks: Cannot protect against credential attacks
- Workaround: Use Nginx `limit_req` module on production

**No input sanitization:**
- Problem: User notes, tags, cuisine free-form text; no HTML escaping
- Blocks: XSS vulnerability if UI renders as HTML (currently safe as React auto-escapes, but fragile)
- Workaround: Validate note/tag length (< 500 chars); strip HTML tags on save

## Test Coverage Gaps

**Geolocation edge cases:**
- What's not tested:
  - Geolocation denied (permission prompt rejected)
  - Geolocation timeout
  - Multiple permission prompts in same session
  - Changed permission mid-session
- Files: `src/hooks/useGeolocation.test.ts` missing; `src/hooks/useGeolocation.ts` tested indirectly in `FilterIntegration.test.tsx`
- Risk: Distance filter may behave unexpectedly on denied/timeout
- Priority: Medium (AC 5, 6, 7 for geolocation states exist but need explicit unit test)

**API error scenarios:**
- What's not tested:
  - 401 Unauthorized (expired/invalid password)
  - 400 Bad Request (validation failure)
  - 500 Server Error (file I/O failure)
  - Network timeout
  - Rate limiting (429)
- Files: `src/api/restaurants.ts` has no tests; `AdminDashboard.tsx` assumes success path
- Risk: Error messages may not appear; UI may hang on failed mutation
- Priority: High (admin dashboard can get into bad state on API error)

**ID collision edge cases:**
- What's not tested:
  - Very long names (truncation behavior)
  - Names with special chars (slug generation)
  - Duplicate slugs with counters
- Files: `src/components/RestaurantDraftForm.tsx` (lines 96-102) tested in integration but not unit tested
- Risk: Malformed IDs possible; server-side validation may reject valid names
- Priority: Medium (affects add restaurant flow)

**Concurrent admin edits:**
- What's not tested:
  - Two browsers open, both editing same restaurant
  - Tier change in tab A while source change pending in tab B
  - Simultaneous add restaurant calls
- Files: No integration tests for concurrent scenarios
- Risk: Last-write-wins (data loss) without warning
- Priority: High (curator may not realize edits were overwritten)

**Mobile/responsive edge cases:**
- What's not tested:
  - Landscape orientation (iPhone SE)
  - Tablet split-screen (iPad)
  - High-DPI screens (pin size, text clarity)
- Files: No responsive tests in vitest; only manual testing noted
- Risk: UI may break on specific devices; pins too small to tap
- Priority: Medium (Phoenix audience includes mobile users)

---

*Concerns audit: 2026-04-18*
