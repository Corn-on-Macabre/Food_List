# Technology Stack

**Analysis Date:** 2026-04-18

## Languages

**Primary:**
- TypeScript 5.9.3 (strict mode) - Frontend React application
- JavaScript (ES2023) - Express.js backend API server

**Secondary:**
- JSON - Static data storage (`public/restaurants.json`), configuration

## Runtime

**Environment:**
- Node.js 20 (Alpine) - Backend server via Docker
- Browser (ES2023, DOM support) - Frontend SPA

**Package Manager:**
- npm - Both frontend and backend
- Lockfile: Present (implied by `package-lock.json` pattern, though not shown)

## Frameworks

**Core:**
- React 19.2.4 - UI component framework with hooks
- React Router DOM 7.14.0 - Client-side routing for SPA
- Express.js 4.21.0 - Backend API server

**Maps & Location:**
- @vis.gl/react-google-maps 1.8.1 - ONLY Maps library (strict requirement, not `@react-google-maps/api`)
- @googlemaps/markerclusterer 2.6.2 - Marker clustering on map
- Google Maps Places API (New) - Autocomplete and place details via browser global

**UI/Styling:**
- Tailwind CSS 4.2.2 - Utility-first styling
- @tailwindcss/vite 4.2.2 - Vite plugin for Tailwind

**Testing:**
- Vitest 4.1.2 - Unit and integration test runner
- @testing-library/react 16.3.2 - React component testing
- @testing-library/user-event 14.6.1 - User interaction simulation
- @testing-library/jest-dom 6.9.1 - DOM matchers
- jsdom 29.0.1 - DOM implementation for tests

**Build/Dev:**
- Vite 8.0.1 - Frontend bundler and dev server
- @vitejs/plugin-react 6.0.1 - React support for Vite
- TypeScript compiler (tsc) - Type checking (runs before Vite build)

**Linting:**
- ESLint 9.39.4 - Code quality
- typescript-eslint 8.57.0 - TypeScript support
- eslint-plugin-react-hooks 7.0.1 - React hooks rules
- eslint-plugin-react-refresh 0.5.2 - React fast refresh compatibility
- globals 17.4.0 - Global variable definitions

**Utility:**
- CORS 2.8.5 - Cross-origin request handling (backend)

## Key Dependencies

**Critical:**
- `@vis.gl/react-google-maps` - **ONLY** supported Maps library; do NOT use alternatives
- `google.maps` (global) - Places API (New), Geocoding, Autocomplete via browser script injection
- `express` - REST API server for admin persistence
- `react-router-dom` - Client-side routing for map and admin dashboard

**Infrastructure:**
- `@googlemaps/markerclusterer` - Clustering for 200+ restaurant pins
- `cors` - Backend CORS for admin and Places API requests
- `typescript` - Strict type safety throughout codebase

## Configuration

**Environment:**
- `VITE_GOOGLE_MAPS_API_KEY` (required) - Google Maps JavaScript API key with Places API enabled
- `VITE_GOOGLE_MAPS_PLACES_API_KEY` (optional) - Separate Places API key (uses same key if not provided)
- `VITE_ADMIN_PASSWORD` (optional) - Password for admin dashboard (if using local auth fallback)
- `VITE_API_URL` (optional) - Backend API base URL, defaults to `/api`
- `PORT` (server-side) - Express server port, defaults to 3001
- `DATA_FILE` (server-side) - Path to restaurants.json, defaults to `/var/www/food-list/restaurants.json`
- `ADMIN_PASSWORD` (server-side, required) - Bearer token for API authentication
- `GOOGLE_API_KEY` (server-side, optional) - Google Places API key for enrichment pipeline

**Build:**
- `vite.config.ts` - Vite build config, jsdom for tests, Tailwind and React plugins
- `tsconfig.json` - TypeScript configuration references (aggregates `tsconfig.app.json`, `tsconfig.node.json`)
- `tsconfig.app.json` - Strict mode enabled, ES2023 target, JSX support, comprehensive linting rules
- `eslint.config.js` - Flat config format with React hooks and refresh rules
- `.env.example` - Template for environment variables

**Frontend Entry:**
- `src/index.css` - Tailwind directives (only custom CSS file allowed)
- `src/main.tsx` - React DOM mount point

**Backend Entry:**
- `server/index.js` - Express app listening on PORT

## Platform Requirements

**Development:**
- Node.js 20+ (Alpine recommended for Docker)
- npm 10+
- TypeScript 5.9.3 (global or local)
- Google Cloud Console with Maps API and Places API enabled
- Valid Google Maps API key

**Production:**
- Node.js 20-alpine Docker container (or equivalent)
- Nginx web server with SSL/TLS (HTTPS only)
- Static file serving for SPA from `/var/www/food-list/dist`
- Express API server on port 3001 (behind Nginx proxy)
- `restaurants.json` writable at `/var/www/food-list/restaurants.json`

**Deployment:**
- VPS with Nginx and rsync capability (current: `food-list-vps:/var/www/food-list/`)
- SSL certificates (Let's Encrypt recommended)
- Nginx reverse proxy to Express backend

---

*Stack analysis: 2026-04-18*
