import { Outlet, useParams } from 'react-router-dom';
import { SettingsProvider, useSettings } from '../contexts/SettingsContext';
import { AuthProvider } from '../contexts/AuthContext';
import { DataProvider } from '../contexts/DataContext';
import { OrganizationProvider } from '../contexts/OrganizationContext';
import { useEffect, useState } from 'react';
import { resolveOrgId } from '../lib/org';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';

function Header() {
  const { org } = useParams();
  const { settings } = useSettings();
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-100 border border-gray-200 rounded overflow-hidden flex items-center justify-center">
            {settings.branding.logo_url ? (
              <img src={settings.branding.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-gray-400">Logo</span>
            )}
          </div>
          <div className="font-semibold" style={{ color: settings.branding.primary_color || '#111827' }}>{settings.orgProfile.name || org}</div>
        </div>
        <div className="text-xs text-gray-500">Technician</div>
      </div>
    </header>
  );
}

export default function TechLayout() {
  const { org } = useParams();
  const [attached, setAttached] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const oid = await resolveOrgId(org || '');
        if (!oid || attached) return;
        const origFetch = window.fetch.bind(window);
        window.fetch = (input: any, init: any = {}) => {
          try {
            const url = typeof input === 'string' ? input : (input?.url || '');
            if (url.startsWith(`${supabaseUrl}/rest`)) {
              if (init.headers instanceof Headers) {
                init.headers.set('app-org-id', oid);
              } else {
                init.headers = { ...(init.headers as any), 'app-org-id': oid };
              }
            }
          } catch {}
          return origFetch(input, init);
        };
        setAttached(true);
      } catch {}
    })();
  }, [org, attached]);
  return (
    <SettingsProvider>
      <OrganizationProvider>
        <AuthProvider org={org || ''}>
          <DataProvider org={org || ''}>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <main className="max-w-md mx-auto px-4 py-6">
                <Outlet />
              </main>
            </div>
          </DataProvider>
        </AuthProvider>
      </OrganizationProvider>
    </SettingsProvider>
  );
}
