import React, { useState } from 'react';
import { useSuperAdmin } from '../contexts/SuperAdminContext';

export default function SuperTickets() {
  const { state, addTicket, updateTicket } = useSuperAdmin();
  const [orgId, setOrgId] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="text-lg font-semibold">Tickets</div>
        <table className="mt-3 min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Org</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Requester</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {state.tickets.map((t)=> (
              <tr key={t.id}>
                <td className="px-4 py-2 text-sm">{t.org_id}</td>
                <td className="px-4 py-2 text-sm">{t.requester_email}</td>
                <td className="px-4 py-2 text-sm">{t.subject}</td>
                <td className="px-4 py-2 text-sm">{t.status}</td>
                <td className="px-4 py-2 text-sm">
                  <button className="px-2 py-1 rounded bg-gray-100" onClick={()=> updateTicket(t.id, { status: t.status==='open' ? 'closed' : 'open' })}>{t.status==='open' ? 'Close' : 'Reopen'}</button>
                </td>
              </tr>
            ))}
            {state.tickets.length===0 && (<tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No tickets</td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div className="text-lg font-semibold">Create Ticket</div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Org ID" value={orgId} onChange={(e)=>setOrgId(e.target.value)} />
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Requester Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Subject" value={subject} onChange={(e)=>setSubject(e.target.value)} />
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Message" value={message} onChange={(e)=>setMessage(e.target.value)} />
        </div>
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>{ if(!orgId || !subject) return; addTicket({ org_id: orgId, requester_email: email, subject, message }); setOrgId(''); setEmail(''); setSubject(''); setMessage(''); }}>Save</button>
      </div>
    </div>
  );
}
