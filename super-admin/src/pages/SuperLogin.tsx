import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SuperLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const r of regs) await r.unregister();
        }
        if (window.caches) {
          const keys = await caches.keys();
          for (const k of keys) await caches.delete(k);
        }
      } catch {}
    })();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    login({ id: `super_${Date.now()}`, email, role: 'superadmin' });
    navigate('/super/dashboard');
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded p-6">
        <h1 className="text-2xl font-bold">Super Admin</h1>
        <p className="mt-2 text-gray-600">Sign in to manage organizations.</p>
      </div>
      <form onSubmit={submit} className="bg-white border border-gray-200 rounded p-6 space-y-4">
        {error && <div className="p-3 border border-red-200 bg-red-50 rounded text-sm text-red-800">{error}</div>}
        <div>
          <label className="text-sm text-gray-700">Email</label>
          <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-700">Password</label>
          <input type="password" className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="w-full px-3 py-2 rounded bg-blue-600 text-white">Login</button>
      </form>
    </div>
  );
}
