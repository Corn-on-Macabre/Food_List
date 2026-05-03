# Story 7.1: Supabase Project Setup & Restaurant Data Migration

Status: in-progress

## Story

As a developer,
I want bobby.menu's restaurant data stored in a Supabase Postgres table,
so that the app has a real database supporting auth, queries, and future features.

## Acceptance Criteria

1. **Supabase client configured** — `@supabase/supabase-js` is installed and a typed Supabase client is exported from `src/lib/supabase.ts`, reading `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from environment variables.

2. **Database schema defined** — A SQL migration file defines the `restaurants` table matching the `Restaurant` TypeScript interface: id (text PK), name, tier, cuisine, lat, lng, notes, googleMapsUrl, source, dateAdded, tags (text[]), featured (boolean), enrichedAt, rating, userRatingCount, priceLevel, photoRef. Row-level security enabled: public SELECT, authenticated INSERT/UPDATE/DELETE restricted to admin.

3. **Migration script** — A Node.js script reads `public/restaurants.json` and inserts all records into the Supabase `restaurants` table. Idempotent (can be re-run without duplicates via upsert on id).

4. **useRestaurants updated** — The `useRestaurants` hook fetches from Supabase when configured, falls back to static JSON when Supabase env vars are not set (backward compatible).

5. **Environment variables documented** — `.env.example` updated with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` entries.

6. **TypeScript passes** — `npx tsc --noEmit` clean with no new `any` types.

7. **Existing tests unaffected** — All previously passing tests continue to pass.

## Tasks / Subtasks

### Group A — Supabase client setup

- [ ] A1. Install `@supabase/supabase-js` (AC: 1)
  - [ ] A1.1 Run `npm install @supabase/supabase-js`
  - [ ] A1.2 Verify package.json updated

- [ ] A2. Create `src/lib/supabase.ts` (AC: 1)
  - [ ] A2.1 Export typed Supabase client using `createClient()` with env vars
  - [ ] A2.2 Export a `supabaseConfigured` boolean (true when URL + key are present)

### Group B — Database schema

- [ ] B1. Create SQL migration file `supabase/migrations/001_restaurants.sql` (AC: 2)
  - [ ] B1.1 CREATE TABLE restaurants with all fields matching Restaurant type
  - [ ] B1.2 Enable RLS: public SELECT, admin-only INSERT/UPDATE/DELETE
  - [ ] B1.3 Add index on cuisine, tier for filter performance

### Group C — Migration script

- [ ] C1. Create `scripts/migrate-to-supabase.js` (AC: 3)
  - [ ] C1.1 Read restaurants.json
  - [ ] C1.2 Upsert all records into Supabase restaurants table
  - [ ] C1.3 Report count of records migrated

### Group D — Hook update

- [ ] D1. Update `src/hooks/useRestaurants.ts` (AC: 4)
  - [ ] D1.1 Import supabase client and `supabaseConfigured` flag
  - [ ] D1.2 When configured, fetch from Supabase instead of JSON
  - [ ] D1.3 Fall back to static JSON fetch when not configured
  - [ ] D1.4 Maintain existing return shape (restaurants, loading, error)

### Group E — Environment and docs

- [ ] E1. Update `.env.example` (AC: 5)
  - [ ] E1.1 Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY entries

### Group F — Verification

- [ ] F1. TypeScript check (AC: 6)
- [ ] F2. Run existing test suite (AC: 7)

## Dev Notes

### Backward compatibility is critical
The app must continue to work without Supabase configured. The `useRestaurants` hook should detect whether Supabase env vars are present and branch accordingly. This means the current static JSON flow is preserved as a fallback.

### Supabase client pattern
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### RLS policy for admin
Since we don't have Google OAuth yet (that's story 7.2), the RLS write policy should use `auth.jwt() ->> 'email'` matching an admin email. For now, public SELECT is the priority — write policies will be refined in 7.2.

### Migration script runs outside the browser
The migration script uses the Supabase service role key (not the anon key) to bypass RLS. It reads from the existing JSON file.

### Files to create
- `src/lib/supabase.ts`
- `supabase/migrations/001_restaurants.sql`
- `scripts/migrate-to-supabase.js`

### Files to modify
- `src/hooks/useRestaurants.ts`
- `.env.example`
- `package.json` (new dependency)

### References
- Restaurant type: [Source: src/types/restaurant.ts]
- Current useRestaurants hook: [Source: src/hooks/useRestaurants.ts]
- Current data file: [Source: public/restaurants.json]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### Change Log

### File List
