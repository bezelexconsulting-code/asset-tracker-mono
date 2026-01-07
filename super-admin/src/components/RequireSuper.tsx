import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RequireSuper() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  if (!user || user.role !== 'superadmin') {
    return <Navigate to="/super/login" replace />;
  }
  return <Outlet />;
}
