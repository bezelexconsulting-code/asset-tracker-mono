import React, { useState } from 'react';
import { useSuperAdmin } from '../contexts/SuperAdminContext';
import React from 'react';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';
import bcrypt from 'bcryptjs';

function AddTechInline({ orgId, onSaved }: { orgId: string; onSaved?: ()=>void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  if (!SUPABASE_CONFIGURED) return null as any;
  return (
    <div className="mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input placeholder="Full name" className="border border-gray-300 rounded px-2 py-2 text-sm w-full" value={name} onChange={(e)=> setName(e.target.value)} />
        <input placeholder="Email" className="border border-gray-300 rounded px-2 py-2 text-sm w-full" value={email} onChange={(e)=> setEmail(e.target.value)} />
        <input placeholder="Username" className="border border-gray-300 rounded px-2 py-2 text-sm w-full" value={username} onChange={(e)=> setUsername(e.target.value)} />
      </div>
      <button className="mt-2 px-3 py-2 rounded bg-blue-600 text-white text-sm" onClick={async()=>{ if(!name) return; await supabase.from('technicians').insert({ org_id: orgId, full_name: name, email, username, is_active: true }); if(onSaved) onSaved(); setName(''); setEmail(''); setUsername(''); }}>Save Technician</button>
    </div>
  );
}

export default function SuperOrgs() {
  const { state, addOrg, updateOrg } = useSuperAdmin();
  const [name, setName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [contact, setContact] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [firstTech, setFirstTech] = useState<{ name: string; email: string; username: string; password?: string }>({ name: '', email: '', username: '', password: '' });

  async function load() {
    if (!SUPABASE_CONFIGURED) return;
    const { data } = await supabase.from('organizations').select('*').order('created_at', { ascending: false });
    setRows(data || []);
  }
  React.useEffect(() => { load(); }, []);
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="text-lg font-semibold">Organizations</div>
        <table className="mt-3 min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Org ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(SUPABASE_CONFIGURED ? rows : state.orgs).map((o:any)=> (
              <tr key={o.id}>
                <td className="px-4 py-2 text-sm">{o.org_id || o.slug}</td>
                <td className="px-4 py-2 text-sm">{o.name}</td>
                <td className="px-4 py-2 text-sm">{o.contact_email}</td>
                <td className="px-4 py-2 text-sm">
                  {SUPABASE_CONFIGURED ? (
                    <div className="flex items-center space-x-2">
                      <button className="px-2 py-1 rounded bg-gray-100" onClick={async()=>{ await supabase.from('organizations').update({ active: !o.active }).eq('id', o.id); load(); }}>
                        {o.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="px-2 py-1 rounded bg-blue-600 text-white" onClick={async()=>{ await supabase.from('organizations').update({ client_username: username||o.client_username, client_password: password||o.client_password, client_force_reset: true }).eq('id', o.id); load(); }}>Set Client Login</button>
                      <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={async()=>{ await supabase.from('organizations').delete().eq('id', o.id); load(); }}>Delete</button>
                      <a href={`/super/techs?org_id=${o.id}&org_slug=${o.slug || ''}`} className="px-2 py-1 rounded bg-blue-600 text-white text-xs">Add Technician</a>
                    </div>
                  ) : (
                    <button className="px-2 py-1 rounded bg-gray-100" onClick={()=> updateOrg(o.id, { active: !o.active })}>{o.active ? 'Deactivate' : 'Activate'}</button>
                  )}
                </td>
              </tr>
            ))}
            {state.orgs.length===0 && (<tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">No orgs</td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div className="text-lg font-semibold">Add Organization</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Org ID" value={orgId} onChange={(e)=>setOrgId(e.target.value)} />
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Contact Email" value={contact} onChange={(e)=>setContact(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Client Username" value={username} onChange={(e)=>setUsername(e.target.value)} />
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Client Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="First Tech Name (optional)" value={firstTech.name} onChange={(e)=> setFirstTech({ ...firstTech, name: e.target.value })} />
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="First Tech Email" value={firstTech.email} onChange={(e)=> setFirstTech({ ...firstTech, email: e.target.value })} />
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="First Tech Username" value={firstTech.username} onChange={(e)=> setFirstTech({ ...firstTech, username: e.target.value })} />
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Temporary Password" type="password" value={firstTech.password} onChange={(e)=> setFirstTech({ ...firstTech, password: e.target.value })} />
        </div>
        <button className="px-3 py-2 rounded bg-blue-600 text-white mt-3" onClick={async()=>{ if(!orgId || !name) return; if (SUPABASE_CONFIGURED) { const { data } = await supabase.from('organizations').insert({ slug: orgId, name, contact_email: contact, active: true, client_username: username, client_password: password, client_force_reset: true }).select('id'); const newOrgId = data?.[0]?.id; if (newOrgId && firstTech.name) { const hashed = firstTech.password ? bcrypt.hashSync(firstTech.password, 10) : null; await supabase.from('technicians').insert({ org_id: newOrgId, full_name: firstTech.name, email: firstTech.email, username: firstTech.username, is_active: true, password: '', hashed_password: hashed, must_reset_password: !!hashed }); } setOrgId(''); setName(''); setContact(''); setUsername(''); setPassword(''); setFirstTech({ name:'', email:'', username:'', password:'' }); load(); } else { addOrg({ org_id: orgId, name, contact_email: contact, active: true }); setOrgId(''); setName(''); setContact(''); } }}>Save</button>
      </div>
    </div>
  );
}
