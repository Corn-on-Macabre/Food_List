# Food_List — Claude Code Instructions

## Project Overview
Map-based restaurant curation SPA for the Phoenix metro area. Single curator (Rhunnicutt), public-facing map, no user auth for MVP.

## Tech Stack
- React 18 + Vite + TypeScript (strict mode)
- Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- `@vis.gl/react-google-maps` — the ONLY Google Maps library (not `@react-google-maps/api`, not `google-maps-react`)
- Static `public/restaurants.json` as data layer (no database for MVP)
- Deployed via Nginx on VPS with `rsync` of `dist/`

## Project Root
`/Users/rhunnicutt/Food_List` — this IS the project root. Do NOT create nested subdirectories for app code.

## BMAD Workflow
This project uses BMAD Method v6. All planning artifacts are in `_bmad-output/`.
- Epics + stories: `_bmad-output/planning-artifacts/epics.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- PRD: `_bmad-output/planning-artifacts/prd.md`
- Sprint tracking: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Story files: `_bmad-output/implementation-artifacts/*.md`

**Never touch `_bmad/`, `_bmad-output/`, or `.claude/` unless explicitly working on BMAD workflow files.**

## GitHub
- Remote: `https://github.com/Corn-on-Macabre/Food_List.git` (origin)
- Default branch: `main`
- Always push to `origin`. Never push to any other remote without explicit confirmation.

## Key Conventions
- TypeScript strict mode — no `any`, no implicit returns
- Tailwind utility classes only — no custom CSS files except `src/index.css` for directives
- Google Maps API key via `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`
- Tier color mapping: loved = `#F59E0B` (gold), recommended = `#3B82F6` (blue), on_my_radar = `#10B981` (green)
- Restaurant data shape: see `src/types/restaurant.ts`
- All filtering is client-side — no server round-trips for ~200 records
- Distance calculated via Haversine formula in `src/utils/distance.ts`

## What NOT to Do
- Do not use `@react-google-maps/api` or any other Maps library
- Do not create a nested `food-list/` subfolder
- Do not add a database or backend server (MVP is static files only)
- Do not add user authentication to the public map
- Do not use `git add -A` or `git add .` — stage files explicitly
