import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Role } from '../../types';

interface RequireRoleProps {
  allowedRoles: Role | Role[];
  children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ allowedRoles, children }) => {
  const { session, isAuthenticated, switchRole } = useAuth();
  const location = useLocation();

  // 1. Strictly restrict dashboard access if not logged in
  if (!isAuthenticated || !session) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  const allowedList: Role[] = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  // 2. In demo mode: Any authenticated user has access to all dashboards
  // Automatically synchronize active role context to match current dashboard
  useEffect(() => {
    if (session && allowedList.length > 0 && !allowedList.includes(session.role)) {
      switchRole(allowedList[0]);
    }
  }, [session, allowedList, switchRole]);

  return <>{children}</>;
};
