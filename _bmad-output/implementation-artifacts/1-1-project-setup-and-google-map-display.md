# Story 1.1: Project Setup & Google Map Display

Status: in-progress

## Story

As a user,
I want to open the app URL and see an interactive Google Map of the Phoenix metro area,
so that I have a visual canvas to explore restaurant locations.

## Acceptance Criteria

1. **Given** the user navigates to the app URL **When** the page loads **Then** a Google Map renders centered on Phoenix metro (33.4484, -112.0740) at zoom level 11, supports zoom and pan, and shows no login prompt.
2. **Given** the project is scaffolded **When** a developer runs `npm run dev` **Then** a React + Vite + TypeScript app starts with Tailwind CSS configured, the Google Maps API key is loaded from `VITE_GOOGLE_MAPS_API_KEY`, and `@vis.gl/react-google-maps` renders the map via `APIProvider` and `Map` components.
3. **Given** the Google Maps API is unreachable **When** the page loads **Then** the user sees a meaningful error state instead of a blank screen.

## Tasks / Subtasks

- [x] Scaffold the project with Vite (AC: 1, 2)
  - [x] Run `npm create vite@latest . -- --template react-ts` in the project root (`/Users/rhunnicutt/Food_List`)
  - [x] Install dependencies: `npm install`
  - [x] Install `@vis.gl/react-google-maps`, `tailwindcss`, `@tailwindcss/vite`
  - [x] Configure Tailwind via `vite.config.ts` plugin (Tailwind v4 approach) or `tailwind.config.js` (v3 approach) — see Dev Notes for version guidance
  - [x] Add `import './index.css'` with `@tailwind base/components/utilities` directives to `src/index.css`
- [x] Configure environment variable (AC: 2)
  - [x] Create `.env` with `VITE_GOOGLE_MAPS_API_KEY=PLACEHOLDER_KEY`
  - [x] Add `.env` to `.gitignore`
  - [x] Add `.env.example` with the key name but no value
- [x] Define TypeScript data model (AC: 2)
  - [x] Create `src/types/restaurant.ts` with `Tier` type and `Restaurant` interface (see Dev Notes)
  - [x] Create `src/types/index.ts` re-exporting all types
- [x] Set up Google Maps rendering (AC: 1, 2)
  - [x] Replace boilerplate in `src/App.tsx` with `APIProvider` wrapping a `Map` component
  - [x] Set `defaultCenter={{ lat: 33.4484, lng: -112.0740 }}` and `defaultZoom={11}`
  - [x] Pass `mapId` prop (can be `"food-list-map"` — placeholder until Google Cloud Map ID is created)
  - [x] Load API key via `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`
- [x] Error state for missing/failed API key (AC: 3)
  - [x] Detect missing API key (env var empty/undefined) and render a user-facing error message
  - [x] Wrap map render in an error boundary or conditional render for API load failure
- [x] Clean up Vite boilerplate (AC: 2)
  - [x] Remove default Vite counter component and CSS
  - [x] Set `index.html` title to "Food List"
  - [x] Set `src/main.tsx` to render `<App />` with `<React.StrictMode>`

## Dev Notes

### Tech Stack (from Architecture)

- **Framework:** React 18+ with Vite, TypeScript strict mode
- **Styling:** Tailwind CSS — use **v4** if available via `@tailwindcss/vite` plugin (no `tailwind.config.js` needed); fall back to v3 with `tailwind.config.js` if v4 is unavailable
- **Maps:** `@vis.gl/react-google-maps` — the official Google-maintained React wrapper. Do NOT use `@react-google-maps/api` or `google-maps-react` (wrong libraries)
- **Node:** Use whatever version is available; project has no specific Node version constraint

### Project Structure (from Architecture)

The project root IS `/Users/rhunnicutt/Food_List` — do NOT create a nested `food-list/` subfolder. Scaffold directly into the root:

```
/Users/rhunnicutt/Food_List/
  public/
    restaurants.json          # Created in Story 1.2 — leave empty for now
  src/
    components/               # Empty for now; populated in later stories
    hooks/                    # Empty for now
    types/
      restaurant.ts           # Create this in Story 1.1
      index.ts
    utils/                    # Empty for now
    App.tsx                   # Root component with map
    main.tsx                  # Entry point
    index.css                 # Tailwind directives
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  .env                        # VITE_GOOGLE_MAPS_API_KEY=PLACEHOLDER_KEY
  .env.example
  .gitignore
```

> ⚠️ The `_bmad/`, `_bmad-output/`, and `docs/` folders in the project root are BMAD workflow artifacts — do NOT touch or delete them. Vite's build output goes to `dist/` which must be gitignored.

### TypeScript Data Model (from Architecture)

Create `src/types/restaurant.ts` with exactly this shape — Story 1.2 depends on it:

```typescript
export type Tier = "loved" | "recommended" | "on_my_radar";

export interface Restaurant {
  id: string;           // URL-safe slug (e.g., "pho-43")
  name: string;
  tier: Tier;
  cuisine: string;
  lat: number;
  lng: number;
  notes?: string;
  googleMapsUrl: string;
  source?: string;
  dateAdded: string;    // ISO date string YYYY-MM-DD
}

export interface FilterState {
  cuisine: string | null;
  maxDistance: number | null;
}
```

### Google Maps Setup (from Architecture)

Use `@vis.gl/react-google-maps` — minimal working example for `App.tsx`:

```tsx
import { APIProvider, Map } from '@vis.gl/react-google-maps';

const PHOENIX_CENTER = { lat: 33.4484, lng: -112.0740 };

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return <div>Google Maps API key not configured.</div>;
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        style={{ width: '100vw', height: '100vh' }}
        defaultCenter={PHOENIX_CENTER}
        defaultZoom={11}
        mapId="food-list-map"
      />
    </APIProvider>
  );
}

export default App;
```

The map MUST fill the viewport (100vw × 100vh). This is the foundational layout — every other component overlays on top.

### API Key Note

`VITE_GOOGLE_MAPS_API_KEY=PLACEHOLDER_KEY` is sufficient for this story. The map will fail to render with a placeholder (Google will reject it), but the project compiles and the error state path is testable. Rhunnicutt will replace with a real key when available. Do NOT block story completion on a real API key.

### Tailwind Configuration

**If using Tailwind v4** (preferred — cleaner, no config file):
```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```
```css
/* src/index.css */
@import "tailwindcss";
```

**If using Tailwind v3** (fallback):
```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```
With `tailwind.config.js` pointing `content` to `./src/**/*.{ts,tsx}`.

### Error Boundary

For AC 3, a minimal conditional render is fine for this story — a full React Error Boundary class is NOT required until Story 1.2 adds data fetching. Just check for missing API key and show a `<div>` with a message.

### .gitignore

Ensure these are gitignored:
```
node_modules/
dist/
.env
```

The existing `.env.example` pattern is standard — commit `.env.example`, never `.env`.

### Project Structure Notes

- Vite's default `tsconfig.json` sets `"strict": true` — keep it, the architecture requires TypeScript strict mode
- The architecture specifies `@vis.gl/react-google-maps` (not any other Maps library) — this is the official Google-maintained wrapper
- `public/restaurants.json` is referenced by Story 1.2; create the `public/` folder now so the structure is ready, but leave `restaurants.json` for Story 1.2
- `src/App.tsx` will grow over subsequent stories — keep it clean and composable from the start

### References

- Architecture: `_bmad-output/docs/architecture.md` — Tech Stack, Project Structure, Google Maps API Integration, Map Initialization sections
- PRD: `_bmad-output/docs/prd.md` — MVP Feature Set, Technical Architecture sections
- Epic 1, Story 1.1: `_bmad-output/planning-artifacts/epics.md`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Scaffolded via temp-scaffold pattern (non-interactive), then moved files to project root.
- Used Tailwind v4 via `@tailwindcss/vite` plugin — no tailwind.config.js needed.
- `@vis.gl/react-google-maps` v1.8.1 installed; `APIProvider` + `Map` in App.tsx.
- Missing API key shows a styled error div (conditional render; no class ErrorBoundary needed per Dev Notes).
- TypeScript strict mode confirmed via `tsc --noEmit` (0 errors). Build passes.
- package name corrected from "temp-scaffold" to "food-list".

### File List

- `/Users/rhunnicutt/Food_List/index.html` — created (title: "Food List")
- `/Users/rhunnicutt/Food_List/package.json` — created
- `/Users/rhunnicutt/Food_List/vite.config.ts` — created (Tailwind v4 plugin)
- `/Users/rhunnicutt/Food_List/tsconfig.json` — created
- `/Users/rhunnicutt/Food_List/tsconfig.app.json` — created
- `/Users/rhunnicutt/Food_List/tsconfig.node.json` — created
- `/Users/rhunnicutt/Food_List/.env` — created (PLACEHOLDER_KEY)
- `/Users/rhunnicutt/Food_List/.env.example` — created
- `/Users/rhunnicutt/Food_List/.gitignore` — created
- `/Users/rhunnicutt/Food_List/src/index.css` — created (`@import "tailwindcss"`)
- `/Users/rhunnicutt/Food_List/src/main.tsx` — created (StrictMode + App)
- `/Users/rhunnicutt/Food_List/src/App.tsx` — created (APIProvider + Map)
- `/Users/rhunnicutt/Food_List/src/types/restaurant.ts` — created
- `/Users/rhunnicutt/Food_List/src/types/index.ts` — created
