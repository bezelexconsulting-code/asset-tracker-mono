import React, { useState } from 'react';
import { useSuperAdmin } from '../contexts/SuperAdminContext';

export default function SuperOrgs() {
  const { state, addOrg, updateOrg } = useSuperAdmin();
  const [name, setName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [contact, setContact] = useState('');
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
            {state.orgs.map((o)=> (
              <tr key={o.id}>
                <td className="px-4 py-2 text-sm">{o.org_id}</td>
                <td className="px-4 py-2 text-sm">{o.name}</td>
                <td className="px-4 py-2 text-sm">{o.contact_email}</td>
                <td className="px-4 py-2 text-sm">
                  <button className="px-2 py-1 rounded bg-gray-100" onClick={()=> updateOrg(o.id, { active: !o.active })}>{o.active ? 'Deactivate' : 'Activate'}</button>
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
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>{ if(!orgId || !name) return; addOrg({ org_id: orgId, name, contact_email: contact, active: true }); setOrgId(''); setName(''); setContact(''); }}>Save</button>
      </div>
    </div>
  );
}
