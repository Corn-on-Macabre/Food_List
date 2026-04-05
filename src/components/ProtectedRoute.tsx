import { useAdminAuth } from '../hooks';
import { AdminLogin } from './AdminLogin';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated ? <>{children}</> : <AdminLogin />;
}
