import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SUPABASE_CONFIGURED, supabase } from '../lib/supabase';
import { useData } from '../contexts/DataContext';
import AssetImageUploader from '../components/AssetImageUploader';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

export default function AssetDetails() {
  const { org, id } = useParams();
  const [asset, setAsset] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{ name: string; asset_tag: string; client_id: string; location: string; description?: string }>({ name: '', asset_tag: '', client_id: '', location: '', description: '' });
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const { listClients, listAssets, updateAsset, listLocations } = useData();

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (SUPABASE_CONFIGURED) {
        const { data } = await supabase.from('assets_unified').select('*').eq('id', id).limit(1);
        const found = data?.[0];
        if (found) {
          setAsset(found);
          setForm({ name: found.name || '', asset_tag: found.asset_tag || '', client_id: '', location: found.location_id || '', description: found.description || '' });
        }
      } else {
        const cls = listClients();
        setClients(cls);
        const as = listAssets();
        const found = as.find((a) => a.id === id);
        if (found) {
          setAsset(found);
          setForm({ name: found.name || '', asset_tag: found.asset_tag || '', client_id: found.client_id || '', location: found.location_id || '', description: found.description || '' });
        }
      }
      setLoading(false);
    })();
  }, [listClients, listAssets, id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Asset Details</h1>
        <Link to={`/${org}/assets`} className="text-sm text-blue-600">Back to Assets</Link>
      </div>
      {/* Demo banner removed in production */}
      {asset && (
        <div className="flex items-center justify-between">
          <AssetImageUploader
            orgId={String(org)}
            assetId={String(asset.id)}
            initialUrl={asset.image_url}
            onUploaded={(url) => setAsset({ ...asset, image_url: url })}
          />
          <button onClick={() => setEditing((e) => !e)} className="inline-flex items-center px-3 py-2 rounded-md bg-gray-900 text-white">
            <PencilSquareIcon className="h-4 w-4 mr-2" /> {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      )}
      {loading && <div className="text-sm text-gray-500">Loading...</div>}
      {asset && !editing && (
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Asset Tag</div>
              <div className="mt-1 font-mono">{asset.asset_tag}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Name</div>
              <div className="mt-1">{asset.name}</div>
            </div>
            {!SUPABASE_CONFIGURED && (
              <div>
                <div className="text-sm text-gray-500">Client</div>
                <div className="mt-1">{clients.find(c => c.id === asset.client_id)?.name || 'Unassigned'}</div>
              </div>
            )}
            {/* Location name (local only) */}
            {!SUPABASE_CONFIGURED && (
              <div>
                <div className="text-sm text-gray-500">Location</div>
                <div className="mt-1">{listLocations(asset.client_id).find((l) => l.id === asset.location_id)?.name || '—'}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  asset.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>{asset.status}</span>
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-sm text-gray-500">Description</div>
              <div className="mt-1 text-gray-700 text-sm">{asset.description || '—'}</div>
            </div>
          </div>
        </div>
      )}
      {asset && editing && (
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
          {error && <div className="p-3 border border-red-200 bg-red-50 rounded text-sm text-red-800">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-700">Asset Tag</label>
              <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={form.asset_tag} onChange={(e) => setForm({ ...form, asset_tag: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Name</label>
              <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
            {!SUPABASE_CONFIGURED && (
              <div>
                <label className="text-sm text-gray-700">Location</label>
                <select className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                  <option value="">Unassigned</option>
                  {listLocations(form.client_id || undefined).map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="text-sm text-gray-700">Description</label>
              <textarea className="mt-1 w-full border border-gray-300 rounded px-3 py-2" rows={3} value={form.description || ''} onChange={(e)=> setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={async () => {
                setError(null);
                if (SUPABASE_CONFIGURED) {
                  const { error } = await supabase.from('assets_v2').update({ name: form.name, asset_tag: form.asset_tag, description: form.description || '' }).eq('id', id);
                  if (error) { setError(String(error.message)); return; }
                  setAsset({ ...asset, name: form.name, asset_tag: form.asset_tag, description: form.description || '' });
                } else {
                  updateAsset(String(id), { name: form.name, asset_tag: form.asset_tag, client_id: form.client_id || undefined, location_id: form.location || undefined, description: form.description || '' });
                  setAsset({ ...asset, name: form.name, asset_tag: form.asset_tag, client_id: form.client_id || undefined, location_id: form.location || undefined, description: form.description || '' });
                }
                setEditing(false);
              }}
              className="px-3 py-2 rounded bg-blue-600 text-white"
            >Save</button>
            <button onClick={() => setEditing(false)} className="px-3 py-2 rounded bg-gray-100 text-gray-700">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
