import { Outlet, useParams } from 'react-router-dom';
import { SettingsProvider, useSettings } from '../contexts/SettingsContext';
import { AuthProvider } from '../contexts/AuthContext';
import { DataProvider } from '../contexts/DataContext';

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
  return (
    <SettingsProvider>
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
    </SettingsProvider>
  );
}
