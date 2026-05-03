# Food List — Phoenix Restaurant Map

## What This Is

A map-based restaurant curation SPA for the Phoenix metro area. Single curator (Bobby), public-facing interactive Google Map with color-coded tier pins (Loved/Recommended/On My Radar), client-side filtering by cuisine/distance/tier/search, and a password-protected admin dashboard for managing the restaurant collection. Deployed as a static SPA + Express API on a VPS via Nginx.

## Core Value

Users can open one URL and instantly see all curated restaurants on an interactive map, filter to what they want, and navigate to any restaurant — fast, visual, zero friction.

## Requirements

### Validated

- ✓ Interactive Google Map with color-coded tier pins — Epic 1
- ✓ Pin click shows restaurant detail card with navigation link — Epic 2
- ✓ Client-side filtering by cuisine, distance, tier, and search — Epic 3
- ✓ Password-protected admin dashboard with add/edit/list — Epic 4
- ✓ Google Places autocomplete for adding restaurants — Epic 4
- ✓ Marker clustering for dense areas — Epic 1
- ✓ Responsive layout (mobile + desktop) — Epic 1
- ✓ Pin legend with tier color coding — Epic 1
- ✓ User geolocation with graceful degradation — Epic 1
- ✓ Production deployment via rsync to VPS — Epic 1

### Active

- [ ] Admin ↔ Map navigation toggle — persistent nav element to switch between admin and map without losing auth session
- [ ] Sticky filters and legend on mobile — filter bar and pin legend remain pinned to viewport when scrolling on mobile

### Out of Scope

- Database or backend server beyond current Express API — MVP uses static JSON + simple REST
- User authentication on the public map — single curator, no user accounts
- Google Places data enrichment pipeline — deferred to future milestone (Epic 5)
- Custom domain — deferred until domain is purchased
- GitHub Actions CI/CD — manual deploy via `./deploy.sh` for now

## Context

- **Shipped:** Epics 1-4 merged to main, live at `bobby.menu` via Nginx on VPS
- **Tech:** React 19 + Vite + TypeScript strict + Tailwind CSS v4 + `@vis.gl/react-google-maps`
- **Data:** ~200 restaurants in `public/restaurants.json`, served statically; admin mutations go through Express API on port 3001
- **Auth:** Session-based via `sessionStorage` + React Context (`AdminAuthContext`). Password validated against `VITE_ADMIN_PASSWORD` env var. Auth persists within browser session but is lost on full page reload to different route
- **Current pain point:** Admin workflow requires manual URL changes between `/admin` and `/`, and auth session drops on navigation — significant friction during curation sessions
- **Mobile issue:** Filter bar and pin legend scroll out of view on mobile, requiring scroll-to-top to change filters or reference tier colors

## Constraints

- **Maps library:** `@vis.gl/react-google-maps` only — no `@react-google-maps/api` or alternatives
- **No database:** Static JSON data layer for MVP
- **Styling:** Tailwind utility classes only — no custom CSS except `src/index.css` directives
- **Deployment:** rsync of `dist/` to VPS, Nginx serves static files
- **Tier colors:** Fixed — Loved=#F59E0B, Recommended=#3B82F6, On My Radar=#10B981

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React Router `<Link>` for admin/map nav | Both routes are in same SPA — no reload needed, session preserved | — Pending |
| Nav toggle visible only when authenticated | Public map should stay clean for end users | — Pending |
| `position: sticky` for mobile filters | Standard CSS pattern, no JS needed, well-supported | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-18 after initialization*
