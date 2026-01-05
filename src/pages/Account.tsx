import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

export default function Account() {
  const { org } = useParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const save = () => {
    try {
      const raw = localStorage.getItem('bez-superadmin');
      if (!raw) return;
      const data = JSON.parse(raw);
      const idx = (data.orgs || []).findIndex((o: any) => o.org_id === org);
      if (idx === -1) return;
      const old = data.orgs[idx].client_credentials?.username || '';
      data.orgs[idx].client_credentials = { username, password };
      data.user_changes = [{ id: `id_${Date.now()}`, org_id: org, type: 'admin', old_username: old, new_username: username, created_at: new Date().toISOString() }, ...(data.user_changes || [])];
      localStorage.setItem('bez-superadmin', JSON.stringify(data));
      setMessage('Saved');
    } catch {
      setMessage('Error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Account</h1>
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        {message && <div className="p-3 border border-blue-200 bg-blue-50 rounded text-sm text-blue-800">{message}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-700">Username</label>
            <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="text-sm text-gray-700">Password</label>
            <input type="password" className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={save}>Save</button>
      </div>
    </div>
  );
}
