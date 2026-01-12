import React, { useState } from 'react';
import { useSuperAdmin } from '../contexts/SuperAdminContext';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';
import bcrypt from 'bcryptjs';

function AddTechInline({ orgId, onSaved }: { orgId: string; onSaved: ()=>void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [tempPw, setTempPw] = useState('');
  if (!SUPABASE_CONFIGURED) return null as any;
  return (
    <div className="mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <input placeholder="Full name" className="border border-gray-300 rounded px-2 py-2 text-sm w-full" value={name} onChange={(e)=> setName(e.target.value)} />
        <input placeholder="Email" className="border border-gray-300 rounded px-2 py-2 text-sm w-full" value={email} onChange={(e)=> setEmail(e.target.value)} />
        <input placeholder="Username" className="border border-gray-300 rounded px-2 py-2 text-sm w-full" value={username} onChange={(e)=> setUsername(e.target.value)} />
        <input placeholder="Temporary Password" className="border border-gray-300 rounded px-2 py-2 text-sm w-full" type="password" value={tempPw} onChange={(e)=> setTempPw(e.target.value)} />
      </div>
      <button className="mt-2 px-3 py-2 rounded bg-blue-600 text-white text-sm" onClick={async()=>{ if(!name) return; const hashed = tempPw ? bcrypt.hashSync(tempPw, 10) : null; await supabase.from('technicians').insert({ org_id: orgId, full_name: name, email, username, is_active: true, password: '', hashed_password: hashed, must_reset_password: !!hashed }); onSaved(); setName(''); setEmail(''); setUsername(''); setTempPw(''); }}>Save Technician</button>
    </div>
  );
}

export default function SuperRequests() {
  const { state, addRequest, updateRequest } = useSuperAdmin();
  const [orgId, setOrgId] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const requests = state.requests;
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="text-lg font-semibold">Requests</div>
        <table className="mt-3 min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Org</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Requester</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((r)=> (
              <tr key={r.id}>
                <td className="px-4 py-2 text-sm">{(r as any).org_slug || r.org_id}</td>
                <td className="px-4 py-2 text-sm">{r.requester_email}</td>
                <td className="px-4 py-2 text-sm">{r.note}</td>
                <td className="px-4 py-2 text-sm">{r.status}</td>
                <td className="px-4 py-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <button className="px-2 py-1 rounded bg-blue-100" onClick={()=> updateRequest(r.id, { status: 'approved' })}>Approve</button>
                    <button className="px-2 py-1 rounded bg-red-100" onClick={()=> updateRequest(r.id, { status: 'rejected' })}>Reject</button>
                    {SUPABASE_CONFIGURED && (
                      <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs" onClick={()=> setExpanded(expanded===r.id ? null : r.id)}>
                        {expanded===r.id ? 'Hide' : 'Add Technician'}
                      </button>
                    )}
                  </div>
                  {SUPABASE_CONFIGURED && expanded===r.id && (
                    <div className="mt-3">
                      <AddTechInline orgId={r.org_id} onSaved={()=>{ setExpanded(null); }} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {requests.length===0 && (<tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No requests</td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div className="text-lg font-semibold">Add Request</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Org ID" value={orgId} onChange={(e)=>setOrgId(e.target.value)} />
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Requester Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Note" value={note} onChange={(e)=>setNote(e.target.value)} />
        </div>
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>{ if(!orgId || !email) return; addRequest({ org_id: orgId, requester_email: email, note }); setOrgId(''); setEmail(''); setNote(''); }}>Save</button>
      </div>
    </div>
  );
}
