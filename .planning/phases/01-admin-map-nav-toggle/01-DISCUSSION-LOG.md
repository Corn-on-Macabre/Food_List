# Phase 1: Admin/Map Nav Toggle - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-18
**Phase:** 1-Admin/Map Nav Toggle
**Areas discussed:** Nav element style & placement, Mobile vs desktop presentation, Auth indicator

---

## Nav Element Style & Placement

### Q1: Where should the nav toggle live on the map view?

| Option | Description | Selected |
|--------|-------------|----------|
| Inside the filter bar (Recommended) | Add toggle to right side of existing fixed filter bar. Compact, consistent. | ✓ |
| Floating button (corner) | Small floating button in bottom-right corner. Stays separate from filter bar. | |
| Separate thin bar above filters | Admin bar above the filter bar. More visible but adds vertical space. | |

**User's choice:** Inside the filter bar
**Notes:** Keeps UI compact, no new floating elements needed.

### Q2: Where should the 'Back to Map' link live on the admin dashboard?

| Option | Description | Selected |
|--------|-------------|----------|
| Top of admin panel (Recommended) | Link/button at top of AdminDashboard near existing tab controls. | ✓ |
| Match the filter bar position | Thin nav bar at top of admin view mirroring filter bar placement. | |
| You decide | Let Claude pick based on existing admin layout patterns. | |

**User's choice:** Top of admin panel
**Notes:** Simple, no new layout wrapper needed.

### Q3: What style for the nav toggle on the map?

| Option | Description | Selected |
|--------|-------------|----------|
| Text link (Recommended) | Simple "Admin →" text styled to match filter bar. Subtle, clean. | ✓ |
| Icon button | Small gear/cog icon. Compact but less discoverable. | |
| Pill/badge button | Styled pill button "Admin". More prominent. | |

**User's choice:** Text link
**Notes:** None.

---

## Mobile vs Desktop Presentation

### Q1: How should the nav toggle adapt on mobile?

| Option | Description | Selected |
|--------|-------------|----------|
| Same text link, responsive (Recommended) | Keep "Admin →" on mobile. Flows with filter bar layout. One implementation. | ✓ |
| Icon-only on mobile | Compact icon on mobile, full text on desktop. Requires responsive breakpoint. | |
| You decide | Let Claude pick based on current filter bar mobile behavior. | |

**User's choice:** Same text link, responsive
**Notes:** No special mobile treatment needed.

---

## Auth Indicator

### Q1: Should the map view show any auth status beyond the nav toggle itself?

| Option | Description | Selected |
|--------|-------------|----------|
| Nav toggle IS the indicator (Recommended) | Toggle only appears when authenticated. Its presence is the indicator. Minimal. | ✓ |
| Add a subtle dot/badge | Colored dot or "Logged in" text next to toggle. More explicit. | |
| You decide | Let Claude pick simplest approach satisfying NAV-04. | |

**User's choice:** Nav toggle IS the indicator
**Notes:** None.

---

## Claude's Discretion

- Technical approach for lifting AdminAuthProvider scope
- Tailwind styling details for the toggle
- Link styling to match filter bar aesthetic

## Deferred Ideas

None — discussion stayed within phase scope
