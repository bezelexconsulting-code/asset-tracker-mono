import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SUPABASE_CONFIGURED, supabase } from '../lib/supabase';
import { useData } from '../contexts/DataContext';
import { UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface Technician {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  status?: 'active' | 'inactive';
}

export default function Technicians() {
  const { org } = useParams();
  const { listTechnicians, state, listClients, addJob, listAssets, listLocations, addAsset } = useData() as any;
  const [techs, setTechs] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const clients = listClients();
  const [jobForTech, setJobForTech] = useState<string | null>(null);
  const [jobForm, setJobForm] = useState<{ title:string; client_id:string; location_id:string; asset_ids:string[]; notes:string; description:string }>({ title:'', client_id:'', location_id:'', asset_ids:[], notes:'', description:'' });
  const [addAssetForm, setAddAssetForm] = useState<{ name:string; asset_tag:string }>({ name:'', asset_tag:'' });

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (SUPABASE_CONFIGURED) {
        const { data: orgRow } = await supabase.from('organizations').select('id').eq('slug', org);
        const orgId = orgRow?.[0]?.id;
        const { data } = await supabase.from('technicians').select('id, full_name as name, email, specialization, is_active as status').eq('org_id', orgId).order('full_name');
        setTechs((data||[]) as any);
        supabase.channel(`techs_${orgId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'technicians', filter: `org_id=eq.${orgId}` }, async ()=>{
            const { data } = await supabase.from('technicians').select('id, full_name as name, email, specialization, is_active as status').eq('org_id', orgId).order('full_name');
            setTechs((data||[]) as any);
          })
          .subscribe();
      } else {
        setTechs(listTechnicians());
      }
      setLoading(false);
    })();
  }, [listTechnicians, org]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Technicians</h1>
        <div className="space-x-2"></div>
      </div>
      {/* Demo banner removed in production */}
      <div className="text-sm text-gray-600">Assign jobs to technicians directly from this list.</div>
      <div className="bg-white border border-gray-200 rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clients</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {techs.map((t) => (
              <tr key={t.id}>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <div className="font-medium text-gray-900">{t.name}</div>
                      <div className="text-gray-500 text-xs">{t.email} • {t.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">{t.specialization}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex -space-x-2">
                    {Array.from(new Set(state.activities.filter((a) => a.technician_id === t.id && (!selectedClient || a.client_id === selectedClient)).map((a) => a.client_id)))
                      .slice(0, 5)
                      .map((cid) => {
                        const c = clients.find((x) => x.id === cid);
                        return (
                          <div key={`${t.id}-${cid}`} className="w-6 h-6 rounded-full border border-gray-200 bg-white overflow-hidden">
                            {c?.logo_url ? <img src={c.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <BuildingOfficeIcon className="w-6 h-6 text-gray-300" />}
                          </div>
                        );
                      })}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    t.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>{t.status}</span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Link to={`/${org}/technicians/${t.id}`} className="text-blue-600 hover:underline">View Activity</Link>
                    <button className="px-2 py-1 rounded bg-blue-600 text-white" onClick={()=>{ setJobForTech(t.id); setJobForm({ title:'', client_id:'', location_id:'', asset_ids:[], notes:'' }); }}>Add Job</button>
                  </div>
                </td>
              </tr>
            ))}
            {techs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">{loading ? 'Loading...' : 'No technicians found'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {jobForTech && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setJobForTech(null)} />
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-full max-w-lg px-4">
            <div className="bg-white rounded-2xl shadow-lg p-6 max-h-[85vh] overflow-y-auto">
              <div className="text-sm font-semibold mb-2">Create Job</div>
              <input className="border border-gray-300 rounded px-3 py-2 w-full mb-2" placeholder="Title" value={jobForm.title} onChange={(e)=>setJobForm({ ...jobForm, title: e.target.value })} />
              <select className="border border-gray-300 rounded px-3 py-2 w-full mb-2" value={jobForm.client_id} onChange={(e)=>setJobForm({ ...jobForm, client_id: e.target.value, location_id:'', asset_ids:[] })}>
                <option value="">Select client</option>
                {clients.map((c:any)=> <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="border border-gray-300 rounded px-3 py-2 w-full mb-2" value={jobForm.location_id} onChange={(e)=>setJobForm({ ...jobForm, location_id: e.target.value })}>
                <option value="">Select site</option>
                {listLocations(jobForm.client_id || undefined).map((s:any)=> <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="text-sm font-semibold mt-2">Assets</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {listAssets(jobForm.client_id || undefined).filter((a:any)=> !jobForm.location_id || a.location_id===jobForm.location_id).map((a:any)=> (
                  <label key={a.id} className="text-xs flex items-center space-x-2">
                    <input type="checkbox" checked={jobForm.asset_ids.includes(a.id)} onChange={(e)=> setJobForm({ ...jobForm, asset_ids: e.target.checked ? [...jobForm.asset_ids, a.id] : jobForm.asset_ids.filter(x=>x!==a.id) })} />
                    <span>{a.name}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2 bg-gray-50 border border-gray-200 rounded p-3">
                <div className="text-xs font-semibold mb-2">Add Asset</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input className="border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Asset name" value={addAssetForm.name} onChange={(e)=> setAddAssetForm({ ...addAssetForm, name: e.target.value })} />
                  <input className="border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Asset tag" value={addAssetForm.asset_tag} onChange={(e)=> setAddAssetForm({ ...addAssetForm, asset_tag: e.target.value })} />
                </div>
                <div className="mt-2">
                  <button className="px-3 py-2 rounded bg-blue-600 text-white text-xs" onClick={()=>{ if(!addAssetForm.name || !addAssetForm.asset_tag || !jobForm.client_id) return; const created = addAsset({ name: addAssetForm.name, asset_tag: addAssetForm.asset_tag, client_id: jobForm.client_id, location_id: jobForm.location_id || undefined, status: 'available' }); setAddAssetForm({ name:'', asset_tag:'' }); setJobForm({ ...jobForm, asset_ids: [...jobForm.asset_ids, created.id] }); }}>Save Asset</button>
                </div>
              </div>
              <div className="text-sm font-semibold mt-3">Notes</div>
              <textarea className="border border-gray-300 rounded px-3 py-2 w-full text-sm" rows={3} placeholder="Instructions or context for the technician" value={jobForm.notes} onChange={(e)=> setJobForm({ ...jobForm, notes: e.target.value })} />
              <div className="text-sm font-semibold mt-3">Description</div>
              <textarea className="border border-gray-300 rounded px-3 py-2 w-full text-sm" rows={3} placeholder="Job description shown to client and technician" value={jobForm.description} onChange={(e)=> setJobForm({ ...jobForm, description: e.target.value })} />
              <div className="flex items-center space-x-2">
                <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>{ if(!jobForm.title||!jobForm.client_id) return; addJob({ title: jobForm.title, client_id: jobForm.client_id, location_id: jobForm.location_id, technician_id: jobForTech, asset_ids: jobForm.asset_ids, notes: jobForm.notes, description: jobForm.description }); setJobForTech(null); }}>Save</button>
                <button className="px-3 py-2 rounded bg-gray-100 text-gray-700" onClick={()=>setJobForTech(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
