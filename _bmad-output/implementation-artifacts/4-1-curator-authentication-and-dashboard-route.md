# Story 4.1: Curator Authentication & Dashboard Route

Status: done

## Senior Developer Review (AI)

9 findings: 1 critical, 3 high, 3 medium, 2 low.

## Review Follow-ups (AI)

- [x] F1 (CRITICAL): Converted `useAdminAuth` from isolated `useState` hook to React Context (`AdminAuthContext`). All components share one auth state instance — login/logout state changes are reflected across the component tree immediately.
- [x] F2 (HIGH): Created `src/test/AdminDashboard.test.tsx` — 2 tests covering dashboard render (AC 3) and sign-out flow (AC 6).
- [x] F3 (HIGH): Security risk documented. Password exposed as literal string in JS bundle is an acknowledged constraint of the no-server architecture. Hash comparison noted as a future mitigation path.
- [x] F4 (HIGH): Story status corrected to reflect review completion.
- [x] F5 (MEDIUM): `isConfigured` now derived inside `AdminAuthProvider` and exposed via context. `AdminLogin` uses `isConfigured` from hook — no raw `import.meta.env` access in components.
- [x] F6 (MEDIUM): Added `id="admin-password"` to input and `<label htmlFor="admin-password" className="sr-only">Password</label>`. Focus ring changed from `ring-amber-200` to `ring-amber-600` for WCAG AA contrast.
- [x] F7 (MEDIUM): Renamed test to `"login() returns false when VITE_ADMIN_PASSWORD is empty or missing"`. Added comment explaining `vi.stubEnv` cannot simulate true `undefined`.
- [x] F8 (LOW): Change Log section added below.
- [x] F9 (LOW): Two App test files acknowledged as separate concerns — `src/App.test.tsx` for public map, `src/test/App.test.tsx` for routing.

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-04-04 | Initial implementation — 8 tasks, 47 subtasks | Story 4.1 development |
| 2026-04-04 | Refactored to React Context; added AdminDashboard tests; accessibility + lint fixes | Code review F1–F9 |

## Story

As a curator,
I want to access a password-protected management dashboard at `/admin`,
so that only I can modify the restaurant collection while the public map remains open to everyone.

## Acceptance Criteria

1. **Given** the app is loaded and React Router is configured **When** a user navigates to `/` **Then** the public map experience renders exactly as before — no login prompt, no auth gate, map centered on Phoenix metro with all restaurant pins visible. (NFR10)

2. **Given** a user navigates directly to `/admin` **When** the dashboard route loads **Then** a full-screen login/password prompt is displayed before any dashboard content, management controls, or restaurant data operations are shown. (FR27, NFR11)

3. **Given** the curator enters the correct password at the `/admin` login screen **When** authentication succeeds **Then** the password prompt is replaced by the curator dashboard shell (header + main content area), and the session is persisted in `sessionStorage` so a page refresh within the same tab does not require re-authentication.

4. **Given** a user enters an incorrect password at the `/admin` login screen **When** the login form is submitted **Then** access is denied, a clear error message is displayed ("Incorrect password. Please try again."), the password field is cleared, and the user can retry without limit. No PII is collected, logged, or stored. (NFR13)

5. **Given** the curator is authenticated and viewing `/admin` **When** the curator navigates away and returns to `/admin` in the same tab/session **Then** the session cookie/token in `sessionStorage` is recognised and the dashboard loads without re-prompting for the password.

6. **Given** the curator is authenticated and viewing `/admin` **When** the curator clicks a "Sign out" button **Then** the session is cleared from `sessionStorage`, the view returns to the login prompt, and no dashboard content is accessible until a correct password is entered again.

7. **Given** an unauthenticated user tries to access `/admin` by manipulating the URL or browser history **When** the `<ProtectedRoute>` wrapper checks auth state **Then** the user is redirected to (or kept at) the `/admin` login prompt, never seeing dashboard content.

8. **Given** the `.env` file contains `VITE_ADMIN_PASSWORD` **When** the login form is submitted **Then** the entered password is compared against `import.meta.env.VITE_ADMIN_PASSWORD` client-side. If the env var is missing or empty at build time, the `/admin` route renders an explicit config-error message rather than silently accepting all passwords.

9. **Given** the public map at `/` **When** viewed by any user **Then** there is no visible link, button, or navigation element pointing to `/admin` — the admin route is obscure by design.

## Tasks / Subtasks

- [x] **Task 1: Install React Router and configure root routes** (AC: 1, 2, 9)
  - [x] Run `npm install react-router-dom` — add as a production dependency
  - [x] In `src/main.tsx`, wrap `<App />` with `<BrowserRouter>` from `react-router-dom`
  - [x] In `src/App.tsx`, replace the direct `AppWithMap` render with a `<Routes>` block:
    - `<Route path="/" element={<AppWithMap apiKey={apiKey} />} />`
    - `<Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />`
    - `<Route path="*" element={<Navigate to="/" replace />} />` (404 fallback)
  - [x] Verify `vite.config.ts` already has `historyApiFallback` or that Nginx `try_files` handles SPA routing — note in Dev Notes if additional config is needed
  - [x] Confirm the `/` route renders identically to the pre-router version (no visual regression)

- [x] **Task 2: Add `VITE_ADMIN_PASSWORD` to environment config** (AC: 8)
  - [x] Add `VITE_ADMIN_PASSWORD=` line to `.env.example` (or create one if absent) with a placeholder comment: `# Set a strong password for the /admin curator dashboard`
  - [x] Add `VITE_ADMIN_PASSWORD` to `src/vite-env.d.ts` `ImportMetaEnv` interface as `readonly VITE_ADMIN_PASSWORD?: string`
  - [x] Document in Dev Notes that this key must never be committed to git — confirm `.gitignore` includes `.env`

- [x] **Task 3: Create `useAdminAuth` hook** (AC: 3, 4, 5, 6, 7)
  - [x] Create `src/hooks/useAdminAuth.ts`
  - [x] Hook reads/writes a `sessionStorage` key `'food-list-admin-auth'` (value: `'1'` when authenticated)
  - [x] Expose: `isAuthenticated: boolean`, `login(password: string): boolean`, `logout(): void`
  - [x] `login()`: compares `password` against `import.meta.env.VITE_ADMIN_PASSWORD`; returns `true` and sets sessionStorage on match; returns `false` on mismatch
  - [x] `logout()`: removes the sessionStorage key, sets `isAuthenticated` to `false`
  - [x] Initial state: reads sessionStorage on mount — if key present and env var defined, `isAuthenticated` starts as `true`
  - [x] If `VITE_ADMIN_PASSWORD` is undefined/empty string, `login()` always returns `false` (fail-safe, never grants access)
  - [x] Export hook from `src/hooks/index.ts`

- [x] **Task 4: Create `AdminLogin` component** (AC: 2, 4, 8)
  - [x] Create `src/components/AdminLogin.tsx`
  - [x] Full-screen layout: centered card on `#FFFBF5` background, consistent with app design system
  - [x] Card contains:
    - App logo/title ("Food List") in Playfair Display SC (`font-display text-2xl font-bold text-stone-900`)
    - Subtitle: "Curator Dashboard" in Karla (`font-sans text-sm text-stone-500`)
    - Password `<input type="password">` with `placeholder="Password"` — Karla, stone-900, bordered with `border-brand-border`, `rounded-lg`, `p-3`, full-width
    - Primary CTA submit button "Sign in" — amber-700 background, white text, Karla 700, `rounded-lg`, full-width, `py-2.5`
    - Error message area (conditionally rendered below button): `text-red-600 text-sm font-sans` — shown only after a failed attempt
  - [x] On form submit: call `login(password)` from `useAdminAuth`; on failure, show error and clear input
  - [x] On Enter key press in the password field, submit the form
  - [x] If `VITE_ADMIN_PASSWORD` env var is missing, render a configuration-error banner instead of the login form: "Admin password not configured. Set `VITE_ADMIN_PASSWORD` in your `.env` file."
  - [x] No username field — password only (single curator, no PII collected)

- [x] **Task 5: Create `ProtectedRoute` wrapper component** (AC: 7)
  - [x] Create `src/components/ProtectedRoute.tsx`
  - [x] Props: `children: React.ReactNode`
  - [x] Reads `isAuthenticated` from `useAdminAuth()`
  - [x] If authenticated: renders `{children}`
  - [x] If not authenticated: renders `<AdminLogin />` in place of children (no redirect — stay at `/admin`)
  - [x] Export from `src/components/index.ts`

- [x] **Task 6: Create `AdminDashboard` shell component** (AC: 3, 6)
  - [x] Create `src/components/AdminDashboard.tsx`
  - [x] Placeholder shell only — full content added in Stories 4.2–4.6
  - [x] Layout:
    - Fixed header bar (60px height, `bg-[#FFFBF5]`, `border-b border-[#E8E0D5]`, `shadow-sm`):
      - Left: "Food List — Curator Dashboard" in Playfair Display SC `text-xl font-bold text-stone-900`
      - Right: "Sign out" ghost button (`border border-[#E8E0D5] rounded-lg px-3 py-1.5 text-sm font-bold text-stone-500 hover:bg-stone-50 font-sans`)
    - Main content area below header (`pt-[60px]` offset, `min-h-screen bg-[#FFFBF5]`):
      - Centered empty state: "Curator Dashboard — Restaurant management coming in Stories 4.2–4.6" in Karla `text-sm text-stone-400`
  - [x] "Sign out" button calls `logout()` from `useAdminAuth()` — returns user to `AdminLogin`
  - [x] Export from `src/components/index.ts`

- [x] **Task 7: Update `src/types/restaurant.ts` with Growth Phase fields** (AC: 3 — prep for 4.2+)
  - [x] Add optional fields to the `Restaurant` interface that Stories 4.2–4.6 will populate:
    ```typescript
    tags?: string[];         // Occasion/vibe tags (e.g., ["date night", "patio"])
    featured?: boolean;      // Bobby's Pick badge
    enrichedAt?: string;     // ISO date — set by enrichment pipeline (Epic 5)
    ```
  - [x] These fields are fully optional and backward-compatible — existing `restaurants.json` records need no changes
  - [x] Do NOT add `priceLevel`, `rating`, or `photoUrl` — those belong to Epic 5 (Story 5.1)

- [x] **Task 8: Write unit tests** (AC: 1–8)
  - [x] Create `src/test/useAdminAuth.test.ts`:
    - "login() returns false when VITE_ADMIN_PASSWORD is undefined" — mock `import.meta.env`
    - "login() returns false when password does not match" — mock env var to `'testpass'`, call `login('wrong')`
    - "login() returns true and sets sessionStorage when password matches" — mock env var, verify sessionStorage key set
    - "logout() clears sessionStorage and sets isAuthenticated to false"
    - "initial state reads from sessionStorage — isAuthenticated true when key present and env var defined"
  - [x] Create `src/test/AdminLogin.test.tsx`:
    - "renders password input and sign-in button"
    - "shows config error banner when VITE_ADMIN_PASSWORD is undefined"
    - "shows error message after failed login attempt"
    - "clears password field after failed login"
    - "does not render error message on initial render"
  - [x] Create `src/test/ProtectedRoute.test.tsx`:
    - "renders children when isAuthenticated is true"
    - "renders AdminLogin when isAuthenticated is false"
  - [x] Update `src/test/App.test.tsx` to account for React Router wrapper (`<BrowserRouter>` in test renders)

## Dev Notes

### Architecture Overview

This story introduces React Router and the `/admin` protected route pattern. The public map at `/` is untouched functionally. The admin route uses a client-side password check against a Vite env var — this is intentional and explicitly called out as the NFR11 mechanism (no server required for growth phase auth).

**Security posture:** Client-side password comparison means a motivated attacker who inspects the JS bundle can find the hash. This is acceptable for a single-curator personal tool where the goal is preventing casual access, not enterprise-grade security. The password is never logged, stored in cookies, or sent over the network.

### React Router Integration

React Router v6+ is required. Install:
```bash
npm install react-router-dom
```

Add to `src/vite-env.d.ts`:
```typescript
interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_ADMIN_PASSWORD?: string;  // Add this
}
```

Wrap in `src/main.tsx`:
```tsx
import { BrowserRouter } from 'react-router-dom';
// ...
root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

### Route Structure in `App.tsx`

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';

// In App() — after API key validation guard:
return (
  <Routes>
    <Route path="/" element={<AppWithMap apiKey={apiKey} />} />
    <Route
      path="/admin"
      element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
```

### `useAdminAuth` Hook Spec

```typescript
// src/hooks/useAdminAuth.ts
const SESSION_KEY = 'food-list-admin-auth';

function useAdminAuth() {
  const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Fail-safe: if env var not configured, never auto-authenticate
    if (!envPassword) return false;
    return sessionStorage.getItem(SESSION_KEY) === '1';
  });

  function login(password: string): boolean {
    if (!envPassword || password !== envPassword) return false;
    sessionStorage.setItem(SESSION_KEY, '1');
    setIsAuthenticated(true);
    return true;
  }

  function logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
  }

  return { isAuthenticated, login, logout };
}
```

Key decisions:
- `sessionStorage` (not `localStorage`) — auth clears when browser tab is closed. Appropriate for a personal curator tool.
- Lazy `useState` initializer reads sessionStorage once on mount.
- `envPassword` undefined → `login()` always returns false, never grants access. This is the fail-safe.

### AdminLogin Component Layout

Design system tokens from `DESIGN.md` and `src/index.css @theme`:

```tsx
// Full-screen centered layout
<div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center p-4">
  <div className="w-full max-w-sm bg-white rounded-xl border border-[#E8E0D5] shadow-lg p-8">
    {/* Logo */}
    <h1 className="font-display text-2xl font-bold text-stone-900 text-center mb-1">
      Food List
    </h1>
    <p className="font-sans text-sm text-stone-500 text-center mb-6">
      Curator Dashboard
    </p>

    {/* Config error state */}
    {!envPassword && (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 mb-4">
        Admin password not configured. Set <code>VITE_ADMIN_PASSWORD</code> in your{' '}
        <code>.env</code> file.
      </div>
    )}

    {/* Login form — only shown when env var is set */}
    {envPassword && (
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-[#E8E0D5] rounded-lg p-3 font-sans text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-200 mb-3"
        />
        {error && (
          <p className="text-red-600 text-sm font-sans mb-3">{error}</p>
        )}
        <button
          type="submit"
          className="w-full bg-[#B45309] hover:bg-[#92400E] text-white font-sans text-sm font-bold rounded-lg py-2.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
        >
          Sign in
        </button>
      </form>
    )}
  </div>
</div>
```

### ProtectedRoute Component Spec

```tsx
// src/components/ProtectedRoute.tsx
import { useAdminAuth } from '../hooks';
import AdminLogin from './AdminLogin';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated ? <>{children}</> : <AdminLogin />;
}
```

Note: `useAdminAuth` must be stable across renders — each call returns the same `sessionStorage`-backed state. In tests, mock `sessionStorage` via `vi.stubGlobal` or setup `jsdom`'s `window.sessionStorage`.

### AdminDashboard Shell Spec

This is a scaffold only. Full management features land in Stories 4.2–4.6. The shell establishes the layout chrome that subsequent stories will populate.

```tsx
// src/components/AdminDashboard.tsx
import { useAdminAuth } from '../hooks';

export function AdminDashboard() {
  const { logout } = useAdminAuth();

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-[#FFFBF5] border-b border-[#E8E0D5] shadow-sm flex items-center justify-between px-5 z-50">
        <span className="font-display text-xl font-bold text-stone-900">
          Food List — Curator Dashboard
        </span>
        <button
          onClick={logout}
          className="border border-[#E8E0D5] rounded-lg px-3 py-1.5 font-sans text-sm font-bold text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
        >
          Sign out
        </button>
      </header>

      {/* Main content */}
      <main className="pt-[60px] flex items-center justify-center min-h-screen">
        <p className="font-sans text-sm text-stone-400">
          Curator Dashboard — Restaurant management coming in Stories 4.2–4.6
        </p>
      </main>
    </div>
  );
}
```

### TypeScript Strict Mode Checklist

- `login(password: string): boolean` — typed return value, no implicit `any`
- `children: React.ReactNode` on `ProtectedRoute` — not `JSX.Element` (more flexible)
- `sessionStorage.getItem()` returns `string | null` — handle null in comparisons
- `import.meta.env.VITE_ADMIN_PASSWORD` typed as `string | undefined` in `ImportMetaEnv` — always guard for undefined before use
- No `as string` casts without a preceding undefined-guard

### Vite Dev Server & SPA Routing

Vite's dev server handles SPA routing by default — navigating to `/admin` in dev works without config changes.

For production Nginx, the existing `try_files $uri $uri/ /index.html;` directive (established in Story 1.6) already handles `/admin` falling back to `index.html`. No additional Nginx config needed.

### Testing Patterns

Tests use Vitest + `@testing-library/react`. The `useAdminAuth` hook reads `import.meta.env` — mock it in tests:

```typescript
// In test file
vi.stubEnv('VITE_ADMIN_PASSWORD', 'testpassword');
// Restore after each test:
afterEach(() => vi.unstubAllEnvs());
```

For `sessionStorage` in jsdom (already available in test environment):
```typescript
beforeEach(() => sessionStorage.clear());
```

For testing `ProtectedRoute` and `AdminDashboard` with React Router, wrap renders:
```tsx
import { MemoryRouter } from 'react-router-dom';
render(<MemoryRouter initialEntries={['/admin']}><ProtectedRoute>...</ProtectedRoute></MemoryRouter>);
```

### Project Structure Notes

New files created by this story:
```
src/
  hooks/
    useAdminAuth.ts          ← New: admin session management hook
  components/
    AdminLogin.tsx           ← New: password gate UI
    ProtectedRoute.tsx       ← New: auth wrapper for /admin route
    AdminDashboard.tsx       ← New: curator dashboard shell (scaffold)
  test/
    useAdminAuth.test.ts     ← New: hook unit tests
    AdminLogin.test.tsx      ← New: component tests
    ProtectedRoute.test.tsx  ← New: wrapper tests
```

Modified files:
```
src/main.tsx                 ← Add BrowserRouter wrapper
src/App.tsx                  ← Add Routes/Route, import new components
src/hooks/index.ts           ← Export useAdminAuth
src/components/index.ts      ← Export AdminLogin, ProtectedRoute, AdminDashboard
src/types/restaurant.ts      ← Add optional growth-phase fields (tags, featured, enrichedAt)
src/vite-env.d.ts            ← Add VITE_ADMIN_PASSWORD to ImportMetaEnv
.env.example                 ← Add VITE_ADMIN_PASSWORD placeholder
```

Do NOT modify:
- `public/restaurants.json` — no data changes in this story
- Any existing component from Epics 1–3 (Map, RestaurantCard, PinLegend, FilterBar when built, etc.)
- `vite.config.ts` — no changes needed for SPA routing in dev

### Security Notes

- The admin password is embedded in the JS bundle at build time via Vite. Restrict access to the production `.env` file on the VPS. This is acceptable for a single-curator personal tool.
- Never log the password, store it in `localStorage`, transmit it in URLs, or include it in error messages.
- Session clears on tab close (sessionStorage lifetime). Curator re-authenticates per browser session.
- No rate limiting on the client-side — this is by design for a personal tool. If rate limiting is needed in the future, move to a server-side auth mechanism.
- The `/admin` URL is obscure but not secret — the security is the password, not URL obscurity.

### Accessibility

- Password input: `<input type="password">` with visible `<label>` or `aria-label="Password"`
- Submit button: standard `<button type="submit">` — keyboard accessible by default
- Error message: `role="alert"` on the error paragraph so screen readers announce it on appearance
- Sign out button: `aria-label="Sign out of curator dashboard"` if icon-only; text label is preferred

### References

- Epic 4, Story 4.1: `_bmad-output/planning-artifacts/epics.md` — "Curator Authentication & Dashboard Route" section
- Architecture Growth Path: `_bmad-output/docs/architecture.md` — "Phase 2: Curator Dashboard + API Enrichment"
- NFR10, NFR11, NFR13: `_bmad-output/planning-artifacts/epics.md` — Non-functional requirements
- FR27: `_bmad-output/planning-artifacts/epics.md` — "Curator can access the management interface via a password-protected route"
- Design system: `DESIGN.md` — App Header, CTA Button, Secondary/Ghost Buttons, Color Palette, Typography
- Existing App pattern: `src/App.tsx` — existing API key guard pattern to follow
- Type definitions: `src/types/restaurant.ts` — Restaurant interface to extend
- Env typing: `src/vite-env.d.ts` — ImportMetaEnv to extend

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- All 8 tasks completed. 61 tests pass (10 test files). Build clean with no type errors.
- `src/test/App.test.tsx` and `src/App.test.tsx` both updated with `<MemoryRouter>` wrappers.
- Vite dev server SPA routing works out of the box; Nginx `try_files` already configured in production (Story 1.6).
- `.env` is gitignored; `VITE_ADMIN_PASSWORD` must never be committed.

### File List

- src/hooks/useAdminAuth.ts (new)
- src/components/AdminLogin.tsx (new)
- src/components/ProtectedRoute.tsx (new)
- src/components/AdminDashboard.tsx (new)
- src/test/useAdminAuth.test.ts (new)
- src/test/AdminLogin.test.tsx (new)
- src/test/ProtectedRoute.test.tsx (new)
- src/main.tsx (modified — BrowserRouter)
- src/App.tsx (modified — Routes/Route/Navigate)
- src/hooks/index.ts (modified — export useAdminAuth)
- src/components/index.ts (modified — export new components)
- src/types/restaurant.ts (modified — tags/featured/enrichedAt)
- src/vite-env.d.ts (modified — VITE_ADMIN_PASSWORD)
- .env.example (modified — VITE_ADMIN_PASSWORD placeholder)
- src/test/App.test.tsx (modified — MemoryRouter wrapper)
- src/App.test.tsx (modified — MemoryRouter wrapper)
- src/contexts/AdminAuthContext.tsx (new — AdminAuthProvider + useAdminAuth context)
- src/test/AdminDashboard.test.tsx (new — 2 tests for dashboard render and sign-out)
