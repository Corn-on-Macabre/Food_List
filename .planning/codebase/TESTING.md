# Testing Patterns

**Analysis Date:** 2026-04-18

## Test Framework

**Runner:**
- Vitest 4.1.2
- Config: `vite.config.ts` (embedded in Vite config)
- Environment: jsdom (browser-like DOM simulation)
- Globals enabled (no `import { describe, it, expect }` required, but explicitly imported anyway)

**Assertion Library:**
- Vitest assertions (no explicit separate library; uses expect)
- @testing-library/jest-dom for DOM matchers

**Run Commands:**
```bash
npm test                 # Run all tests once
npm run test:watch      # Watch mode for development
```

Test configuration in `vite.config.ts`:
```typescript
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test/setup.ts'],
}
```

## Test File Organization

**Location:**
- Co-located: Tests live alongside source code in `src/test/` directory
- Pattern: Separate `src/test/` directory rather than co-location with source files

**Naming:**
- `*.test.ts` for utility/hook tests: `generateSlugId.test.ts`, `useAdminAuth.test.ts`, `priceLevel.test.ts`
- `*.test.tsx` for component tests: `TierBadge.test.tsx`, `RestaurantCard.test.tsx`, `AdminLogin.test.tsx`, `App.test.tsx`
- Test files list in pattern: `src/test/[ComponentName].test.tsx`, `src/test/[hookName].test.ts`

**Structure:**
```
src/test/
├── setup.ts                      # Vitest setup file
├── App.test.tsx                  # App component tests
├── AdminLogin.test.tsx           # Component tests
├── RestaurantCard.test.tsx
├── TierBadge.test.tsx
├── useAdminAuth.test.ts          # Hook tests
├── useGeolocation.test.ts
├── usePlacesAutocomplete.test.ts
├── usePlaceDetails.test.ts
├── generateSlugId.test.ts        # Utility tests
├── priceLevel.test.ts
└── ... (additional test files)
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

describe('ComponentName', () => {
  describe('Feature area or AC group', () => {
    it('specific behavior being tested', () => {
      // arrange
      // act
      // assert
    });
  });
});
```

**Patterns:**

1. **Setup/Teardown:**
   - `beforeEach()` clears state (sessionStorage, mocks)
   - `afterEach()` unstubs environment variables: `vi.unstubAllEnvs()`
   - Used for test isolation in auth tests:
```typescript
beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});
```

2. **AAA Pattern (Arrange-Act-Assert):**
   - Implicit arrange (props/data setup)
   - Explicit act (render, fireEvent, etc.)
   - Clear assertions with specific matchers
```typescript
it('applies gold background color for loved tier', () => {
  // Arrange implicit in render call
  render(<TierBadge tier="loved" />);
  // Act is implicit in render
  const badge = screen.getByTestId('tier-badge');
  // Assert
  expect(badge).toHaveStyle({ backgroundColor: TIER_COLORS.loved });
});
```

3. **Test Grouping:**
   - Tests grouped by feature/acceptance criterion
   - Nested `describe()` blocks for logical grouping
```typescript
describe('RestaurantCard', () => {
  describe('Google Maps link (AC 1, 2, 3, 4)', () => {
    it('renders the link', () => { ... });
    it('sets href correctly', () => { ... });
  });
  describe('card content', () => {
    it('shows restaurant name', () => { ... });
  });
});
```

## Mocking

**Framework:** Vitest `vi` module

**Patterns:**

1. **Module mocking** (`vi.mock`):
```typescript
vi.mock("@vis.gl/react-google-maps", () => {
  const APIProvider = ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);
  const Map = ({ children, ...props }: any) =>
    React.createElement("div", { "data-testid": "mock-map" }, children);
  const useMap = () => null;
  return { APIProvider, Map, useMap };
});
```

2. **Environment variable stubbing** (`vi.stubEnv`):
```typescript
vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key');
vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
```
- Used before rendering when testing env-dependent behavior
- Cleaned up in `afterEach()` with `vi.unstubAllEnvs()`

3. **Custom render wrappers** for provider testing:
```typescript
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AdminAuthProvider, null, children);

const { result } = renderHook(() => useAdminAuth(), { wrapper });
```

4. **No-op callbacks:**
```typescript
const noop = () => {};

render(<RestaurantCard restaurant={mockRestaurant} onDismiss={noop} />);
```

**What to Mock:**
- External APIs and browser APIs (Google Maps, Places API, navigator.geolocation)
- Context providers when testing hooks in isolation
- HTTP calls (not present in this MVP)

**What NOT to Mock:**
- Internal components and utilities — test their real behavior
- React hooks like `useState`, `useEffect` — use real hooks
- Testing library helpers — they're part of the test infrastructure

## Fixtures and Factories

**Test Data:**
```typescript
const mockRestaurant: Restaurant = {
  id: "pho-43",
  name: "Pho 43",
  tier: "loved",
  cuisine: "Vietnamese",
  lat: 33.4484,
  lng: -112.074,
  notes: "Best pho in Phoenix",
  googleMapsUrl: "https://www.google.com/maps/place/Pho+43/@33.4484,-112.074",
  dateAdded: "2024-01-15",
};

const mockEnrichedRestaurant: Restaurant = {
  ...mockRestaurant,
  rating: 4.3,
  userRatingCount: 287,
  priceLevel: "PRICE_LEVEL_MODERATE",
};
```

**Location:**
- Test fixtures defined at top of test file (not in separate factory files)
- Pattern: Create base fixture, then spread/override for variants
- Named predictably: `mock[Entity]`, `mock[Entity][Variant]`
- Examples: `mockRestaurant`, `mockRestaurantNoNotes`, `mockEnrichedRestaurant`, `mockRatingOnlyRestaurant`

## Coverage

**Requirements:** Not enforced (no coverage threshold configured)

**View Coverage:**
- No explicit coverage command in package.json
- Can be run via: `vitest --coverage` (built-in Vitest capability)

## Test Types

**Unit Tests:**
- Scope: Individual functions, hooks, components
- Approach: Render/call with specific inputs, assert outputs
- Examples: `generateSlugId.test.ts` (pure functions), `TierBadge.test.tsx` (simple component)
- Setup: Minimal mocking, focus on behavior

**Integration Tests:**
- Scope: Multiple components working together, or component + context
- Approach: Render component tree with real providers, interact via user event
- Examples: `AdminLogin.test.tsx` (LoginComponent + AuthContext), `RestaurantCard.test.tsx` (Card + mocked GoogleMaps)
- Setup: Wrap components in providers, mock external APIs

**E2E Tests:**
- Framework: Not used (MVP scope is component/hook testing)
- Coverage: Acceptance criteria verified at component level instead

## Common Patterns

**Async Testing:**
```typescript
// For async state updates in hooks:
const { result } = renderHook(() => useAdminAuth(), { wrapper });
let success: boolean;
act(() => {
  success = result.current.login('testpass');
});
expect(success!).toBe(true);
expect(result.current.isAuthenticated).toBe(true);
```

- Use `act()` to wrap state updates
- Use `renderHook()` from @testing-library/react for hook testing
- Extract async values before assertions

**Component User Interactions:**
```typescript
it('shows error message after failed login attempt', () => {
  vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
  renderAdminLogin();
  const input = screen.getByPlaceholderText('Password');
  fireEvent.change(input, { target: { value: 'wrongpass' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  expect(screen.getByRole('alert')).toBeInTheDocument();
});
```

**Error Testing:**
```typescript
it('falls back to "#" href for non-http(s) URLs to prevent XSS (security)', () => {
  const maliciousRestaurant: Restaurant = {
    ...mockRestaurant,
    googleMapsUrl: "javascript:alert(document.cookie)",
  };
  render(<RestaurantCard restaurant={maliciousRestaurant} onDismiss={noop} />);
  const link = screen.getByRole("link", { name: "Open in Google Maps" });
  expect(link).toHaveAttribute("href", "#");
});
```

- Create edge-case fixtures for error scenarios
- Assert defensive behavior (XSS prevention, null-safety)

**Accessibility Testing:**
```typescript
it('has data-testid="tier-badge" attribute', () => {
  render(<TierBadge tier="loved" />);
  expect(screen.getByTestId('tier-badge')).toBeInTheDocument();
});

it('password input has an associated label for accessibility', () => {
  vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpass');
  renderAdminLogin();
  const input = screen.getByLabelText('Password');
  expect(input).toBeInTheDocument();
});
```

- Use `data-testid` for component targeting (not always relied on; role queries preferred)
- Verify accessible labels and ARIA attributes

## Setup and Initialization

**Global Setup File:** `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom';
```
- Imports jest-dom matchers globally for all tests
- No custom setup beyond matcher registration

**No Custom Reporters or Plugins:** Default Vitest output used

## Snapshot Testing

Not used in this codebase. All assertions are explicit behavior checks.

## Testing Utilities Index

**From @testing-library/react:**
- `render()` — render component to jsdom
- `renderHook()` — render hook in isolation with provider wrapper
- `screen` — query rendered output by role, testid, label, text
- `fireEvent` — simulate user interactions
- `act()` — wrap state updates for proper batching

**From vitest:**
- `describe()`, `it()` — test suite and case definitions
- `expect()` — assertions
- `vi.mock()`, `vi.stubEnv()` — mocking utilities
- `beforeEach()`, `afterEach()` — setup/teardown

---

*Testing analysis: 2026-04-18*
