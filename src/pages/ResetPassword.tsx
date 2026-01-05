import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!pw || pw.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (pw !== confirm) { setError('Passwords do not match'); return; }
    if (user === 'client') {
      try {
        const raw = localStorage.getItem('bez-superadmin');
        const data = raw ? JSON.parse(raw) : { orgs: [] };
        const orgs = (data.orgs || []).map((o: any) => {
          if (o.org_id !== org) return o;
          return { ...o, client_credentials: { ...(o.client_credentials||{}), password: pw }, client_force_reset: false };
        });
        localStorage.setItem('bez-superadmin', JSON.stringify({ ...data, orgs }));
        navigate(`/${org}/dashboard`);
      } catch {
        setError('Failed to update password');
      }
      return;
    }
    if (user === 'tech' && techId) {
      updateTechnician(techId, { password: pw, must_reset_password: false } as any);
      navigate(`/${org}/technicians/${techId}`);
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
