import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSuperAdmin } from '../contexts/SuperAdminContext';
import Toast from '../components/Toast';

export default function SuperLayout() {
  const nav = [
    { to: '/super/dashboard', label: 'Dashboard' },
    { to: '/super/orgs', label: 'Organizations' },
    { to: '/super/requests', label: 'Requests' },
    { to: '/super/billing', label: 'Billing' },
    { to: '/super/tickets', label: 'Tickets' },
    { to: '/super/flags', label: 'Flags' },
  ];
  const isLogin = useLocation().pathname.toLowerCase().includes('/super/login');
  const { notify, clearNotify } = useSuperAdmin() as any;
  return (
    <div className="min-h-screen bg-gray-50">
      {isLogin ? (
        <main className="max-w-md mx-auto px-4 py-10">
          <Outlet />
        </main>
      ) : (
        <>
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded overflow-hidden flex items-center justify-center">
                  <img src="/branding/bez-asset-logo.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div className="font-semibold">BezAssetTracker — Super Admin</div>
              </div>
            </div>
          </header>
          <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
            <aside className="col-span-12 lg:col-span-3">
              <nav className="bg-white border border-gray-200 rounded p-2">
                {nav.map((item) => (
                  <NavLink key={item.to} to={item.to} className={({ isActive }) => `block px-3 py-2 rounded text-sm ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>{item.label}</NavLink>
                ))}
              </nav>
            </aside>
            <main className="col-span-12 lg:col-span-9">
              <Outlet />
            </main>
          </div>
          {notify && (<Toast message={notify} onClose={clearNotify} />)}
        </>
      )}
    </div>
  );
}
