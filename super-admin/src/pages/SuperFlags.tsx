import React, { useState } from 'react';
import { useSuperAdmin } from '../contexts/SuperAdminContext';

export default function SuperFlags() {
  const { state, setFlag } = useSuperAdmin();
  const [orgId, setOrgId] = useState('demo-org');
  const [key, setKey] = useState('signature_capture');
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="text-lg font-semibold">Flags</div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Org ID" value={orgId} onChange={(e)=>setOrgId(e.target.value)} />
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Key" value={key} onChange={(e)=>setKey(e.target.value)} />
          <label className="flex items-center space-x-2">
            <input type="checkbox" checked={enabled} onChange={(e)=>setEnabled(e.target.checked)} />
            <span>Enabled</span>
          </label>
        </div>
        <button className="mt-3 px-3 py-2 rounded bg-blue-600 text-white" onClick={()=> setFlag(orgId, key, enabled)}>Save Flag</button>
      </div>
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="text-lg font-semibold">Current</div>
        <ul className="mt-3 space-y-2">
          {(state.flags || []).map((f)=> (
            <li key={f.id} className="text-sm">{f.org_id} • {f.key} • {f.enabled ? 'enabled' : 'disabled'}</li>
          ))}
          {(state.flags || []).length===0 && (<li className="text-sm text-gray-500">No flags</li>)}
        </ul>
      </div>
    </div>
  );
}
