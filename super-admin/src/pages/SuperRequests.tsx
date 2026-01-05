import React, { useState } from 'react';
import { useSuperAdmin } from '../contexts/SuperAdminContext';

export default function SuperRequests() {
  const { state, addRequest, updateRequest } = useSuperAdmin();
  const [orgId, setOrgId] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
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
                <td className="px-4 py-2 text-sm">{r.org_id}</td>
                <td className="px-4 py-2 text-sm">{r.requester_email}</td>
                <td className="px-4 py-2 text-sm">{r.note}</td>
                <td className="px-4 py-2 text-sm">{r.status}</td>
                <td className="px-4 py-2 text-sm">
                  <button className="px-2 py-1 rounded bg-blue-100" onClick={()=> updateRequest(r.id, { status: 'approved' })}>Approve</button>
                  <button className="ml-2 px-2 py-1 rounded bg-red-100" onClick={()=> updateRequest(r.id, { status: 'rejected' })}>Reject</button>
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
