import React, { useState } from 'react';
import { useSuperAdmin } from '../contexts/SuperAdminContext';

export default function SuperBilling() {
  const { state, addInvoice, updateInvoice } = useSuperAdmin();
  const [orgId, setOrgId] = useState('');
  const [amount, setAmount] = useState(19900);
  const [period, setPeriod] = useState(new Date().toISOString().slice(0,7));
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="text-lg font-semibold">Invoices</div>
        <table className="mt-3 min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Org</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {state.invoices.map((i)=> (
              <tr key={i.id}>
                <td className="px-4 py-2 text-sm">{i.org_id}</td>
                <td className="px-4 py-2 text-sm">R{(i.amount_cents/100).toFixed(2)}</td>
                <td className="px-4 py-2 text-sm">{i.period}</td>
                <td className="px-4 py-2 text-sm">{i.status}</td>
                <td className="px-4 py-2 text-sm">
                  <button className="px-2 py-1 rounded bg-green-100" onClick={()=> updateInvoice(i.id, { status: 'paid' })}>Mark Paid</button>
                </td>
              </tr>
            ))}
            {state.invoices.length===0 && (<tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">No invoices</td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div className="text-lg font-semibold">Create Invoice</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Org ID" value={orgId} onChange={(e)=>setOrgId(e.target.value)} />
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Amount cents" type="number" value={amount} onChange={(e)=>setAmount(Number(e.target.value))} />
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Period YYYY-MM" value={period} onChange={(e)=>setPeriod(e.target.value)} />
        </div>
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>{ if(!orgId) return; addInvoice({ org_id: orgId, amount_cents: amount, period }); setOrgId(''); setAmount(19900); setPeriod(new Date().toISOString().slice(0,7)); }}>Save</button>
      </div>
    </div>
  );
}
