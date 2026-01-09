import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { org } = useParams();

  if (!user) {
    return <Navigate to={`/${org}/login`} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
