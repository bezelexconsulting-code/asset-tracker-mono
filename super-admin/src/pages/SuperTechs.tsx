import React, { useEffect, useState } from 'react';
import { supabase, SUPABASE_CONFIGURED, supabaseUrl } from '../lib/supabase';
import bcrypt from 'bcryptjs';

export default function SuperTechs() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [orgId, setOrgId] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<{ full_name: string; email?: string; username?: string; specialization?: string; temp_password?: string }>({ full_name: '', email: '', username: '', specialization: '', temp_password: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{ (async()=>{ if (!SUPABASE_CONFIGURED) return; const { data } = await supabase.from('organizations').select('id,name,slug').order('name'); setOrgs(data||[]); })(); }, []);
  useEffect(()=>{ 
    if (!SUPABASE_CONFIGURED) return;
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const qOrgId = params.get('org_id');
    const qOrgSlug = params.get('org_slug');
    (async()=>{
      if (qOrgId) { setOrgId(qOrgId); return; }
      if (qOrgSlug) { const { data } = await supabase.from('organizations').select('id').eq('slug', qOrgSlug).limit(1); const id = data?.[0]?.id; if (id) setOrgId(id); }
    })();
  }, []);
  useEffect(()=>{
    if (!SUPABASE_CONFIGURED || !orgId) return;
    const origFetch = window.fetch.bind(window);
    window.fetch = (input: any, init: any = {}) => {
      try {
        const url = typeof input === 'string' ? input : (input?.url || '');
        if (url.startsWith(`${supabaseUrl}/rest`)) {
          if (init.headers instanceof Headers) {
            init.headers.set('app-org-id', orgId);
          } else {
            init.headers = { ...(init.headers as any), 'app-org-id': orgId };
          }
        }
      } catch {}
      return origFetch(input, init);
    };
    return ()=> { window.fetch = origFetch; };
  }, [orgId]);
  async function load() { if (!SUPABASE_CONFIGURED || !orgId) return; const { data } = await supabase.from('technicians').select('*').eq('org_id', orgId).order('full_name'); setRows(data||[]); }
  useEffect(()=>{ load(); }, [orgId]);
  useEffect(()=>{ 
    if (!SUPABASE_CONFIGURED || !orgId) return;
    const ch = supabase.channel(`super_techs_${orgId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'technicians', filter: `org_id=eq.${orgId}` }, ()=> load()).subscribe();
    return ()=> { try { supabase.removeChannel(ch); } catch {} };
  }, [orgId]);

  async function addTech() {
    setError(null);
    if (!orgId || !form.full_name) { setError('Select org and name'); return; }
    if (!form.temp_password) { setError('Temporary password is required'); return; }
    const hashed = form.temp_password ? bcrypt.hashSync(form.temp_password, 10) : null;
    const { error: err } = await supabase.from('technicians').insert({ org_id: orgId, full_name: form.full_name, email: form.email||'', username: form.username||'', specialization: form.specialization||'', is_active: true, password: '', hashed_password: hashed, must_reset_password: !!hashed });
    if (err) { setError(err.message); return; }
    setForm({ full_name: '', email: '', username: '', specialization: '', temp_password: '' });
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
        <input className="border border-gray-300 rounded px-3 py-2" placeholder="Temporary Password" type="password" value={form.temp_password} onChange={(e)=> setForm({ ...form, temp_password: e.target.value })} />
        <button onClick={addTech} className="px-3 py-2 rounded bg-blue-600 text-white">Add Technician</button>
      </div>
      {error && (<div className="p-3 border border-red-200 bg-red-50 rounded text-sm text-red-800">{error}</div>)}
      <div className="bg-white border border-gray-200 rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3"></th></tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map(r=> (
              <tr key={r.id}>
                <td className="px-6 py-4 text-sm">
                  <div className="font-medium text-gray-900">{r.full_name}</div>
                  <div className="text-gray-500 text-xs">{r.email||'No email'}</div>
                </td>
                <td className="px-6 py-4 text-sm">{r.username||'—'}</td>
                <td className="px-6 py-4 text-sm">{r.specialization||'—'}</td>
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
