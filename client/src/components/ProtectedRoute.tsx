import { type ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('client' | 'freelancer')[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/',
}: ProtectedRouteProps) {
  const { user, isInitialized, setAuthModal } = useAuthStore();
  const location = useLocation();

  const isRoleRestricted = Boolean(user && allowedRoles && !allowedRoles.includes(user.role));

  useEffect(() => {
    if (isInitialized && !user) {
      setAuthModal(true, 'login');
      toast.info('Please sign in to access this page', { id: 'auth-required' });
    } else if (isRoleRestricted) {
      toast.error(`Access restricted: This area is only available to ${allowedRoles?.join(' or ')}s.`, {
        id: 'access-restricted',
      });
    }
  }, [isInitialized, user, isRoleRestricted, allowedRoles, setAuthModal]);

  // If still checking authentication on initial load, show skeleton
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-paper py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-[28px]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Role restriction check
  if (isRoleRestricted) {
    const fallbackPath = user.role === 'client' ? '/dashboard' : '/gigs';
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
