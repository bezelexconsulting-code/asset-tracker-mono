import { Outlet, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RequireAdmin() {
  const { user } = useAuth();
  const { org } = useParams();
  if (!user || user.role !== 'admin') {
    return <Navigate to={`/${org}/login`} replace />;
  }
  return <Outlet />;
}
