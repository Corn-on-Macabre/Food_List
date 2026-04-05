// Re-export from context — single source of truth for admin auth state.
// Components must be wrapped in <AdminAuthProvider> (see src/contexts/AdminAuthContext.tsx).
export { useAdminAuth } from '../contexts/AdminAuthContext';
