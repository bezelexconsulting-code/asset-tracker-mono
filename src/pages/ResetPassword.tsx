import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';
import bcrypt from 'bcryptjs';

export default function ResetPassword() {
  const { org } = useParams();
  const navigate = useNavigate();
  const { updateTechnician } = useData() as any;
  const qp = new URLSearchParams(window.location.search);
  const user = qp.get('user'); // 'client' | 'tech'
  const techId = qp.get('tech');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pw || pw.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (pw !== confirm) { setError('Passwords do not match'); return; }
    if (user === 'client') {
      if (SUPABASE_CONFIGURED) {
        const { data } = await supabase.from('organizations').select('id').eq('slug', org);
        const orgId = data?.[0]?.id; if (!orgId) { setError('Org not found'); return; }
        const hashed = bcrypt.hashSync(pw, 10);
        await supabase.from('organizations').update({ client_password: '', client_hashed_password: hashed, client_force_reset: false }).eq('id', orgId);
        navigate(`/${org}/dashboard`);
        return;
      }
      setError('Supabase not configured'); return;
    }
    if (user === 'tech' && techId) {
      if (SUPABASE_CONFIGURED) {
        const hashed = bcrypt.hashSync(pw, 10);
        await supabase.from('technicians').update({ password: '', hashed_password: hashed, must_reset_password: false }).eq('id', techId);
        navigate(`/${org}/login`); return;
      }
      updateTechnician(techId, { password: pw, must_reset_password: false } as any);
      navigate(`/${org}/login`);
      return;
    }
    setError('Invalid request');
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white border border-gray-200 rounded-2xl p-6">
      <h1 className="text-2xl font-bold">Set New Password</h1>
      <p className="mt-2 text-gray-600">Choose a strong password for your account.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        {error && <div className="p-3 border border-red-200 bg-red-50 rounded text-sm text-red-800">{error}</div>}
        <div>
          <label className="text-sm text-gray-700">New Password</label>
          <input type="password" className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={pw} onChange={(e)=>setPw(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-700">Confirm Password</label>
          <input type="password" className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={confirm} onChange={(e)=>setConfirm(e.target.value)} />
        </div>
        <button type="submit" className="w-full px-3 py-2 rounded bg-blue-600 text-white">Save Password</button>
      </form>
    </div>
  );
}
