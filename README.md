# bobby.menu — Food List

A map-based restaurant curation SPA. One curator, a public interactive Google Map of tiered picks (Loved / Recommended / On My Radar) across the Phoenix metro and travel cities, client-side filtering, shareable collections, and an OAuth-gated curator dashboard.

Live at [bobby.menu](https://bobby.menu).

## Stack

- **Frontend:** React 19 + Vite + TypeScript (strict), Tailwind CSS v4, `@vis.gl/react-google-maps`
- **Data:** Supabase (Postgres + RLS + Google OAuth). `public/restaurants.json` is a dev fallback and service-worker precache entry, not the live store
- **API:** Express server in `server/` serving the MCP endpoint (`https://bobby.menu/mcp`) so Claude and other MCP clients can search and curate the list
- **Hosting:** Traefik + Docker Compose on a VPS; static SPA deployed with `./deploy.sh`

## Development

```bash
npm install
cp .env.example .env   # fill in Maps key + Supabase project
npm run dev
```

- `npm run test` — Vitest
- `npm run lint` — ESLint
- `npm run build` — type-check + production build

## Layout

- `src/` — SPA (components, hooks, contexts, api modules)
- `server/` — Express + MCP server (deployed separately, see `server/Dockerfile`)
- `supabase/migrations/` — schema + RLS policies
- `scripts/` — data tooling (Supabase seeds, Places enrichment, notes pipeline, Gemini gem export)
- `deploy/` — live SPA nginx container config mirror + map style reference
- `_bmad-output/` — BMAD planning artifacts (PRD, architecture, epics)
