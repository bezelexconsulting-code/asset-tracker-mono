import { Outlet, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RequireTechnician() {
  const { user } = useAuth();
  const { org } = useParams();
  if (!user || user.role !== 'technician') {
    return <Navigate to={`/${org}/login`} replace />;
  }
  return <Outlet />;
}

