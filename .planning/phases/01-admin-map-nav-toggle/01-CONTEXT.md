# Phase 1: Admin/Map Nav Toggle - Context

**Gathered:** 2026-04-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a persistent navigation element that lets the authenticated curator switch between the admin dashboard (`/admin`) and the public map (`/`) in one click, with auth state intact. The nav toggle is hidden for unauthenticated visitors.

</domain>

<decisions>
## Implementation Decisions

### Nav Element Placement
- **D-01:** On the map view, the nav toggle lives inside the existing fixed filter bar, right-aligned — "Admin →" text link
- **D-02:** On the admin view, a "← Map" link sits at the top of AdminDashboard near the existing tab controls
- **D-03:** No new layout wrappers or separate nav bars — reuse existing UI containers on both views

### Nav Element Style
- **D-04:** Text link style on both views — not an icon button or pill badge
- **D-05:** "Admin →" on the map view, "← Map" on the admin view — directional arrows indicate navigation target

### Mobile & Desktop
- **D-06:** Same text link on mobile and desktop — no responsive breakpoint or icon-only mobile variant
- **D-07:** The link flows with the existing filter bar layout, which already handles mobile responsiveness

### Auth Indicator
- **D-08:** The nav toggle's visibility IS the auth indicator — no additional badge, dot, or "Logged in" text
- **D-09:** When not authenticated, no nav toggle is visible on the public map (NAV-04)

### Claude's Discretion
- Technical approach for lifting `AdminAuthProvider` to wrap both routes (currently scoped to `/admin` only — must be moved up so the map view can check auth status)
- Exact Tailwind classes and spacing for the toggle within the filter bar
- Link styling to match existing filter bar aesthetic

### Folded Todos
- **Add admin/map navigation toggle with session persistence** (`.planning/todos/pending/admin-map-nav-toggle.md`) — This todo's acceptance criteria are identical to NAV-01 through NAV-05. Folded into phase scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Planning
- `.planning/REQUIREMENTS.md` — NAV-01 through NAV-05 define the acceptance criteria for this phase
- `.planning/ROADMAP.md` §Phase 1 — Phase goal, success criteria, dependencies
- `.planning/PROJECT.md` §Key Decisions — React Router `<Link>` decision, auth-only visibility decision

### Architecture
- `.planning/codebase/ARCHITECTURE.md` — Layer overview, data flow for public map and admin routes, auth context pattern
- `.planning/codebase/STRUCTURE.md` — File locations for components, hooks, contexts

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/FilterBar.tsx` — The existing fixed filter bar where the nav toggle will be added (right-aligned)
- `src/contexts/AdminAuthContext.tsx` — Auth provider with `isAuthenticated`, `login`, `logout` — needs scope lift
- `src/components/ProtectedRoute.tsx` — Route guard using `useAdminAuth` hook
- `src/components/AdminDashboard.tsx` — Admin panel where "← Map" link will be added at top

### Established Patterns
- React Router `<Link>` for client-side navigation (already used throughout)
- `useAdminAuth()` hook for checking auth status in components
- Fixed positioning with `z-50` for filter bar overlay on map
- Tailwind utility classes only for styling

### Integration Points
- `src/App.tsx` — Routes defined here; `AdminAuthProvider` must be lifted from wrapping only `/admin` to wrapping `<Routes>` so both views share auth context
- `src/components/FilterBar.tsx` — Nav toggle added here (conditional on `isAuthenticated`)
- `src/components/AdminDashboard.tsx` — "← Map" link added near tab controls
- `sessionStorage['food-list-admin-auth']` — Auth persists in sessionStorage, so lifting the provider won't lose state

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-admin-map-nav-toggle*
*Context gathered: 2026-04-18*
