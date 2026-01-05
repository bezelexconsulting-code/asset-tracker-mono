import { Routes, Route, Link, Navigate } from 'react-router-dom';
import NFCManagement from './pages/NFCManagement';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import AssetsList from './pages/AssetsList';
import AssetDetails from './pages/AssetDetails';
import Clients from './pages/Clients';
import Technicians from './pages/Technicians';
import TechnicianDetails from './pages/TechnicianDetails';
import Locations from './pages/Locations';
import TechDownload from './pages/TechDownload';
import TechApp from './pages/TechApp';
import MobileApp from './pages/MobileApp';
import TechLayout from './layouts/TechLayout';
import CheckInOut from './pages/CheckInOut';
import UsersRoles from './pages/UsersRoles';
import Reports from './pages/Reports';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import Login from './pages/Login';
import RequireAdmin from './components/RequireAdmin';
// Super admin is a separate app; no imports in production build
import EmailPreview from './pages/EmailPreview';
import Account from './pages/Account';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/:org" element={<AppLayout />}>
          
          <Route path="login" element={<Login />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route element={<RequireAdmin />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="assets" element={<AssetsList />} />
            <Route path="assets/:id" element={<AssetDetails />} />
            <Route path="clients" element={<Clients />} />
            <Route path="locations" element={<Locations />} />
            <Route path="technicians" element={<Technicians />} />
            <Route path="technicians/:id" element={<TechnicianDetails />} />
            <Route path="emails" element={<EmailPreview />} />
            <Route path="check" element={<CheckInOut />} />
            <Route path="nfc" element={<NFCManagement />} />
            <Route path="users" element={<UsersRoles />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="settings" element={<Settings />} />
            <Route path="account" element={<Account />} />
          </Route>
        </Route>
        <Route path="/:org/tech" element={<TechLayout />}>
          <Route index element={<TechDownload />} />
          <Route path="app" element={<TechApp />} />
          <Route path="mobile" element={<MobileApp />} />
        </Route>
        {/* Super admin routes removed in production; managed by separate app */}
        <Route
          path="*"
          element={
            <div className="max-w-3xl mx-auto p-8">
              <h1 className="text-2xl font-bold">Asset Tracker</h1>
              <p className="mt-2 text-gray-600">Choose an organization route.</p>
              <div className="mt-6 space-x-3">
                <Link to="/demo-org/dashboard" className="px-4 py-2 rounded-md bg-blue-600 text-white">Open Dashboard</Link>
                <Link to="/demo-org/nfc" className="px-4 py-2 rounded-md bg-slate-700 text-white">Open NFC</Link>
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
}
