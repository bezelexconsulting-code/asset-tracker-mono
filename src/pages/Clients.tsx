import { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { BuildingOfficeIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  logo_url?: string;
}

export default function Clients() {
  const { listClients, addClient, updateClient, addLocation, listLocations } = useData() as any;
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ id: '', name: '', email: '', phone: '', address: '', contact_person: '', logo_url: '', site_name: '', site_address: '' });
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [siteForm, setSiteForm] = useState<{ name: string; address: string }>({ name: '', address: '' });

  useEffect(() => {
    setLoading(true);
    setClients(listClients());
    setLoading(false);
  }, [listClients]);

  const submit = async () => {
    setError(null);
    if (!form.name) {
      setError('Client name is required');
      return;
    }
    const created = addClient({
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      contact_person: form.contact_person,
      logo_url: form.logo_url,
    });
    if (form.site_name) {
      addLocation({ client_id: created.id, name: form.site_name, address: form.site_address });
    }
    setClients([created, ...clients]);
    setShowForm(false);
    setForm({ id: '', name: '', email: '', phone: '', address: '', contact_person: '', logo_url: '', site_name: '', site_address: '' });
    setEditId(created.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <div>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white mr-2">
            <PlusIcon className="h-4 w-4 mr-2" /> Add Client
          </button>
          <button onClick={()=>{ try { const loader = (window as any).bezDemoLoader; if (typeof loader === 'function') loader(); setClients(listClients()); } catch {} }} className="inline-flex items-center px-3 py-2 rounded-md bg-gray-900 text-white">Load Demo Data</button>
        </div>
      </div>

      
      {error && <div className="p-3 border border-red-200 bg-red-50 rounded text-sm text-red-800">{error}</div>}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-700">Name</label>
              <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Email</label>
              <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Phone</label>
              <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Address</label>
              <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Contact Person</label>
              <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Logo</label>
              <input type="file" accept="image/*" className="mt-1 w-full" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => setForm({ ...form, logo_url: String(reader.result) });
                reader.readAsDataURL(f);
              }} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm font-semibold">Primary Site</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <input className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Site name" value={form.site_name} onChange={(e)=>setForm({ ...form, site_name: e.target.value })} />
              <input className="w-full border border-gray-300 rounded px-3 py-2" placeholder="Site address" value={form.site_address} onChange={(e)=>setForm({ ...form, site_address: e.target.value })} />
            </div>
          </div>
          <div className="flex space-x-2">
            <button onClick={submit} className="px-3 py-2 rounded bg-blue-600 text-white">Save</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-2 rounded bg-gray-100 text-gray-700">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((c) => (
              <tr key={c.id}>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-gray-100 border border-gray-200 rounded overflow-hidden flex items-center justify-center mr-2">
                      {c.logo_url ? <img src={c.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="text-gray-500 text-xs">{c.contact_person}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div>{c.email}</div>
                  <div className="text-gray-500 text-xs">{c.phone}</div>
                </td>
                <td className="px-6 py-4 text-sm"><a className="text-blue-600" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address || '')}`} target="_blank" rel="noreferrer">{c.address || 'Open in Maps'}</a></td>
                <td className="px-6 py-4 text-sm"><button className="px-2 py-1 rounded bg-gray-100" onClick={()=> setEditId(c.id)}>Edit</button></td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">{loading ? 'Loading...' : 'No clients found'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editId && (()=>{
        const c = clients.find(x=>x.id===editId);
        if(!c) return null as any;
        return (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={()=>setEditId(null)} />
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-full max-w-lg px-4">
              <div className="bg-white rounded-2xl shadow-lg p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Edit Client</div>
                  <button className="text-gray-600" onClick={()=>setEditId(null)}>✕</button>
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input className="border border-gray-300 rounded px-3 py-2" placeholder="Name" defaultValue={c.name} onChange={(e)=> updateClient(c.id, { name: e.target.value })} />
                  <input className="border border-gray-300 rounded px-3 py-2" placeholder="Email" defaultValue={c.email} onChange={(e)=> updateClient(c.id, { email: e.target.value })} />
                  <input className="border border-gray-300 rounded px-3 py-2" placeholder="Phone" defaultValue={c.phone} onChange={(e)=> updateClient(c.id, { phone: e.target.value })} />
                  <input className="border border-gray-300 rounded px-3 py-2" placeholder="Address" defaultValue={c.address} onChange={(e)=> updateClient(c.id, { address: e.target.value })} />
                </div>
                <div className="mt-4">
                  <div className="text-sm font-semibold">Sites</div>
                  <div className="mt-2 space-y-2">
                    {listLocations(c.id).map((l:any)=>(
                      <div key={l.id} className="border border-gray-200 rounded p-2 text-sm flex items-center justify-between">
                        <div>
                          <div className="font-medium">{l.name}</div>
                          <a className="text-xs text-blue-600" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address || '')}`} target="_blank" rel="noreferrer">{l.address || 'Open in Maps'}</a>
                        </div>
                      </div>
                    ))}
                    {listLocations(c.id).length===0 && <div className="text-xs text-gray-500">No sites</div>}
                  </div>
                  <div className="mt-3">
                    <div className="text-xs font-semibold">Add Site</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input className="border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Site name" value={siteForm.name} onChange={(e)=>setSiteForm({ ...siteForm, name: e.target.value })} />
                      <input className="border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Address" value={siteForm.address} onChange={(e)=>setSiteForm({ ...siteForm, address: e.target.value })} />
                    </div>
                    <button className="mt-2 px-3 py-2 rounded bg-blue-600 text-white text-xs" onClick={()=>{ if(!siteForm.name) return; addLocation({ client_id: c.id, name: siteForm.name, address: siteForm.address }); setSiteForm({ name:'', address:'' }); }}>Save Site</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
