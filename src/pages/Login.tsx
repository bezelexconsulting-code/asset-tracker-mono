import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export default function Login() {
  const { org } = useParams();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { login } = useAuth();
  const { listTechnicians, addTechnician } = useData() as any;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'technician'>('admin');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const techId = params.get('tech');
    const demo = params.get('demo');
    if (techId) {
      const t = listTechnicians().find((x) => x.id === techId);
      if (t) {
        setRole('technician');
        setEmail(t.email || '');
      }
    }
    if (demo === '1') {
      try { const loader = (window as any).bezDemoLoader; if (typeof loader === 'function') loader(); } catch {}
      login({ id: `admin_${Date.now()}`, email: 'demo@example.com', role: 'admin', name: settings.orgProfile.name });
      navigate(`/${org}/dashboard`);
    }
  }, [listTechnicians]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) { setError('Email is required'); return; }
    if (role === 'admin') {
      try {
        const raw = localStorage.getItem('bez-superadmin');
        if (raw) {
          const data = JSON.parse(raw);
          const orgRec = (data.orgs || []).find((o: any) => o.org_id === org);
          if (orgRec && orgRec.client_credentials) {
            const u = orgRec.client_credentials.username || '';
            const p = orgRec.client_credentials.password || '';
            if (!password || password !== p || (email !== orgRec.contact_email && email !== u)) {
              setError('Invalid credentials');
              return;
            }
            if (orgRec.client_force_reset) {
              navigate(`/${org}/reset-password?user=client`);
              return;
            }
          }
        }
      } catch {}
      login({ id: `admin_${Date.now()}`, email, role: 'admin', name: settings.orgProfile.name });
      navigate(`/${org}/dashboard`);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const techId = params.get('tech');
    let techs = listTechnicians();
    // seed technicians from Super Admin store if present for this org
    try {
      const raw = localStorage.getItem('bez-superadmin');
      const data = raw ? JSON.parse(raw) : {};
      const sTechs = (data.techs || []).filter((st: any) => st.org_id === org);
      for (const st of sTechs) {
        if (!techs.find((x) => x.username === st.username || x.email === st.email)) {
          addTechnician({ name: st.full_name, email: st.email, username: st.username, password: st.password, status: 'active', must_reset_password: st.must_reset_password });
        }
      }
      techs = listTechnicians();
    } catch {}
    let t = techId ? techs.find((x) => x.id === techId) : null;
    if (!t) t = techs.find((x) => x.email === email || x.username === email) || null;
    if (t && t.password && password !== t.password) { setError('Invalid credentials'); return; }
    if (t && (t as any).must_reset_password) {
      navigate(`/${org}/reset-password?user=tech&tech=${t.id}`);
      return;
    }
    login({ id: `tech_${Date.now()}`, email, role: 'technician', name: t?.name || 'Technician', technician_id: (techId || t?.id) || undefined });
    navigate(`/${org}/technicians/${techId || 't1'}`);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded overflow-hidden flex items-center justify-center">
            {settings.branding.logo_url ? (
              <img src={settings.branding.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-gray-400">Logo</span>
            )}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: settings.branding.primary_color || '#111827' }}>{settings.orgProfile.name || org}</h1>
        </div>
        <p className="mt-2 text-gray-600">Sign in to manage assets and activities.</p>
      </div>

      <form onSubmit={submit} className="bg-white border border-gray-200 rounded p-6 space-y-4">
        {error && <div className="p-3 border border-red-200 bg-red-50 rounded text-sm text-red-800">{error}</div>}
        <div>
          <label className="text-sm text-gray-700">Role</label>
          <select className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="admin">Admin</option>
            <option value="technician">Technician</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-700">Email</label>
          <input className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-700">Password</label>
          <input type="password" className="mt-1 w-full border border-gray-300 rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="w-full px-3 py-2 rounded bg-blue-600 text-white">Login</button>
        <div className="text-xs text-gray-500 mt-2">For technicians, use your personal link; the page will pre-fill your email.</div>
      </form>

      <div className="text-sm text-gray-600 text-center">
        <Link to={`/${org}/tech`} className="text-blue-600 hover:underline">Technician Download</Link>
      </div>
    </div>
  );
}
