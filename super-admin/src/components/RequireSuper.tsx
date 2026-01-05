import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RequireSuper() {
  const { user } = useAuth();
  if (!user || user.role !== 'superadmin') {
    return <Navigate to="/super/login" replace />;
  }
  return <Outlet />;
}
