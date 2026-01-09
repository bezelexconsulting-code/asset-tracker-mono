import { Routes, Route, Navigate } from 'react-router-dom';
import SuperLayout from './layouts/SuperLayout';
import SuperLogin from './pages/SuperLogin';
import RequireSuper from './components/RequireSuper';
import SuperDashboard from './pages/SuperDashboard';
import SuperOrgs from './pages/SuperOrgs';
import SuperRequests from './pages/SuperRequests';
import SuperBilling from './pages/SuperBilling';
import SuperTechs from './pages/SuperTechs';
import SuperBranding from './pages/SuperBranding';

export default function App() {
  return (
    <Routes>
      <Route path="/super" element={<SuperLayout />}>
        <Route path="login" element={<SuperLogin />} />
        <Route element={<RequireSuper />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SuperDashboard />} />
          <Route path="orgs" element={<SuperOrgs />} />
          <Route path="requests" element={<SuperRequests />} />
          <Route path="billing" element={<SuperBilling />} />
          <Route path="techs" element={<SuperTechs />} />
          <Route path="branding" element={<SuperBranding />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/super/dashboard" replace />} />
    </Routes>
  );
}
