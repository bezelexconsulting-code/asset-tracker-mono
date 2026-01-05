import React, { useEffect, useState } from 'react';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

export default function SuperBranding() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [primary, setPrimary] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [android, setAndroid] = useState<string>('');
  const [ios, setIos] = useState<string>('');
  const [web, setWeb] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async()=>{
      if (!SUPABASE_CONFIGURED) return;
      const { data } = await supabase.from('organizations').select('*').order('name');
      setOrgs(data||[]);
    })();
  }, []);

  useEffect(()=>{
    const o = orgs.find(o=> o.id===selected);
    if (!o) return;
    setPrimary(o.branding_primary_color||'');
    setLogoUrl(o.branding_logo_url||'');
    setAndroid(o.app_android_url||'');
    setIos(o.app_ios_url||'');
    setWeb(o.app_web_url||'');
  }, [selected, orgs]);

  async function uploadLogo(file: File) {
    setError(null);
    if (!SUPABASE_CONFIGURED || !selected) return;
    const org = orgs.find(o=> o.id===selected);
    const slug = org?.slug||'org';
    const path = `${slug}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('branding').upload(path, file, { upsert: true });
    if (upErr) { setError(upErr.message); return; }
    const { data } = supabase.storage.from('branding').getPublicUrl(path);
    setLogoUrl(data.publicUrl);
  }

  async function save() {
    setError(null);
    if (!SUPABASE_CONFIGURED || !selected) return;
    const { error } = await supabase.from('organizations').update({ branding_logo_url: logoUrl, branding_primary_color: primary, app_android_url: android, app_ios_url: ios, app_web_url: web }).eq('id', selected);
    if (error) { setError(error.message); }
  }

  return (
    <div className="space-y-6">
      <div className="text-lg font-semibold">Branding & App Links</div>
      {!SUPABASE_CONFIGURED && (<div className="p-3 border border-yellow-200 bg-yellow-50 rounded text-sm text-yellow-800">Supabase must be configured</div>)}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select className="border border-gray-300 rounded px-3 py-2" value={selected} onChange={(e)=> setSelected(e.target.value)}>
          <option value="">Select organization</option>
          {orgs.map(o=> (<option key={o.id} value={o.id}>{o.name}</option>))}
        </select>
        <input className="border border-gray-300 rounded px-3 py-2" placeholder="#0ea5e9 primary color" value={primary} onChange={(e)=> setPrimary(e.target.value)} />
        <div className="flex items-center space-x-2">
          <label className="px-3 py-2 rounded bg-blue-600 text-white cursor-pointer">
            <input type="file" className="hidden" accept="image/*" onChange={(e)=>{ const f=e.target.files?.[0]; if(f) uploadLogo(f); }} />
            Upload Logo
          </label>
          {logoUrl && (<img src={logoUrl} alt="Logo" className="w-10 h-10 rounded" />)}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="border border-gray-300 rounded px-3 py-2" placeholder="Android app URL" value={android} onChange={(e)=> setAndroid(e.target.value)} />
        <input className="border border-gray-300 rounded px-3 py-2" placeholder="iOS app URL" value={ios} onChange={(e)=> setIos(e.target.value)} />
        <input className="border border-gray-300 rounded px-3 py-2" placeholder="Web app URL" value={web} onChange={(e)=> setWeb(e.target.value)} />
      </div>
      {error && (<div className="p-3 border border-red-200 bg-red-50 rounded text-sm text-red-800">{error}</div>)}
      <div>
        <button onClick={save} className="px-3 py-2 rounded bg-blue-600 text-white">Save</button>
      </div>
    </div>
  );
}
