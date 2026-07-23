import { useAdminAuth } from '../hooks';
import { AdminLogin } from './AdminLogin';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, userEmail, isAdmin, logout } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <p className="text-brand-text-muted font-sans text-sm">Loading...</p>
      </div>
    );
  }

  // Signed in with Google but not an admin
  if (userEmail && !isAdmin) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-brand-surface rounded-xl border border-brand-border shadow-lg p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-brand-text mb-2">Access Denied</h1>
          <p className="font-sans text-sm text-brand-text-muted mb-4">
            {userEmail} doesn&apos;t have admin access.
          </p>
          <button
            type="button"
            onClick={logout}
            className="w-full bg-brand-cta hover:bg-brand-cta-hover text-brand-on-accent font-sans text-sm font-bold rounded-lg py-2.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-focus"
          >
            Sign out and try another account
          </button>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <AdminLogin />;
}
