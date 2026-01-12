import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import bcrypt from 'bcryptjs';

export default function TechLogin() {
  const { org } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!SUPABASE_CONFIGURED) { setError('Supabase not configured'); return; }
    const { data: orgRow } = await supabase.from('organizations').select('id').eq('slug', org);
    const orgId = orgRow?.[0]?.id;
    if (!orgId) { setError('Organization not found'); return; }
    const { data: techs } = await supabase.from('technicians').select('*').eq('org_id', orgId);
    const t = (techs || []).find((x:any)=> (x.username === username || x.email === username));
    if (!t) { setError('Invalid credentials'); return; }
    const ok = t.hashed_password ? bcrypt.compareSync(password, t.hashed_password) : (!!t.password && password === t.password);
    if (!ok) { setError('Invalid credentials'); return; }
    if (t.must_reset_password) { navigate(`/${org}/reset-password?user=tech&tech=${t.id}`); return; }
    login({ id: `tech_${Date.now()}`, email: t.email || username, role: 'technician', name: t.full_name || t.username || 'Technician', technician_id: t.id });
    navigate(`/${org}/tech/app`);
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white border border-gray-200 rounded-2xl p-6">
      <h1 className="text-2xl font-bold">Technician Login</h1>
      <p className="mt-2 text-gray-600">Sign in with your technician username or email.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        {error && <div className="p-3 border border-red-200 bg-red-50 rounded text-sm text-red-800">{error}</div>}
        <div>
          <label className="text-sm text-gray-700">Username or Email</label>
          <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={username} onChange={(e)=> setUsername(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-700">Password</label>
          <input type="password" className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={password} onChange={(e)=> setPassword(e.target.value)} />
        </div>
        <button type="submit" className="w-full px-3 py-2 rounded bg-blue-600 text-white">Login</button>
      </form>
    </div>
  );
}

