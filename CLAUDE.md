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

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Food List — Phoenix Restaurant Map**

A map-based restaurant curation SPA for the Phoenix metro area. Single curator (Bobby), public-facing interactive Google Map with color-coded tier pins (Loved/Recommended/On My Radar), client-side filtering by cuisine/distance/tier/search, and a password-protected admin dashboard for managing the restaurant collection. Deployed as a static SPA + Express API on a VPS via Nginx.

**Core Value:** Users can open one URL and instantly see all curated restaurants on an interactive map, filter to what they want, and navigate to any restaurant — fast, visual, zero friction.

### Constraints

- **Maps library:** `@vis.gl/react-google-maps` only — no `@react-google-maps/api` or alternatives
- **No database:** Static JSON data layer for MVP
- **Styling:** Tailwind utility classes only — no custom CSS except `src/index.css` directives
- **Deployment:** rsync of `dist/` to VPS, Nginx serves static files
- **Tier colors:** Fixed — Loved=#F59E0B, Recommended=#3B82F6, On My Radar=#10B981
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.9.3 (strict mode) - Frontend React application
- JavaScript (ES2023) - Express.js backend API server
- JSON - Static data storage (`public/restaurants.json`), configuration
## Runtime
- Node.js 20 (Alpine) - Backend server via Docker
- Browser (ES2023, DOM support) - Frontend SPA
- npm - Both frontend and backend
- Lockfile: Present (implied by `package-lock.json` pattern, though not shown)
## Frameworks
- React 19.2.4 - UI component framework with hooks
- React Router DOM 7.14.0 - Client-side routing for SPA
- Express.js 4.21.0 - Backend API server
- @vis.gl/react-google-maps 1.8.1 - ONLY Maps library (strict requirement, not `@react-google-maps/api`)
- @googlemaps/markerclusterer 2.6.2 - Marker clustering on map
- Google Maps Places API (New) - Autocomplete and place details via browser global
- Tailwind CSS 4.2.2 - Utility-first styling
- @tailwindcss/vite 4.2.2 - Vite plugin for Tailwind
- Vitest 4.1.2 - Unit and integration test runner
- @testing-library/react 16.3.2 - React component testing
- @testing-library/user-event 14.6.1 - User interaction simulation
- @testing-library/jest-dom 6.9.1 - DOM matchers
- jsdom 29.0.1 - DOM implementation for tests
- Vite 8.0.1 - Frontend bundler and dev server
- @vitejs/plugin-react 6.0.1 - React support for Vite
- TypeScript compiler (tsc) - Type checking (runs before Vite build)
- ESLint 9.39.4 - Code quality
- typescript-eslint 8.57.0 - TypeScript support
- eslint-plugin-react-hooks 7.0.1 - React hooks rules
- eslint-plugin-react-refresh 0.5.2 - React fast refresh compatibility
- globals 17.4.0 - Global variable definitions
- CORS 2.8.5 - Cross-origin request handling (backend)
## Key Dependencies
- `@vis.gl/react-google-maps` - **ONLY** supported Maps library; do NOT use alternatives
- `google.maps` (global) - Places API (New), Geocoding, Autocomplete via browser script injection
- `express` - REST API server for admin persistence
- `react-router-dom` - Client-side routing for map and admin dashboard
- `@googlemaps/markerclusterer` - Clustering for 200+ restaurant pins
- `cors` - Backend CORS for admin and Places API requests
- `typescript` - Strict type safety throughout codebase
## Configuration
- `VITE_GOOGLE_MAPS_API_KEY` (required) - Google Maps JavaScript API key with Places API enabled
- `VITE_GOOGLE_MAPS_PLACES_API_KEY` (optional) - Separate Places API key (uses same key if not provided)
- `VITE_ADMIN_PASSWORD` (optional) - Password for admin dashboard (if using local auth fallback)
- `VITE_API_URL` (optional) - Backend API base URL, defaults to `/api`
- `PORT` (server-side) - Express server port, defaults to 3001
- `DATA_FILE` (server-side) - Path to restaurants.json, defaults to `/var/www/food-list/restaurants.json`
- `ADMIN_PASSWORD` (server-side, required) - Bearer token for API authentication
- `GOOGLE_API_KEY` (server-side, optional) - Google Places API key for enrichment pipeline
- `vite.config.ts` - Vite build config, jsdom for tests, Tailwind and React plugins
- `tsconfig.json` - TypeScript configuration references (aggregates `tsconfig.app.json`, `tsconfig.node.json`)
- `tsconfig.app.json` - Strict mode enabled, ES2023 target, JSX support, comprehensive linting rules
- `eslint.config.js` - Flat config format with React hooks and refresh rules
- `.env.example` - Template for environment variables
- `src/index.css` - Tailwind directives (only custom CSS file allowed)
- `src/main.tsx` - React DOM mount point
- `server/index.js` - Express app listening on PORT
## Platform Requirements
- Node.js 20+ (Alpine recommended for Docker)
- npm 10+
- TypeScript 5.9.3 (global or local)
- Google Cloud Console with Maps API and Places API enabled
- Valid Google Maps API key
- Node.js 20-alpine Docker container (or equivalent)
- Nginx web server with SSL/TLS (HTTPS only)
- Static file serving for SPA from `/var/www/food-list/dist`
- Express API server on port 3001 (behind Nginx proxy)
- `restaurants.json` writable at `/var/www/food-list/restaurants.json`
- VPS with Nginx and rsync capability (current: `food-list-vps:/var/www/food-list/`)
- SSL certificates (Let's Encrypt recommended)
- Nginx reverse proxy to Express backend
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Components: PascalCase, e.g., `TierBadge.tsx`, `FilterBar.tsx`, `RestaurantCard.tsx`
- Hooks: camelCase with `use` prefix, e.g., `useGeolocation.ts`, `usePlacesAutocomplete.ts`, `useAdminAuth.ts`
- Types: Separate `types/` directory with camelCase or PascalCase interfaces, e.g., `Restaurant`, `FilterState`, `PlacePrediction`
- Utils/Constants: camelCase for functions, SCREAMING_SNAKE_CASE for constants, e.g., `generateSlugId()`, `haversineDistance()`, `TIER_COLORS`, `DISTANCE_OPTIONS`
- Test files: Same name as source with `.test` or `.spec` suffix, e.g., `TierBadge.test.tsx`, `generateSlugId.test.ts`
- camelCase (all lowercase first word)
- Prefixed with verbs for actions: `generate*`, `format*`, `handle*`, `use*`
- Internal helpers with leading underscore are NOT used — all functions are exported
- Example: `generateSlugId()`, `generateUniqueSlugId()`, `formatPriceLevel()`, `haversineDistance()`
- camelCase for all variables and parameters
- Constants (module/file scope) use SCREAMING_SNAKE_CASE and `const`: `const SESSION_KEY = '...'`, `const TIER_OPTIONS = [...]`
- React hooks state follows pattern: `const [value, setValue]`
- Leading underscore convention not used; unused variables get underscores only in destructuring patterns
- PascalCase for interfaces and types: `Restaurant`, `FilterState`, `Tier`, `AdminAuthContextValue`
- Type imports use `type` keyword: `import type { Restaurant, FilterState } from './types'`
- Union types for discriminated values: `type Tier = "loved" | "recommended" | "on_my_radar"`
- Record types for mappings: `Record<Tier, string>`, `Record<string, string>`
## Code Style
- ESLint v9.39.4 with `@eslint/js` and `typescript-eslint`
- No explicit Prettier config, but code is formatted with consistent indentation (2 spaces inferred from code samples)
- Single quotes preferred in ESLint output (observed in test files)
- Strict TypeScript mode enabled: no `any`, no implicit returns
- ESLint config: `eslint.config.js` (modern flat config)
- Checked rules: `typescript-eslint` recommended, React Hooks rules enforced
- `react-refresh/only-export-components` warning rule for hot-reload safety: allows `allowConstantExport: true` for barrel exports
- Ignored directories: `dist`, `_bmad`, `_bmad-output`, `node_modules`
## Import Organization
- No path aliases configured in `tsconfig.app.json` (moduleResolution: "bundler")
- Relative imports used throughout: `'../types'`, `'../utils'`, `'../../contexts'`
## Error Handling
- Null checks for optional data: `if (!apiKey || apiKey === 'PLACEHOLDER_KEY') { return <Error /> }`
- Browser API availability checks: `if (typeof google === 'undefined' || !google?.maps?.places) { /* handle */ }`
- Geolocation error handling via error codes: `if (error.code === 1) { setDenied(true) }`
- Try-catch for async API calls with fallback state:
- Guard clauses to exit early: `if (!navigator.geolocation) { return; }`
- Environment variable validation at app startup (AC pattern enforcing config before render)
## Logging
- Limited logging in codebase; primarily defensive comments explain behavior
- No structured logging or error reporting library used (MVP scope)
- Comments document assumptions and gotchas (e.g., geolocation cancellation, React 18 unmount behavior)
## Comments
- Explain non-obvious behavior or decisions (especially around async quirks)
- Document workarounds and gotchas: `// NOTE: getCurrentPosition has no cancellation API...`
- Clarify intent for defensive code: `// Fail-safe: if env var not configured at build time, never auto-authenticate`
- Link to acceptance criteria (AC) in related code comments
- Used for public utility functions, especially for explaining complex behavior
- Used for utility function examples:
- Used to document hook return value semantics:
## Function Design
- Functions kept concise and focused (under 50 lines typical)
- Complex functions like `usePlacesAutocomplete` use modular effects and state management
- Component render functions remain clear (nested handlers allowed for single-use callbacks)
- Component props wrapped in single interface: `interface Props { ... }`
- Props interfaces for component-specific types prevent prop drilling
- Functions use explicit typed parameters (no object spreading pattern observed)
- Callbacks passed as handler functions: `(cuisine: string | null) => void`, `() => void`
- Explicit return types always specified (TypeScript strict mode)
- Hooks return interfaces for multi-value results: `interface UseGeolocationResult { ... }`
- Null used for "no selection" states: `coords: Coords | null`, `selected: Restaurant | null`
- Boolean returns for action success/failure: `login(): boolean`
## Module Design
- Named exports preferred over default exports (except React components)
- React components export as default: `export default function App() { ... }`
- Utilities export named functions: `export function generateSlugId(...) { ... }`
- Contexts export both provider and hook: `export function AdminAuthProvider(...) { ... }` and `export function useAdminAuth() { ... }`
- Type-only imports: `import type { Tier, Restaurant } from './types'`
- Used selectively for component exports: `src/components/index.ts` exports `{ ClusteredPins, PinLegend, RestaurantCard, ... }`
- Used for hooks: `src/hooks/index.ts` (likely, based on import pattern)
- Used for utilities: `src/utils/index.ts` exports distance utilities
- Provider and hook co-located in single file (comment: `/* eslint-disable react-refresh/only-export-components */`)
- Pattern: Create context with `createContext()`, export provider component, export hook that enforces provider usage
- Hook throws error if used outside provider: `if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')`
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Single-page application with React Router dual-route system: public map route (`/`) and protected admin route (`/admin`)
- Client-side filtering on ~200 static restaurant records (no server round-trips)
- React Context for session-based admin authentication
- Google Maps integration via `@vis.gl/react-google-maps` with marker clustering
- Type-safe data with TypeScript strict mode
## Layers
- Purpose: Render interactive UI and map interface
- Location: `src/components/`
- Contains: React functional components for map, filters, restaurant cards, admin panels, badges, forms
- Depends on: Hooks, types, utilities, constants
- Used by: Main App component and routes
- Purpose: Encapsulate component logic and external data fetching
- Location: `src/hooks/`
- Contains: Custom React hooks for restaurants, geolocation, auth, Google Places API integration
- Depends on: Types, API layer, browser APIs (Geolocation, Fetch)
- Used by: Components throughout the app
- Purpose: Provide session-scoped admin authentication state
- Location: `src/contexts/AdminAuthContext.tsx`
- Contains: AdminAuthProvider, useAdminAuth hook, password storage in sessionStorage
- Depends on: None (browser APIs)
- Used by: Admin routes, protected components
- Purpose: Encapsulate HTTP communication with backend for admin operations
- Location: `src/api/restaurants.ts`
- Contains: Functions for fetch/add/update/delete restaurants with Bearer token auth
- Depends on: Types
- Used by: AdminDashboard component, admin workflows
- Purpose: Type definitions and constants
- Location: `src/types/`, `src/constants/`
- Contains: Restaurant type, FilterState, Tier enum, tier color mappings
- Depends on: None
- Used by: All other layers
- Purpose: Shared calculation and formatting functions
- Location: `src/utils/`
- Contains: Haversine distance calculation, slug ID generation, Google Places type mapping, price level formatting
- Depends on: Types (some files)
- Used by: Components and hooks
## Data Flow
- **Component state:** React useState for filter state, selected restaurant, tab selection
- **Derived state:** useMemo for filtered restaurant list, unique cuisines
- **Context state:** AdminAuthProvider holds authentication status and password for API calls
- **Session storage:** sessionStorage['food-list-admin-auth'] persists auth across page reloads during same session
- **Server state:** All restaurant data reflects server (not optimistically updated); refetch after mutations
## Key Abstractions
- Purpose: Represents current filter selections across the public map
- Location: `src/types/restaurant.ts`
- Fields: cuisine (string | null), tier (Tier | null), maxDistance (number | null), searchTerm (string | null)
- Pattern: Immutable updates via useState setters
- Purpose: Core domain model for restaurant record
- Location: `src/types/restaurant.ts`
- Fields: id (slug), name, tier, cuisine, lat/lng, notes, googleMapsUrl, rating, userRatingCount, priceLevel, photoRef, featured, tags, dateAdded
- Pattern: Fully typed, passed between layers
- Purpose: Categorize restaurants into three levels
- Values: "loved" (gold #F59E0B), "recommended" (blue #3B82F6), "on_my_radar" (green #10B981)
- Pattern: Type-safe enum, color mappings in `src/constants/tierColors.ts`
- useRestaurants: Wraps fetch logic, handles loading/error states
- useGeolocation: Wraps browser Geolocation API, tracks denied permission
- useAdminAuth: Context consumer, provides login/logout/isAuthenticated
- usePlacesAutocomplete, usePlaceDetails: Wrap Google Places API calls
## Entry Points
- Location: `src/App.tsx` (AppWithMap component)
- Triggers: Route `/`
- Responsibilities: Initialize map, manage filter/selection state, render UI layers, handle geolocation
- Location: `src/components/AdminDashboard.tsx`
- Triggers: Route `/admin` + authenticated
- Responsibilities: Load restaurant list, manage add/edit/delete workflows, dual-sync state
- Location: `src/main.tsx`
- Triggers: Page load
- Responsibilities: Mount React app, wrap with BrowserRouter, validate API key
## Error Handling
- **Data fetch errors:** useRestaurants catches HTTP errors, displays overlay modal "Could not load restaurant data. Please refresh the page."
- **API key missing:** App.tsx checks VITE_GOOGLE_MAPS_API_KEY before rendering, shows error if missing/placeholder
- **Admin API errors:** AdminDashboard catch blocks set error state, user retries action or refreshes
- **Geolocation errors:** useGeolocation silently catches, sets denied flag (permission denied) or leaves coords null (unavailable), distance filter hidden
- **Form validation:** RestaurantDraftForm validates required fields before submit, PlacesSearchInput requires selection
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

| Skill | Description | Path |
|-------|-------------|------|
| ui-ux-pro-max | "UI/UX design intelligence. 67 styles, 96 palettes, 57 font pairings, 25 charts, 13 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, mobile app, .html, .tsx, .vue, .svelte. Elements: button, modal, navbar, sidebar, card, table, form, chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, flat design. Topics: color palette, accessibility, animation, layout, typography, font pairing, spacing, hover, shadow, gradient. Integrations: shadcn/ui MCP for component search and examples." | `.claude/skills/ui-ux-pro-max/SKILL.md` |
| domain-name-brainstormer | Generates creative domain name ideas for your project and checks availability across multiple TLDs (.com, .io, .dev, .ai, etc.). Saves hours of brainstorming and manual checking. | `.agents/skills/domain-name-brainstormer/SKILL.md` |
| find-skills | Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. This skill should be used when the user is looking for functionality that might exist as an installable skill. | `.agents/skills/find-skills/SKILL.md` |
| frontend-design | Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics. | `.agents/skills/frontend-design/SKILL.md` |
| vercel-composition-patterns | React composition patterns that scale. Use when refactoring components with boolean prop proliferation, building flexible component libraries, or designing reusable APIs. Triggers on tasks involving compound components, render props, context providers, or component architecture. Includes React 19 API changes. | `.agents/skills/vercel-composition-patterns/SKILL.md` |
| vercel-react-best-practices | React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements. | `.agents/skills/vercel-react-best-practices/SKILL.md` |
| web-design-guidelines | Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices". | `.agents/skills/web-design-guidelines/SKILL.md` |
| webapp-testing | Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs. | `.agents/skills/webapp-testing/SKILL.md` |
| bmad-advanced-elicitation | 'Push the LLM to reconsider, refine, and improve its recent output.' | `.cursor/skills/bmad-advanced-elicitation/SKILL.md` |
| bmad-analyst | analyst agent | `.cursor/skills/bmad-analyst/SKILL.md` |
| bmad-architect | architect agent | `.cursor/skills/bmad-architect/SKILL.md` |
| bmad-brainstorming | 'Facilitate interactive brainstorming sessions using diverse creative techniques and ideation methods. Use when the user says help me brainstorm or help me ideate.' | `.cursor/skills/bmad-brainstorming/SKILL.md` |
| bmad-check-implementation-readiness | 'Validate PRD, UX, Architecture and Epics specs are complete. Use when the user says "check implementation readiness".' | `.cursor/skills/bmad-check-implementation-readiness/SKILL.md` |
| bmad-code-review | 'Review code changes adversarially using parallel review layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor) with structured triage into actionable categories. Use when the user says "run code review" or "review this code"' | `.cursor/skills/bmad-code-review/SKILL.md` |
| bmad-correct-course | 'Manage significant changes during sprint execution. Use when the user says "correct course" or "propose sprint change"' | `.cursor/skills/bmad-correct-course/SKILL.md` |
| bmad-create-architecture | 'Create architecture solution design decisions for AI agent consistency. Use when the user says "lets create architecture" or "create technical architecture" or "create a solution design"' | `.cursor/skills/bmad-create-architecture/SKILL.md` |
| bmad-create-epics-and-stories | 'Break requirements into epics and user stories. Use when the user says "create the epics and stories list"' | `.cursor/skills/bmad-create-epics-and-stories/SKILL.md` |
| bmad-create-prd | 'Create a PRD from scratch. Use when the user says "lets create a product requirements document" or "I want to create a new PRD"' | `.cursor/skills/bmad-create-prd/SKILL.md` |
| bmad-create-product-brief | 'Create product brief through collaborative discovery. Use when the user says "lets create a product brief" or "help me create a project brief"' | `.cursor/skills/bmad-create-product-brief/SKILL.md` |
| bmad-create-story | 'Creates a dedicated story file with all the context the agent will need to implement it later. Use when the user says "create the next story" or "create story [story identifier]"' | `.cursor/skills/bmad-create-story/SKILL.md` |
| bmad-create-ux-design | 'Plan UX patterns and design specifications. Use when the user says "lets create UX design" or "create UX specifications" or "help me plan the UX"' | `.cursor/skills/bmad-create-ux-design/SKILL.md` |
| bmad-dev | dev agent | `.cursor/skills/bmad-dev/SKILL.md` |
| bmad-dev-story | 'Execute story implementation following a context filled story spec file. Use when the user says "dev this story [story file]" or "implement the next story in the sprint plan"' | `.cursor/skills/bmad-dev-story/SKILL.md` |
| bmad-distillator | Lossless LLM-optimized compression of source documents. Use when the user requests to 'distill documents' or 'create a distillate'. | `.cursor/skills/bmad-distillator/SKILL.md` |
| bmad-document-project | 'Document brownfield projects for AI context. Use when the user says "document this project" or "generate project docs"' | `.cursor/skills/bmad-document-project/SKILL.md` |
| bmad-domain-research | 'Conduct domain and industry research. Use when the user says "lets create a research report on [domain or industry]"' | `.cursor/skills/bmad-domain-research/SKILL.md` |
| bmad-edit-prd | 'Edit an existing PRD. Use when the user says "edit this PRD".' | `.cursor/skills/bmad-edit-prd/SKILL.md` |
| bmad-editorial-review-prose | 'Clinical copy-editor that reviews text for communication issues. Use when user says review for prose or improve the prose' | `.cursor/skills/bmad-editorial-review-prose/SKILL.md` |
| bmad-editorial-review-structure | 'Structural editor that proposes cuts, reorganization, and simplification while preserving comprehension. Use when user requests structural review or editorial review of structure' | `.cursor/skills/bmad-editorial-review-structure/SKILL.md` |
| bmad-generate-project-context | 'Create project-context.md with AI rules. Use when the user says "generate project context" or "create project context"' | `.cursor/skills/bmad-generate-project-context/SKILL.md` |
| bmad-help | 'Analyzes current state and user query to answer BMad questions or recommend the next workflow or agent. Use when user says what should I do next, what do I do now, or asks a question about BMad' | `.cursor/skills/bmad-help/SKILL.md` |
| bmad-index-docs | 'Generates or updates an index.md to reference all docs in the folder. Use if user requests to create or update an index of all files in a specific folder' | `.cursor/skills/bmad-index-docs/SKILL.md` |
| bmad-market-research | 'Conduct market research on competition and customers. Use when the user says "create a market research report about [business idea]".' | `.cursor/skills/bmad-market-research/SKILL.md` |
| bmad-party-mode | 'Orchestrates group discussions between all installed BMAD agents, enabling natural multi-agent conversations. Use when user requests party mode.' | `.cursor/skills/bmad-party-mode/SKILL.md` |
| bmad-pm | pm agent | `.cursor/skills/bmad-pm/SKILL.md` |
| bmad-product-brief-preview | Create or update product briefs through guided or autonomous discovery. Use when the user requests to 'create a product brief', 'help me create a project brief', or 'update my product brief'. | `.cursor/skills/bmad-product-brief-preview/SKILL.md` |
| bmad-qa | qa agent | `.cursor/skills/bmad-qa/SKILL.md` |
| bmad-qa-generate-e2e-tests | 'Generate end to end automated tests for existing features. Use when the user says "create qa automated tests for [feature]"' | `.cursor/skills/bmad-qa-generate-e2e-tests/SKILL.md` |
| bmad-quick-dev | 'Implement a Quick Tech Spec for small changes or features. Use when the user provides a quick tech spec and says "implement this quick spec" or "proceed with implementation of [quick tech spec]"' | `.cursor/skills/bmad-quick-dev/SKILL.md` |
| bmad-quick-dev-new-preview | 'Implements any user intent, requirement, story, bug fix or change request by producing clean working code artifacts that follow the project''s existing architecture, patterns and conventions. Use when the user wants to build, fix, tweak, refactor, add or modify any code, component or feature.' | `.cursor/skills/bmad-quick-dev-new-preview/SKILL.md` |
| bmad-quick-flow-solo-dev | quick-flow-solo-dev agent | `.cursor/skills/bmad-quick-flow-solo-dev/SKILL.md` |
| bmad-quick-spec | 'Very quick process to create implementation-ready quick specs for small changes or features. Use when the user says "create a quick spec" or "generate a quick tech spec"' | `.cursor/skills/bmad-quick-spec/SKILL.md` |
| bmad-retrospective | 'Post-epic review to extract lessons and assess success. Use when the user says "run a retrospective" or "lets retro the epic [epic]"' | `.cursor/skills/bmad-retrospective/SKILL.md` |
| bmad-review-adversarial-general | 'Perform a Cynical Review and produce a findings report. Use when the user requests a critical review of something' | `.cursor/skills/bmad-review-adversarial-general/SKILL.md` |
| bmad-review-edge-case-hunter | 'Walk every branching path and boundary condition in content, report only unhandled edge cases. Orthogonal to adversarial review - method-driven not attitude-driven. Use when you need exhaustive edge-case analysis of code, specs, or diffs.' | `.cursor/skills/bmad-review-edge-case-hunter/SKILL.md` |
| bmad-shard-doc | 'Splits large markdown documents into smaller, organized files based on level 2 (default) sections. Use if the user says perform shard document' | `.cursor/skills/bmad-shard-doc/SKILL.md` |
| bmad-sm | sm agent | `.cursor/skills/bmad-sm/SKILL.md` |
| bmad-sprint-planning | 'Generate sprint status tracking from epics. Use when the user says "run sprint planning" or "generate sprint plan"' | `.cursor/skills/bmad-sprint-planning/SKILL.md` |
| bmad-sprint-status | 'Summarize sprint status and surface risks. Use when the user says "check sprint status" or "show sprint status"' | `.cursor/skills/bmad-sprint-status/SKILL.md` |
| bmad-tech-writer | tech-writer agent | `.cursor/skills/bmad-tech-writer/SKILL.md` |
| bmad-technical-research | 'Conduct technical research on technologies and architecture. Use when the user says "create a technical research report on [topic]".' | `.cursor/skills/bmad-technical-research/SKILL.md` |
| bmad-ux-designer | ux-designer agent | `.cursor/skills/bmad-ux-designer/SKILL.md` |
| bmad-validate-prd | 'Validate a PRD against standards. Use when the user says "validate this PRD" or "run PRD validation"' | `.cursor/skills/bmad-validate-prd/SKILL.md` |
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
