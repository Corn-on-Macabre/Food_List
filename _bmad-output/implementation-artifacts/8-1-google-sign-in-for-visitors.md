# Story 8.1: Google Sign-in for Visitors

Status: ready-for-dev

## Story

As a visitor to bobby.menu,
I want to optionally sign in with Google,
so that I can submit restaurant recommendations.

## Acceptance Criteria

1. **Sign-in button visible** — A subtle "Sign in" button is visible on the public map (top-right area or within the filter bar) when the user is not authenticated. The map is fully functional without signing in.

2. **Google OAuth flow** — Clicking "Sign in" triggers Supabase Google OAuth (same provider already configured for admin). On success, Supabase creates a user session and a record is created/updated in the `profiles` table (google_id, display_name, email, avatar_url, date_joined).

3. **Signed-in state UI** — After sign-in, the sign-in button is replaced with the user's Google avatar and display name. Clicking the avatar/name shows a dropdown with "Sign out" option.

4. **Sign out** — Signing out clears the Supabase session and returns to anonymous browsing. All public features continue to work identically.

5. **Public features unaffected** — Browsing the map, filtering, searching, viewing restaurant cards, and deep links all work identically whether signed in or anonymous.

6. **Profiles table** — A `profiles` table exists in Supabase with RLS: users can read their own profile, insert on first sign-in, update their own. Admin can read all.

7. **TypeScript passes** — `npx tsc --noEmit` clean with no new `any` types.

8. **Existing tests unaffected** — All previously passing tests continue to pass.

## Tasks / Subtasks

### Group A — Auth context refactor (visitor auth)

- [ ] A1. Create `src/contexts/AuthContext.tsx` — a general-purpose auth context for ALL users (visitors + admin) (AC: 2, 3, 4, 5)
  - [ ] A1.1 Export `AuthProvider` wrapping Supabase `onAuthStateChange`
  - [ ] A1.2 Expose: `session`, `user`, `isAuthenticated`, `isAdmin`, `signInWithGoogle()`, `signOut()`, `loading`
  - [ ] A1.3 `isAdmin` checks user email against `VITE_ADMIN_EMAIL` (same logic as current `AdminAuthContext`)
  - [ ] A1.4 `signInWithGoogle()` calls `supabase.auth.signInWithOAuth({ provider: 'google' })` with `redirectTo: window.location.origin` (NOT /admin — visitors sign in from the map)
  - [ ] A1.5 `signOut()` calls `supabase.auth.signOut()`

- [ ] A2. Migrate `AdminAuthContext` to use `AuthContext` (AC: 5)
  - [ ] A2.1 `AdminAuthContext` becomes a thin wrapper: imports `useAuth()`, adds legacy password fallback, exposes `isAdmin`
  - [ ] A2.2 All existing admin functionality preserved — no changes to `ProtectedRoute` or `AdminDashboard`
  - [ ] A2.3 Remove duplicated Supabase auth subscription from `AdminAuthContext` (now in `AuthContext`)

### Group B — Profiles table

- [ ] B1. Create SQL migration `supabase/migrations/002_profiles.sql` (AC: 6)
  - [ ] B1.1 CREATE TABLE `profiles` (id uuid PK references auth.users, google_id text, display_name text, email text, avatar_url text, date_joined timestamptz default now())
  - [ ] B1.2 Enable RLS: users SELECT/INSERT/UPDATE own row, admin SELECT all
  - [ ] B1.3 Create trigger function to auto-create profile on `auth.users` insert (or handle in app code)

- [ ] B2. Create `src/api/profiles.ts` — helper to upsert profile on sign-in (AC: 2, 6)
  - [ ] B2.1 `upsertProfile(user: User)` — inserts or updates `profiles` row using Supabase client
  - [ ] B2.2 Called from `AuthContext` after successful sign-in

### Group C — UI components

- [ ] C1. Create `src/components/UserMenu.tsx` — sign-in button / avatar dropdown (AC: 1, 3, 4)
  - [ ] C1.1 When not signed in: render subtle "Sign in" button (text link style, not prominent)
  - [ ] C1.2 When signed in: render user avatar (32px circle) and display name
  - [ ] C1.3 Click avatar opens dropdown with "Sign out" option
  - [ ] C1.4 Click outside dropdown dismisses it
  - [ ] C1.5 Tailwind-only styling, consistent with existing filter bar aesthetic

- [ ] C2. Integrate `UserMenu` into the public map layout (AC: 1, 5)
  - [ ] C2.1 Add `UserMenu` to the filter bar area (top-right) in `App.tsx` or `FilterBar.tsx`
  - [ ] C2.2 Must not interfere with existing filter controls or map interaction
  - [ ] C2.3 Responsive: works on mobile (compact) and desktop

### Group D — Wire up providers

- [ ] D1. Wrap app with `AuthProvider` in `App.tsx` (AC: 5)
  - [ ] D1.1 `AuthProvider` wraps outside `AdminAuthProvider` (admin context reads from auth context)
  - [ ] D1.2 Ensure auth state is available to both public map and admin routes

### Group E — Verification

- [ ] E1. TypeScript check (AC: 7)
- [ ] E2. Run existing test suite (AC: 8)
- [ ] E3. Manual verification: sign in from map, see avatar, sign out, map still works

## Dev Notes

### CRITICAL: Reuse existing Supabase OAuth config
Google OAuth is ALREADY configured in Supabase (done in Story 7.2). The same provider works for visitors — the only difference is:
- Admin sign-in redirects to `/admin`
- Visitor sign-in redirects to `/` (the map)
- `isAdmin` check distinguishes admin from regular visitor

### Auth architecture: two contexts, one Supabase subscription
- `AuthContext` — owns the Supabase auth subscription, exposes session/user to entire app
- `AdminAuthContext` — consumes `AuthContext`, adds legacy password fallback, exposes `isAdmin` for admin routes
- This prevents duplicate `onAuthStateChange` subscriptions

### Profiles table vs auth.users
Supabase `auth.users` stores authentication data. The `profiles` table stores app-specific data (display_name, avatar_url for UI display, date_joined for attribution). The profile is created on first sign-in via an upsert keyed on `id` (auth.users uuid).

### Existing files to modify
- `src/App.tsx` — wrap with `AuthProvider`, add `UserMenu` to map layout
- `src/contexts/AdminAuthContext.tsx` — refactor to consume `AuthContext` instead of owning Supabase subscription

### New files to create
- `src/contexts/AuthContext.tsx`
- `src/components/UserMenu.tsx`
- `src/api/profiles.ts`
- `supabase/migrations/002_profiles.sql`

### DO NOT
- Do not change any public map functionality (filters, pins, cards, deep links)
- Do not use any auth library other than `@supabase/supabase-js` (already installed)
- Do not create a separate sign-in page — the sign-in button lives on the map view
- Do not block map rendering while auth is loading

### Parallelization guide
- **Group A + Group B** can run in parallel (no shared files)
- **Group C** depends on Group A (needs `useAuth` hook)
- **Group D** depends on Groups A and C

### References
- Supabase client: [Source: src/lib/supabase.ts]
- Current auth context: [Source: src/contexts/AdminAuthContext.tsx]
- App root: [Source: src/App.tsx]
- Restaurant types: [Source: src/types/restaurant.ts]
- Epic 8 stories: [Source: _bmad-output/planning-artifacts/epics.md#Epic 8]
- Story 7.2 (Google OAuth setup): already merged into main

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
