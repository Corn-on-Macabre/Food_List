# Codebase Structure

**Analysis Date:** 2026-04-18

## Directory Layout

```
Food_List/
├── src/                     # Application source code
│   ├── api/                 # HTTP API client functions
│   ├── assets/              # Images and static assets
│   ├── components/          # React functional components
│   ├── constants/           # Constant values (tier colors)
│   ├── contexts/            # React Context providers
│   ├── hooks/               # Custom React hooks
│   ├── test/                # Test utilities and fixtures
│   ├── types/               # TypeScript interfaces and enums
│   ├── utils/               # Utility functions (math, formatting, ID generation)
│   ├── App.tsx              # Root app component with routing
│   ├── main.tsx             # Application bootstrap entry point
│   ├── index.css            # Global Tailwind directives
│   └── vite-env.d.ts        # Vite environment type declarations
├── public/                  # Static assets served as-is
│   ├── restaurants.json     # Static restaurant data (MVP database)
│   ├── favicon.svg          # Favicon
│   └── icons.svg            # SVG sprite for custom icons
├── .planning/codebase/      # Codebase mapping documents (this directory)
├── index.html               # HTML entry point
├── package.json             # Project manifest and dependencies
├── vite.config.ts           # Vite build and test configuration
├── tsconfig.json            # TypeScript strict mode configuration
├── eslint.config.js         # ESLint rules
└── .env.example             # Environment variable template (secrets not in repo)
```

## Directory Purposes

**src/api/:**
- Purpose: HTTP API client for admin backend operations
- Contains: Fetch functions with Bearer token auth headers
- Key files: `restaurants.ts` (CRUD operations for restaurant mutations)

**src/assets/:**
- Purpose: Bundled images and media (if any)
- Contains: Any images imported via ES modules
- Key files: None currently in use; structure ready for future assets

**src/components/:**
- Purpose: React functional components for UI rendering
- Contains: Map UI, filter bar, restaurant cards, admin panels, form inputs, badges
- Key files:
  - `App.tsx` (co-located here in practice; main router) — see src/App.tsx
  - `ClusteredPins.tsx` — Map pins with marker clustering
  - `FilterBar.tsx` — Search, cuisine, tier, distance filters
  - `RestaurantCard.tsx` — Floating card displaying selected restaurant details
  - `AdminDashboard.tsx` — Main admin panel (list + add tabs)
  - `RestaurantDraftForm.tsx` — Form for adding new restaurants
  - `RestaurantListPanel.tsx` — Table of all restaurants with edit controls
  - `PlacesSearchInput.tsx` — Google Places Autocomplete integration
  - `AdminLogin.tsx` — Password entry for admin access
  - `ProtectedRoute.tsx` — Route guard checking authentication
  - `formStyles.ts` — Shared Tailwind form styling constants
  - `index.ts` — Barrel file exporting all components

**src/constants/:**
- Purpose: Application-wide constant values
- Contains: Tier-to-color mappings
- Key files: `tierColors.ts` (Record mapping Tier → hex color)

**src/contexts/:**
- Purpose: React Context providers for application state
- Contains: Authentication context, session management
- Key files: `AdminAuthContext.tsx` (provider + useAdminAuth hook)

**src/hooks/:**
- Purpose: Custom React hooks encapsulating business logic and external APIs
- Contains: Data fetching, browser APIs, Google Places integration
- Key files:
  - `useRestaurants.ts` — Fetch restaurants.json on mount
  - `useGeolocation.ts` — Browser geolocation with permission tracking
  - `useAdminAuth.ts` — Context consumer (colocated in contexts, exported from hooks/index.ts)
  - `usePlacesAutocomplete.ts` — Google Places Autocomplete session
  - `usePlaceDetails.ts` — Fetch place details (rating, photo) by place ID
  - `useAddressAutocomplete.ts` — Address-specific autocomplete
  - `useAddressGeocode.ts` — Convert address string → coordinates
  - `index.ts` — Barrel file exporting all hooks

**src/test/:**
- Purpose: Test utilities, fixtures, and setup
- Contains: Vitest configuration, test helper functions, test files for components/hooks
- Key files:
  - `setup.ts` — Vitest environment setup (@testing-library/jest-dom imports)
  - `*.test.tsx`, `*.test.ts` — Component and hook unit/integration tests

**src/types/:**
- Purpose: TypeScript type definitions and interfaces
- Contains: Domain models, filter state, type guards
- Key files:
  - `restaurant.ts` — Restaurant interface, Tier type, FilterState interface
  - `index.ts` — Barrel export of all types

**src/utils/:**
- Purpose: Utility functions for calculations and transformations
- Contains: Distance math, slug ID generation, Google Places mapping, price formatting
- Key files:
  - `distance.ts` — Haversine formula (lat/lng → miles), DISTANCE_OPTIONS config
  - `generateSlugId.ts` — Create URL-safe restaurant IDs
  - `mapPlaceType.ts` — Convert Google Places type → cuisine string
  - `priceLevel.ts` — Format price level enum → display string
  - `index.ts` — Barrel export of all utilities

**public/:**
- Purpose: Static assets served directly without processing
- Contains: restaurants.json (MVP data store), favicon, icon sprite
- Key files:
  - `restaurants.json` — Array of Restaurant objects, served as `/restaurants.json` in fetch calls
  - `favicon.svg` — Tab icon
  - `icons.svg` — SVG sprite for custom icons (if used)

## Key File Locations

**Entry Points:**
- `src/main.tsx` — React app bootstrap; mounts App component to #root
- `src/App.tsx` — Root router component; routes to public map or admin panel
- `index.html` — HTML entry point with `<div id="root">`

**Configuration:**
- `.env.example` — Template for build-time environment variables (VITE_GOOGLE_MAPS_API_KEY, VITE_ADMIN_PASSWORD)
- `vite.config.ts` — Vite build config, Vitest test env setup
- `tsconfig.json` — TypeScript strict mode enforcement
- `eslint.config.js` — Linting rules
- `package.json` — Dependencies: React 19, Vite, TypeScript, Tailwind, @vis.gl/react-google-maps

**Core Logic:**
- `src/hooks/useRestaurants.ts` — Fetch and cache static restaurant data
- `src/hooks/useGeolocation.ts` — User location acquisition
- `src/hooks/useAdminAuth.ts` — (via contexts) Admin authentication state
- `src/api/restaurants.ts` — Admin CRUD API calls
- `src/utils/distance.ts` — Haversine distance filtering

**Testing:**
- `src/test/setup.ts` — Vitest setup
- `src/components/*.test.tsx` or `src/test/*.test.tsx` — Component and hook tests
- `src/hooks/*.test.ts` — Hook unit tests

## Naming Conventions

**Files:**
- Components: PascalCase.tsx (e.g., FilterBar.tsx, RestaurantCard.tsx)
- Hooks: camelCase.ts with use prefix (e.g., useRestaurants.ts, useGeolocation.ts)
- Utilities: camelCase.ts (e.g., distance.ts, generateSlugId.ts)
- Types: camelCase.ts (e.g., restaurant.ts)
- Tests: *.test.tsx or *.test.ts co-located with source or in src/test/
- Constants: camelCase.ts (e.g., tierColors.ts)

**Directories:**
- Domain directories: lowercase singular (src/components/, src/hooks/, src/utils/)
- Multi-word: no hyphens (src/contexts/ not src/context-providers/)

## Where to Add New Code

**New Feature (e.g., user reviews on restaurants):**
- Primary code: Create new component in `src/components/` (e.g., ReviewPanel.tsx)
- Hook logic: Create new hook in `src/hooks/` if fetching data (e.g., useReviews.ts)
- Type: Add interface to `src/types/restaurant.ts` or `src/types/index.ts`
- Tests: Add `src/test/ReviewPanel.test.tsx` or co-locate as `src/components/ReviewPanel.test.tsx`
- Styling: Use Tailwind utility classes in the JSX; no custom CSS files

**New Component:**
- Implementation: `src/components/ComponentName.tsx`
- Export: Add to `src/components/index.ts` barrel file
- Tests: `src/test/ComponentName.test.tsx`

**Utilities (math, formatting, helpers):**
- Shared helpers: `src/utils/functionName.ts`
- Export: Add to `src/utils/index.ts` barrel file
- Tests: `src/utils/functionName.test.ts`

**Hooks (custom React logic):**
- Implementation: `src/hooks/useName.ts`
- Export: Add to `src/hooks/index.ts` barrel file
- Tests: `src/hooks/useName.test.ts` or `src/test/useName.test.ts`

**Constants (colors, distances, strings):**
- Single constant: Add to `src/constants/constantName.ts`
- Enum-like: Create new file in `src/constants/`
- Export: Inline or via barrel if multiple

**Admin Features (restricted to /admin route):**
- Components: Same as above, but used only in AdminDashboard
- Auth state: Use useAdminAuth hook from AdminAuthProvider
- API calls: Use functions from `src/api/restaurants.ts`; pass password from context

## Special Directories

**node_modules/:**
- Purpose: Installed dependencies (git-ignored)
- Generated: Yes (via npm install)
- Committed: No

**dist/:**
- Purpose: Built output for deployment
- Generated: Yes (via vite build)
- Committed: No

**.planning/codebase/:**
- Purpose: Codebase mapping documentation
- Generated: No (manually created)
- Committed: Yes (tracks architecture decisions)

**public/:**
- Purpose: Static files served without transformation
- Committed: Yes (restaurants.json is the MVP data store)
- Special: restaurants.json is the database; admin API mutations persist back to this file

---

*Structure analysis: 2026-04-18*
