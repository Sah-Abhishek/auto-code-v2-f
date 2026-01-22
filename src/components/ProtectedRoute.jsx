import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, ROLES } from '../store/authStore';
import { Loader2, ShieldX } from 'lucide-react';

/**
 * ProtectedRoute - Wraps routes requiring authentication and/or specific roles
 */
const ProtectedRoute = ({
  children,
  roles = null,
  redirectTo = '/login'
}) => {
  const { user, initialized, initialize } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  // Show loading while initializing
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    if (!roleArray.includes(user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <ShieldX className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Access Denied</h1>
            <p className="text-slate-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Your role: <span className="font-medium text-slate-700">{user?.role}</span>
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
};

/**
 * AdminRoute - Admin only
 */
export const AdminRoute = ({ children }) => (
  <ProtectedRoute roles={[ROLES.ADMIN]}>
    {children}
  </ProtectedRoute>
);

/**
 * CoderRoute - Coder and Admin
 */
export const CoderRoute = ({ children }) => (
  <ProtectedRoute roles={[ROLES.ADMIN, ROLES.CODER]}>
    {children}
  </ProtectedRoute>
);

/**
 * QARoute - QA and Admin
 */
export const QARoute = ({ children }) => (
  <ProtectedRoute roles={[ROLES.ADMIN, ROLES.QA]}>
    {children}
  </ProtectedRoute>
);

/**
 * CoderOrQARoute - Coder, QA, and Admin
 */
export const CoderOrQARoute = ({ children }) => (
  <ProtectedRoute roles={[ROLES.ADMIN, ROLES.CODER, ROLES.QA]}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
