import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  allowedRoles?: ('builder' | 'customer')[];
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requireAuth = true,
  allowedRoles = ['builder', 'customer'],
  redirectTo = '/login'
}: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <img src="/lovable-uploads/f96a4cb4-93ac-4358-83c6-a6ccdd7526dd.png" alt="Titan Buildings" className="h-12 w-auto mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If specific roles are required, check user role
  if (requireAuth && user && allowedRoles.length > 0) {
    const userRole = profile?.role || 'customer';
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};