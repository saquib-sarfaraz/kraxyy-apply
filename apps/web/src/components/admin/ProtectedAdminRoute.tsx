import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const PRIMARY_ADMIN_EMAIL = 'saquibsarfaraz47@gmail.com';

export const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const email = (user.email || '').toLowerCase().trim();
  const isAuthorized =
    email === PRIMARY_ADMIN_EMAIL.toLowerCase() &&
    (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || Boolean((user as any).isAdminAuthorized));

  if (!isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
