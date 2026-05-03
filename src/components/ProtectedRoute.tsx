import { useAdminAuth } from '../hooks';
import { AdminLogin } from './AdminLogin';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, userEmail, isAdmin, logout } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center p-4">
        <p className="text-stone-500 font-sans text-sm">Loading...</p>
      </div>
    );
  }

  // Signed in with Google but not an admin
  if (userEmail && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-xl border border-[#E8E0D5] shadow-lg p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-stone-900 mb-2">Access Denied</h1>
          <p className="font-sans text-sm text-stone-500 mb-4">
            {userEmail} doesn&apos;t have admin access.
          </p>
          <button
            type="button"
            onClick={logout}
            className="w-full bg-[#B45309] hover:bg-[#92400E] text-white font-sans text-sm font-bold rounded-lg py-2.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
          >
            Sign out and try another account
          </button>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <AdminLogin />;
}
