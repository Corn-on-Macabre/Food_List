# Coding Conventions

**Analysis Date:** 2026-04-18

## Naming Patterns

**Files:**
- Components: PascalCase, e.g., `TierBadge.tsx`, `FilterBar.tsx`, `RestaurantCard.tsx`
- Hooks: camelCase with `use` prefix, e.g., `useGeolocation.ts`, `usePlacesAutocomplete.ts`, `useAdminAuth.ts`
- Types: Separate `types/` directory with camelCase or PascalCase interfaces, e.g., `Restaurant`, `FilterState`, `PlacePrediction`
- Utils/Constants: camelCase for functions, SCREAMING_SNAKE_CASE for constants, e.g., `generateSlugId()`, `haversineDistance()`, `TIER_COLORS`, `DISTANCE_OPTIONS`
- Test files: Same name as source with `.test` or `.spec` suffix, e.g., `TierBadge.test.tsx`, `generateSlugId.test.ts`

**Functions:**
- camelCase (all lowercase first word)
- Prefixed with verbs for actions: `generate*`, `format*`, `handle*`, `use*`
- Internal helpers with leading underscore are NOT used — all functions are exported
- Example: `generateSlugId()`, `generateUniqueSlugId()`, `formatPriceLevel()`, `haversineDistance()`

**Variables:**
- camelCase for all variables and parameters
- Constants (module/file scope) use SCREAMING_SNAKE_CASE and `const`: `const SESSION_KEY = '...'`, `const TIER_OPTIONS = [...]`
- React hooks state follows pattern: `const [value, setValue]`
- Leading underscore convention not used; unused variables get underscores only in destructuring patterns

**Types:**
- PascalCase for interfaces and types: `Restaurant`, `FilterState`, `Tier`, `AdminAuthContextValue`
- Type imports use `type` keyword: `import type { Restaurant, FilterState } from './types'`
- Union types for discriminated values: `type Tier = "loved" | "recommended" | "on_my_radar"`
- Record types for mappings: `Record<Tier, string>`, `Record<string, string>`

## Code Style

**Formatting:**
- ESLint v9.39.4 with `@eslint/js` and `typescript-eslint`
- No explicit Prettier config, but code is formatted with consistent indentation (2 spaces inferred from code samples)
- Single quotes preferred in ESLint output (observed in test files)
- Strict TypeScript mode enabled: no `any`, no implicit returns

**Linting:**
- ESLint config: `eslint.config.js` (modern flat config)
- Checked rules: `typescript-eslint` recommended, React Hooks rules enforced
- `react-refresh/only-export-components` warning rule for hot-reload safety: allows `allowConstantExport: true` for barrel exports
- Ignored directories: `dist`, `_bmad`, `_bmad-output`, `node_modules`

**Key style observations:**
```typescript
// Immutable const declarations for module-level values
const SESSION_KEY = 'food-list-admin-auth';
const TIER_COLORS: Record<Tier, string> = { /* ... */ };
const DISTANCE_OPTIONS: ReadonlyArray<{ label: string; miles: number }> = [ /* ... */ ] as const;

// Explicit return types on functions
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number

// Props interfaces named simply
interface FilterBarProps { /* ... */ }
interface Props { /* ... */ }

// Inline helper functions at module/component scope
const toRad = (deg: number): number => (deg * Math.PI) / 180;
```

## Import Organization

**Order:**
1. React/external libraries: `import { useState, useEffect } from 'react'`
2. Third-party packages: `import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'`
3. Local components/contexts: `import { ClusteredPins, PinLegend } from './components'`
4. Types: `import type { Restaurant, FilterState } from './types'`
5. Utilities: `import { haversineDistance } from './utils'`
6. Styles: `import './index.css'`

**Path Aliases:**
- No path aliases configured in `tsconfig.app.json` (moduleResolution: "bundler")
- Relative imports used throughout: `'../types'`, `'../utils'`, `'../../contexts'`

## Error Handling

**Patterns:**
- Null checks for optional data: `if (!apiKey || apiKey === 'PLACEHOLDER_KEY') { return <Error /> }`
- Browser API availability checks: `if (typeof google === 'undefined' || !google?.maps?.places) { /* handle */ }`
- Geolocation error handling via error codes: `if (error.code === 1) { setDenied(true) }`
- Try-catch for async API calls with fallback state:
```typescript
try {
  const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({ ... });
  setPredictions(mapped);
  setError(null);
} catch {
  setPredictions([]);
  setError('Places API unavailable');
}
```
- Guard clauses to exit early: `if (!navigator.geolocation) { return; }`
- Environment variable validation at app startup (AC pattern enforcing config before render)

## Logging

**Framework:** `console` only (no external logging library)

**Patterns:**
- Limited logging in codebase; primarily defensive comments explain behavior
- No structured logging or error reporting library used (MVP scope)
- Comments document assumptions and gotchas (e.g., geolocation cancellation, React 18 unmount behavior)

## Comments

**When to Comment:**
- Explain non-obvious behavior or decisions (especially around async quirks)
- Document workarounds and gotchas: `// NOTE: getCurrentPosition has no cancellation API...`
- Clarify intent for defensive code: `// Fail-safe: if env var not configured at build time, never auto-authenticate`
- Link to acceptance criteria (AC) in related code comments

**JSDoc/TSDoc:**
- Used for public utility functions, especially for explaining complex behavior
```typescript
/**
 * Calculate the great-circle distance between two lat/lng coordinates
 * using the Haversine formula. Returns distance in miles.
 */
export function haversineDistance( ... ): number
```

- Used for utility function examples:
```typescript
/**
 * Converts a restaurant name to a URL-safe slug ID.
 * Examples:
 *   "Pho 43"          → "pho-43"
 *   "Tacos El Patrón" → "tacos-el-patron"
 *   "J&G Steakhouse"  → "j-g-steakhouse"
 */
export function generateSlugId(name: string): string
```

- Used to document hook return value semantics:
```typescript
/** true if the user explicitly denied the geolocation permission prompt (error.code === 1).
 *  Consumed by the distance filter in Story 3.2 to hide the control when location is unavailable. */
denied: boolean;
```

## Function Design

**Size:**
- Functions kept concise and focused (under 50 lines typical)
- Complex functions like `usePlacesAutocomplete` use modular effects and state management
- Component render functions remain clear (nested handlers allowed for single-use callbacks)

**Parameters:**
- Component props wrapped in single interface: `interface Props { ... }`
- Props interfaces for component-specific types prevent prop drilling
- Functions use explicit typed parameters (no object spreading pattern observed)
- Callbacks passed as handler functions: `(cuisine: string | null) => void`, `() => void`

**Return Values:**
- Explicit return types always specified (TypeScript strict mode)
- Hooks return interfaces for multi-value results: `interface UseGeolocationResult { ... }`
- Null used for "no selection" states: `coords: Coords | null`, `selected: Restaurant | null`
- Boolean returns for action success/failure: `login(): boolean`

## Module Design

**Exports:**
- Named exports preferred over default exports (except React components)
- React components export as default: `export default function App() { ... }`
- Utilities export named functions: `export function generateSlugId(...) { ... }`
- Contexts export both provider and hook: `export function AdminAuthProvider(...) { ... }` and `export function useAdminAuth() { ... }`
- Type-only imports: `import type { Tier, Restaurant } from './types'`

**Barrel Files:**
- Used selectively for component exports: `src/components/index.ts` exports `{ ClusteredPins, PinLegend, RestaurantCard, ... }`
- Used for hooks: `src/hooks/index.ts` (likely, based on import pattern)
- Used for utilities: `src/utils/index.ts` exports distance utilities

**Context Pattern:**
- Provider and hook co-located in single file (comment: `/* eslint-disable react-refresh/only-export-components */`)
- Pattern: Create context with `createContext()`, export provider component, export hook that enforces provider usage
- Hook throws error if used outside provider: `if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')`

---

*Convention analysis: 2026-04-18*
