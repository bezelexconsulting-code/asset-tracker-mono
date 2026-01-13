import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { SUPABASE_CONFIGURED, supabase } from '../lib/supabase';
import { useOrganization } from '../contexts/OrganizationContext';
import { MapPinIcon, BuildingOfficeIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Locations() {
  const { org } = useParams();
  const { listLocations, listClients, addLocation } = useData();
  const { orgId } = useOrganization();
  const [locations, setLocations] = useState(listLocations());
  const [clients, setClients] = useState(listClients());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ name: string; address?: string; client_id?: string }>({ name: '', address: '', client_id: '' });

  useEffect(() => {
    (async () => {
      if (SUPABASE_CONFIGURED) {
        if (!orgId) { setLocations([] as any); setClients([] as any); return; }
        const { data, error } = await supabase.rpc('get_locations_by_slug', { p_slug: org });
        if (error) { setLocations([] as any); } else { setLocations((data||[]) as any); }
        setClients([]);
      } else {
        setLocations(listLocations());
        setClients(listClients());
      }
    })();
  }, [listLocations, listClients, orgId, org]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white">
          <PlusIcon className="h-4 w-4 mr-2" /> Add Location
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-700">Name</label>
              <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Address</label>
              <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            {!SUPABASE_CONFIGURED && (
              <div>
                <label className="text-sm text-gray-700">Client</label>
                <select className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                  <option value="">Unassigned</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={async () => {
                if (!form.name) return;
                if (SUPABASE_CONFIGURED) {
                  const { data, error } = await supabase.rpc('add_location_by_slug', { p_slug: org, p_name: form.name, p_address: form.address || '' });
                  if (error) return;
                  const { data: refreshed } = await supabase.rpc('get_locations_by_slug', { p_slug: org });
                  setLocations((refreshed||[]) as any);
                } else {
                  const created = addLocation({ name: form.name, address: form.address, client_id: form.client_id || undefined });
                  setLocations([created, ...locations]);
                }
                setShowForm(false);
                setForm({ name: '', address: '', client_id: '' });
              }}
              className="px-3 py-2 rounded bg-blue-600 text-white"
            >Save</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-2 rounded bg-gray-100 text-gray-700">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {locations.map((l) => (
              <tr key={l.id}>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center"><MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />{l.name}</div>
                </td>
                <td className="px-6 py-4 text-sm">
                  {!SUPABASE_CONFIGURED && (
                    <div className="flex items-center"><BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-2" />{clients.find((c) => c.id === l.client_id)?.name || 'Unassigned'}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">{l.address || '—'}</td>
              </tr>
            ))}
            {locations.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No locations</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
