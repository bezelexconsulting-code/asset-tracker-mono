import React, { useEffect, useState } from 'react';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

export default function SuperTechs() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [orgId, setOrgId] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<{ full_name: string; email?: string; username?: string; specialization?: string }>({ full_name: '', email: '', username: '', specialization: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{ (async()=>{ if (!SUPABASE_CONFIGURED) return; const { data } = await supabase.from('organizations').select('id,name,slug').order('name'); setOrgs(data||[]); })(); }, []);
  async function load() { if (!SUPABASE_CONFIGURED || !orgId) return; const { data } = await supabase.from('technicians').select('*').eq('org_id', orgId).order('full_name'); setRows(data||[]); }
  useEffect(()=>{ load(); }, [orgId]);

  async function addTech() {
    setError(null);
    if (!orgId || !form.full_name) { setError('Select org and name'); return; }
    const { error: err } = await supabase.from('technicians').insert({ org_id: orgId, full_name: form.full_name, email: form.email||'', username: form.username||'', specialization: form.specialization||'', is_active: true });
    if (err) { setError(err.message); return; }
    setForm({ full_name: '', email: '', username: '', specialization: '' });
    load();
  }
  async function toggleActive(id: string, active: boolean) { await supabase.from('technicians').update({ is_active: !active }).eq('id', id); load(); }
  async function remove(id: string) { await supabase.from('technicians').delete().eq('id', id); load(); }

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold">Technicians</div>
      {!SUPABASE_CONFIGURED && (<div className="p-3 border border-yellow-200 bg-yellow-50 rounded text-sm text-yellow-800">Supabase must be configured</div>)}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select className="border border-gray-300 rounded px-3 py-2" value={orgId} onChange={(e)=> setOrgId(e.target.value)}>
          <option value="">Select organization</option>
          {orgs.map(o=> (<option key={o.id} value={o.id}>{o.name}</option>))}
        </select>
        <input className="border border-gray-300 rounded px-3 py-2" placeholder="Full name" value={form.full_name} onChange={(e)=> setForm({ ...form, full_name: e.target.value })} />
        <input className="border border-gray-300 rounded px-3 py-2" placeholder="Email" value={form.email} onChange={(e)=> setForm({ ...form, email: e.target.value })} />
        <input className="border border-gray-300 rounded px-3 py-2" placeholder="Username" value={form.username} onChange={(e)=> setForm({ ...form, username: e.target.value })} />
        <input className="border border-gray-300 rounded px-3 py-2" placeholder="Specialization" value={form.specialization} onChange={(e)=> setForm({ ...form, specialization: e.target.value })} />
        <button onClick={addTech} className="px-3 py-2 rounded bg-blue-600 text-white">Add Technician</button>
      </div>
      {error && (<div className="p-3 border border-red-200 bg-red-50 rounded text-sm text-red-800">{error}</div>)}
      <div className="bg-white border border-gray-200 rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3"></th></tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map(r=> (
              <tr key={r.id}>
                <td className="px-6 py-4 text-sm">{r.full_name}</td>
                <td className="px-6 py-4 text-sm">{r.email||'—'}</td>
                <td className="px-6 py-4 text-sm">{r.is_active ? 'Active' : 'Inactive'}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <button className="px-2 py-1 rounded bg-gray-100" onClick={()=> toggleActive(r.id, r.is_active)}>Toggle</button>
                    <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={()=> remove(r.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length===0 && (<tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">No technicians</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
