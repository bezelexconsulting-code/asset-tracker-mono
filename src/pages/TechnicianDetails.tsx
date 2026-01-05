import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SUPABASE_CONFIGURED } from '../lib/supabase';
import { UserIcon, BriefcaseIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useData } from '../contexts/DataContext';
import QRCode from 'qrcode';
import { downloadPDF } from '../lib/pdf';

interface ActivityRow {
  id: string;
  client_id?: string;
  client_name: string;
  client_logo?: string;
  asset_tag: string;
  asset_name: string;
  type: string;
  status: string;
  started_at?: string;
  ended_at?: string;
}

export default function TechnicianDetails() {
  const { org, id } = useParams();
  const { listTechnicians, state, listClients, listAssets, listJobs, listLocations, listActivities } = useData() as any;
  const { updateTechnician } = useData();
  const [tech, setTech] = useState<any | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const clients = listClients();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{ name: string; email?: string; phone?: string; specialization?: string }>({ name: '', email: '', phone: '', specialization: '' });
  const personalLink = typeof window !== 'undefined' ? `${window.location.origin}/${org}/tech?tech=${id}` : '';
  const [qrData, setQrData] = useState<string>('');
  useEffect(() => {
    if (personalLink) QRCode.toDataURL(personalLink, { width: 130, margin: 1 }).then(setQrData).catch(() => setQrData(''));
  }, [personalLink]);
  const [accountEditing, setAccountEditing] = useState(false);
  const [account, setAccount] = useState<{ username?: string; password?: string }>({ username: '', password: '' });
  const jobs = (listJobs() as any[]).filter(j=> j.technician_id===id);

  useEffect(() => {
    setLoading(true);
    const t = listTechnicians().find((x) => x.id === id);
    setTech(t || { id, name: 'Technician' });
    if (t) setForm({ name: t.name || '', email: t.email || '', phone: t.phone || '', specialization: t.specialization || '' });
    const acts = state.activities
      .filter((a) => a.technician_id === id && (!selectedClient || a.client_id === selectedClient))
      .map((a) => {
        const c = clients.find((x) => x.id === a.client_id);
        const asset = listAssets().find((x) => x.id === a.asset_id);
        return {
          id: a.id,
          client_id: a.client_id,
          client_name: c?.name || '—',
          client_logo: c?.logo_url,
          asset_tag: asset?.asset_tag || '—',
          asset_name: asset?.name || '—',
          type: a.type,
          status: a.status,
          started_at: a.started_at,
          ended_at: a.ended_at,
        } as ActivityRow;
      });
    setActivities(acts);
    setLoading(false);
  }, [listTechnicians, state.activities, clients, listAssets, id, selectedClient]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Technician Details</h1>
        <Link to={`/${org}/technicians`} className="text-sm text-blue-600">Back to Technicians</Link>
      </div>
      {!SUPABASE_CONFIGURED && (
        <div className="p-3 border border-yellow-200 bg-yellow-50 rounded text-sm text-yellow-800">Showing demo activities. Configure Supabase to use live data.</div>
      )}
      <div className="flex items-center space-x-3">
        <label className="text-sm text-gray-700">Client</label>
        <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {tech && !editing && (
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex items-center">
            <UserIcon className="h-6 w-6 text-gray-400 mr-2" />
            <div>
              <div className="font-semibold text-gray-900">{tech.name}</div>
              <div className="text-gray-500 text-sm">ID: {tech.id}</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">{tech.email} • {tech.phone} • {tech.specialization}</div>
          <div className="mt-3">
            <button onClick={() => setEditing(true)} className="px-3 py-2 rounded bg-gray-900 text-white">Edit</button>
          </div>
          <div className="mt-3">
            <button onClick={() => setAccountEditing(true)} className="px-3 py-2 rounded bg-blue-600 text-white">Set Username & Password</button>
          </div>
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-3">
            <div className="text-sm font-semibold">Personal Download Link</div>
            <div className="flex items-center space-x-3 mt-2">
              {qrData ? (
                <img src={qrData} alt="QR" className="w-16 h-16 border border-gray-200 rounded" />
              ) : (
                <div className="w-16 h-16 border border-gray-200 rounded flex items-center justify-center text-xs text-gray-500">QR unavailable</div>
              )}
              <div className="text-xs text-gray-600 break-all">{personalLink}</div>
              <button className="px-2 py-1 text-xs rounded bg-gray-100" onClick={() => navigator.clipboard?.writeText(personalLink)}>Copy</button>
            </div>
          </div>
        </div>
      )}
      {tech && editing && (
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
              <label className="text-sm text-gray-700">Specialization</label>
              <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                updateTechnician(String(id), { name: form.name, email: form.email, phone: form.phone, specialization: form.specialization });
                setTech({ ...tech, ...form });
                setEditing(false);
              }}
              className="px-3 py-2 rounded bg-blue-600 text-white"
            >Save</button>
            <button onClick={() => setEditing(false)} className="px-3 py-2 rounded bg-gray-100 text-gray-700">Cancel</button>
          </div>
        </div>
      )}
      {tech && accountEditing && (
        <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-700">Username</label>
              <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={account.username || ''} onChange={(e) => setAccount({ ...account, username: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Password</label>
              <input type="password" className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={account.password || ''} onChange={(e) => setAccount({ ...account, password: e.target.value })} />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                const oldU = (tech as any).username || '';
                updateTechnician(String(id), { username: account.username, password: account.password });
                setTech({ ...tech, username: account.username, password: account.password });
                try {
                  const raw = localStorage.getItem('bez-superadmin');
                  if (raw) {
                    const data = JSON.parse(raw);
                    data.user_changes = [{ id: `id_${Date.now()}`, org_id: org, type: 'technician', user_id: String(id), old_username: oldU, new_username: account.username || '', created_at: new Date().toISOString() }, ...(data.user_changes || [])];
                    localStorage.setItem('bez-superadmin', JSON.stringify(data));
                  }
                } catch {}
                setAccountEditing(false);
              }}
              className="px-3 py-2 rounded bg-blue-600 text-white"
            >Save</button>
            <button onClick={() => setAccountEditing(false)} className="px-3 py-2 rounded bg-gray-100 text-gray-700">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activities.map((a) => (
              <tr key={a.id}>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full border border-gray-200 bg-white overflow-hidden mr-2">
                      {a.client_logo ? <img src={a.client_logo} alt="Logo" className="w-full h-full object-cover" /> : <BuildingOfficeIcon className="w-6 h-6 text-gray-300" />}
                    </div>
                    <span className="flex items-center"><BriefcaseIcon className="h-5 w-5 text-gray-400 mr-2" />{a.client_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div>{a.asset_name}</div>
                  <div className="text-gray-500 text-xs">{a.asset_tag}</div>
                </td>
                <td className="px-6 py-4 text-sm">{a.type}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    a.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>{a.status}</span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div>{a.started_at}</div>
                  <div className="text-gray-500 text-xs">{a.ended_at}</div>
                </td>
              </tr>
            ))}
            {activities.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">{loading ? 'Loading...' : 'No activity found'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Completed Jobs & Client Signatures</h2>
          <button className="px-3 py-2 rounded bg-blue-600 text-white text-xs" onClick={async ()=>{
            const completed = jobs.filter((j:any)=> j.status==='completed');
            const images = completed.flatMap((j:any)=> j.attachments || []);
            const paragraphs = completed.map((j:any)=> `${j.title} • Status: ${j.status}${j.notes? ' • Notes: '+j.notes: ''}`);
            // Header fields: technician, clients, sites, GPS if available
            const clientsSet = new Set<string>();
            const sitesSet = new Set<string>();
            completed.forEach((j:any)=> { if (j.client_id) { const c = listClients().find((x:any)=>x.id===j.client_id); if (c) clientsSet.add(c.name); } if (j.location_id) { const s = listLocations(j.client_id).find((x:any)=>x.id===j.location_id); if (s) sitesSet.add(`${s.name}${s.address? ' • '+s.address: ''}`); } });
            // GPS from activities of job assets
            let gpsLine = '';
            const acts = (listActivities() as any[]).filter(a=> completed.some((j:any)=> (j.asset_ids||[]).includes(a.asset_id)) && a.gps_lat && a.gps_lng);
            if (acts.length>0) { const a = acts[0]; gpsLine = `${a.gps_lat.toFixed(5)}, ${a.gps_lng.toFixed(5)}`; }
            await downloadPDF(`technician_${id}_report.pdf`, {
              title: `Technician ${tech?.name || id} — Completed Jobs`,
              subtitle: new Date().toLocaleString(),
              paragraphs,
              images,
              headerFields: [
                { label: 'Technician', value: tech?.name || String(id) },
                { label: 'Clients', value: Array.from(clientsSet).join(', ') || '—' },
                { label: 'Sites', value: Array.from(sitesSet).join(' | ') || '—' },
                { label: 'GPS', value: gpsLine || '—' },
              ],
              pageFooter: `Generated by Bez Asset Tracker • ${new Date().toLocaleDateString()}`,
            });
          }}>Download PDF</button>
        </div>
        <div className="mt-4 space-y-3">
          {jobs.filter(j=> j.status==='completed').map(j=> (
            <div key={j.id} className="border border-gray-200 rounded p-3">
              <div className="text-sm font-medium">{j.title}</div>
              <div className="text-xs text-gray-600">Status: {j.status}</div>
              {j.description && (<div className="text-xs text-gray-600 mt-1">Description: {j.description}</div>)}
              {j.notes && (<div className="text-xs text-gray-600 mt-1">Notes: {j.notes}</div>)}
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(j.attachments||[]).map((img:string, i:number)=> (
                  <img key={i} src={img} alt="" className="w-full h-20 object-cover rounded border border-gray-200" />
                ))}
              </div>
              {(j.attachments||[]).length===0 && (<div className="text-xs text-gray-500">No attachments</div>)}
            </div>
          ))}
          {jobs.filter(j=> j.status==='completed').length===0 && (<div className="text-sm text-gray-500">No completed jobs</div>)}
        </div>
      </div>
    </div>
  );
}
