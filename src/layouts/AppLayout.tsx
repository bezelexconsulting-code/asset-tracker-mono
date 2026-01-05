import React from 'react';
import { NavLink, Outlet, useParams, useLocation } from 'react-router-dom';
import { DataProvider } from '../contexts/DataContext';
import { SettingsProvider, useSettings } from '../contexts/SettingsContext';
import { SUPABASE_CONFIGURED, supabase } from '../lib/supabase';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

export default function AppLayout() {
  const { org } = useParams();
  const base = `/${org}`;
  const nav = [
    { to: `${base}/dashboard`, label: 'Dashboard' },
    { to: `${base}/assets`, label: 'Assets' },
    { to: `${base}/clients`, label: 'Clients' },
    { to: `${base}/locations`, label: 'Locations' },
    { to: `${base}/technicians`, label: 'Technicians' },
    { to: `${base}/check`, label: 'Check-in/Out' },
    { to: `${base}/nfc`, label: 'NFC' },
    { to: `${base}/users`, label: 'Users & Roles' },
    { to: `${base}/reports`, label: 'Reports' },
    { to: `${base}/audit`, label: 'Audit Log' },
    { to: `${base}/settings`, label: 'Settings' },
  ];
  function SidebarNav({ nav }: { nav: Array<{ to: string; label: string }> }) {
    const { user } = useAuth();
    if (!user || user.role !== 'admin') {
      return (
        <div className="bg-white border border-gray-200 rounded-md p-4 text-sm text-gray-600">
          Please sign in to view your organization dashboard.
        </div>
      );
    }
    return (
      <nav className="bg-white border border-gray-200 rounded-md p-2">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm ${
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    );
  }
  function BrandHeader({ org }: { org?: string }) {
    const { user, logout, login } = useAuth() as any;
    const { settings } = useSettings();
    const location = useLocation();
    const parts = location.pathname.replace(/^\/+/, '').split('/');
    const isTechRoute = parts[1] === 'tech';
    const isLoginRoute = parts[1] === 'login';
    const [branding, setBranding] = React.useState<{ logo_url?: string; primary_color?: string; org_name?: string }>({});

    React.useEffect(() => {
      (async () => {
        if (!SUPABASE_CONFIGURED || !org) return;
        const { data } = await supabase.from('organizations').select('*').eq('slug', org).limit(1);
        const o = data?.[0];
        if (o) setBranding({ logo_url: o.branding_logo_url || '', primary_color: o.branding_primary_color || '', org_name: o.name || '' });
      })();
    }, [org]);
    React.useEffect(()=>{}, []);
    if (isLoginRoute) return null;
    return (
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded overflow-hidden flex items-center justify-center">
              {(branding.logo_url || settings.branding.logo_url) ? (
                <img src={branding.logo_url || settings.branding.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-gray-400">Logo</span>
              )}
            </div>
            <div className="font-semibold" style={{ color: (branding.primary_color || settings.branding.primary_color || '#111827') }}>
              {branding.org_name || settings.orgProfile.name || 'Organization'}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">{org}</div>
            {isTechRoute ? (
              <span className="text-xs text-gray-500">Technician</span>
            ) : user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">{user.name || user.email}</span>
                <button onClick={logout} className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">Logout</button>
              </div>
            ) : (
              <NavLink to={`/${org}/login`} className="text-sm text-blue-600">Sign in</NavLink>
            )}
          </div>
        </div>
      </header>
    );
  }

  const path = useLocation().pathname.toLowerCase();
  const isLoginRoute = /\/[^\/]+\/login\/?$/.test(path);
  const isTechRoute = /\/[^\/]+\/tech(\/|$)/.test(path);
  return (
    <SettingsProvider org={org || 'demo-org'}>
      <AuthProvider org={org || 'demo-org'}>
        <DataProvider org={org || 'demo-org'}>
          <div className="min-h-screen bg-gray-50">
            {!isLoginRoute && <BrandHeader org={org} />}
            {isLoginRoute ? (
              <main className="max-w-md mx-auto px-4 py-10">
                <Outlet />
              </main>
            ) : (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6">
                {isTechRoute ? null : (
                  <aside className="col-span-12 lg:col-span-3">
                    <SidebarNav nav={nav} />
                  </aside>
                )}
                <main className="col-span-12 lg:col-span-9">
                  <Outlet />
                </main>
              </div>
            )}
          </div>
        </DataProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
