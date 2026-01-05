import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserCircleIcon, 
  HomeIcon, 
  CubeIcon, 
  ArrowPathIcon, 
  CpuChipIcon, 
  Cog6ToothIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

export default function ClientLayout() {
  const { org } = useParams();
  const { user } = useAuth();
  const base = `/${org}`;

  const clientNav = [
    { to: `${base}/dashboard`, label: 'Dashboard', icon: HomeIcon },
    { to: `${base}/assets`, label: 'My Assets', icon: CubeIcon },
    { to: `${base}/check`, label: 'Check-in/Out', icon: ArrowPathIcon },
    { to: `${base}/nfc`, label: 'NFC Tools', icon: CpuChipIcon },
    { to: `${base}/profile`, label: 'My Profile', icon: UserCircleIcon },
  ];

  const adminNav = [
    { to: `${base}/admin/clients`, label: 'Client Management', icon: BuildingOfficeIcon },
    { to: `${base}/admin/technicians`, label: 'Technician Management', icon: WrenchScrewdriverIcon },
    { to: `${base}/admin/technician-activity`, label: 'Activity Tracking', icon: ClipboardDocumentListIcon },
    { to: `${base}/admin/assets`, label: 'All Assets', icon: CubeIcon },
    { to: `${base}/admin/check`, label: 'Admin Check-in/Out', icon: ArrowPathIcon },
    { to: `${base}/admin/users`, label: 'Users & Roles', icon: UsersIcon },
    { to: `${base}/admin/reports`, label: 'Reports', icon: Cog6ToothIcon },
    { to: `${base}/admin/audit`, label: 'Audit Log', icon: Cog6ToothIcon },
    { to: `${base}/admin/settings`, label: 'Settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-semibold text-gray-900">Asset Tracker</div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <span className="text-sm text-gray-500">Org: {org}</span>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-3">
          <div className="bg-white border border-gray-200 rounded-md">
            {/* Client Menu */}
            <div className="p-2">
              <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Client Tools
              </h3>
              <nav className="space-y-1">
                {clientNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-md text-sm ${
                        isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Admin Menu (if user has admin role) */}
            <div className="p-2 border-t border-gray-200">
              <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin Tools
              </h3>
              <nav className="space-y-1">
                {adminNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-md text-sm ${
                        isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </aside>
        <main className="col-span-12 lg:col-span-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}