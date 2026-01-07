import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useParams } from 'react-router-dom';

export default function Settings() {
  const { org } = useParams();
  const { settings, setOrgProfile, setBranding, setAssetsConfig, setNfcConfig, setCheckWorkflow, setNotifications, exportJSON, importJSON } = useSettings();
  const [json, setJson] = useState('');
  const [health, setHealth] = useState<{ supabase: boolean; org_slug?: string; org_id?: string | null } | null>(null);
  React.useEffect(()=> {
    (async ()=>{
      const ok = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
      let orgId: string | null = null;
      try {
        const { data } = await (await import('../lib/supabase')).supabase.from('organizations').select('id').eq('slug', org).limit(1);
        orgId = data?.[0]?.id || null;
      } catch {}
      setHealth({ supabase: ok, org_slug: org, org_id: orgId });
    })();
  }, [org]);

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 rounded p-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Organization: {org}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded p-6 space-y-2">
        <h2 className="text-lg font-semibold">Connection Health</h2>
        <div className="text-sm text-gray-700">Supabase: {health?.supabase ? 'connected' : 'not configured'}</div>
        <div className="text-sm text-gray-700">Org slug: {health?.org_slug}</div>
        <div className="text-sm text-gray-700">Org UUID: {health?.org_id || 'not found'}</div>
        {health?.supabase && !health?.org_id && (
          <button className="mt-2 px-3 py-2 rounded bg-blue-600 text-white" onClick={async()=> {
            const { ensureOrgExists } = await import('../lib/org');
            const id = await ensureOrgExists(org, { name: settings.orgProfile.name || org, contact_email: settings.orgProfile.contact_email || '' });
            setHealth((h)=> ({ ...h!, org_id: id }));
          }}>Create Organization</button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded p-6 space-y-4">
        <h2 className="text-lg font-semibold">Organization Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-700">Name</label>
            <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={settings.orgProfile.name || ''} onChange={(e) => setOrgProfile({ name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Email</label>
            <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={settings.orgProfile.contact_email || ''} onChange={(e) => setOrgProfile({ contact_email: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Phone</label>
            <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={settings.orgProfile.contact_phone || ''} onChange={(e) => setOrgProfile({ contact_phone: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6 space-y-4">
        <h2 className="text-lg font-semibold">Branding</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-sm text-gray-700">Primary Color</label>
            <input type="color" className="mt-1 w-16 h-10" value={settings.branding.primary_color || '#0ea5e9'} onChange={(e) => setBranding({ primary_color: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Logo</label>
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-gray-100 border border-gray-200 rounded overflow-hidden flex items-center justify-center">
                {settings.branding.logo_url ? <img src={settings.branding.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400">No Logo</span>}
              </div>
              <input type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => setBranding({ logo_url: String(reader.result) });
                reader.readAsDataURL(f);
              }} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6 space-y-4">
        <h2 className="text-lg font-semibold">Assets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-700">Default Status</label>
            <select className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={settings.assets.default_status || 'available'} onChange={(e) => setAssetsConfig({ default_status: e.target.value as any })}>
              <option value="available">available</option>
              <option value="checked_out">checked_out</option>
              <option value="maintenance">maintenance</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-700">Require Image</label>
            <input type="checkbox" className="mt-2" checked={!!settings.assets.require_image} onChange={(e) => setAssetsConfig({ require_image: e.target.checked })} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Tag Prefix</label>
            <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={settings.assets.tag_prefix || ''} onChange={(e) => setAssetsConfig({ tag_prefix: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6 space-y-4">
        <h2 className="text-lg font-semibold">NFC</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-700">Payload Format</label>
            <select className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={settings.nfc.payload_format || 'json'} onChange={(e) => setNfcConfig({ payload_format: e.target.value as any })}>
              <option value="json">json</option>
              <option value="text">text</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-700">Tag Prefix</label>
            <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={settings.nfc.tag_prefix || ''} onChange={(e) => setNfcConfig({ tag_prefix: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6 space-y-4">
        <h2 className="text-lg font-semibold">Check-in / Check-out</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-700">Default Due Days</label>
            <input type="number" className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={settings.check.default_due_days || 7} onChange={(e) => setCheckWorkflow({ default_due_days: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Require Client</label>
            <input type="checkbox" className="mt-2" checked={!!settings.check.require_client} onChange={(e) => setCheckWorkflow({ require_client: e.target.checked })} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Allow Manual Entry</label>
            <input type="checkbox" className="mt-2" checked={!!settings.check.allow_manual_entry} onChange={(e) => setCheckWorkflow({ allow_manual_entry: e.target.checked })} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6 space-y-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-700">Email Enabled</label>
            <input type="checkbox" className="mt-2" checked={!!settings.notifications.email_enabled} onChange={(e) => setNotifications({ email_enabled: e.target.checked })} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Push Enabled</label>
            <input type="checkbox" className="mt-2" checked={!!settings.notifications.push_enabled} onChange={(e) => setNotifications({ push_enabled: e.target.checked })} />
          </div>
        </div>
      </div>

      
    </div>
  );
}
