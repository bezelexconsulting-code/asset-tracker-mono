import React, { useEffect, useMemo, useState } from 'react';
import { supabase, SUPABASE_CONFIGURED, createOrgClient, DEFAULT_ORG_ID } from '../lib/supabase';
import { restGet, restPost, restPatch, restDelete } from '../lib/rest';
import bcrypt from 'bcryptjs';

export default function SuperTechs() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [orgId, setOrgId] = useState<string>(DEFAULT_ORG_ID);
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
      if (qOrgId) { setOrgId(qOrgId); try { localStorage.setItem('super_admin_org_id', qOrgId); } catch {} return; }
      if (qOrgSlug) { const { data } = await supabase.from('organizations').select('id').eq('slug', qOrgSlug).limit(1); const id = data?.[0]?.id; if (id) { setOrgId(id); try { localStorage.setItem('super_admin_org_id', id); } catch {} } return; }
      const saved = (typeof window !== 'undefined' ? localStorage.getItem('super_admin_org_id') : '') || '';
      if (saved) setOrgId(saved);
      else if (DEFAULT_ORG_ID) setOrgId(DEFAULT_ORG_ID);
    })();
  }, []);
  // No fetch intercept needed; REST helper handles headers explicitly.
  const orgSb = useMemo(()=> createOrgClient(orgId), [orgId]);
  async function load() {
    if (!SUPABASE_CONFIGURED || !orgId) return;
    try {
      const { data, error } = await orgSb.rpc('get_technicians', { p_org_id: orgId });
      if (error) throw error;
      setRows((data as any[]) || []);
    } catch (e:any) {
      setError(e.message);
    }
  }
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
    try {
      const { data, error } = await orgSb.rpc('add_technician', {
        p_org_id: orgId,
        p_full_name: form.full_name,
        p_email: form.email || '',
        p_username: form.username || '',
        p_specialization: form.specialization || '',
        p_temp_password: form.temp_password
      });
      if (error) throw error;
      if (!data) {
        setError('Insert succeeded but no row returned. Reloading list.');
      }
    } catch(e:any) { setError(e.message); return; }
    setForm({ full_name: '', email: '', username: '', specialization: '', temp_password: '' });
    load();
  }
  async function toggleActive(id: string, active: boolean) { try { const orgSb = createOrgClient(orgId); const { error } = await orgSb.from('technicians').update({ is_active: !active }).eq('id', id); if (error) throw error; } catch(e:any) { setError(e.message); } load(); }
  async function remove(id: string) { try { const orgSb = createOrgClient(orgId); const { error } = await orgSb.from('technicians').delete().eq('id', id); if (error) throw error; } catch(e:any) { setError(e.message); } load(); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Technicians</div>
        {orgId && (<div className="text-xs text-gray-600">Active Org: <span className="font-mono">{orgId}</span></div>)}
      </div>
      {!SUPABASE_CONFIGURED && (<div className="p-3 border border-yellow-200 bg-yellow-50 rounded text-sm text-yellow-800">Supabase must be configured</div>)}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select className="border border-gray-300 rounded px-3 py-2" value={orgId} onChange={(e)=> { setOrgId(e.target.value); try { localStorage.setItem('super_admin_org_id', e.target.value); } catch {} } }>
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
