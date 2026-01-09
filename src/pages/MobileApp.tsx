import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { registerServiceWorker, subscribePush } from '../lib/push';
import { downloadPDF } from '../lib/pdf';
import { enqueue, getQueue, clearQueue } from '../lib/offlineQueue';

export default function MobileApp() {
  const { org } = useParams();
  const { settings } = useSettings();
  const { listClients, addClient, listAssets, addAsset, updateAsset, listActivities, addActivity, listJobs, addJob, updateJob, addLocation, listLocations, listCategories, addCategory } = useData() as any;
  const { user } = useAuth();
  const [tab, setTab] = useState<'dashboard'|'clients'|'assets'|'jobs'|'nfc'|'reports'>('dashboard');
  const maxW = 'max-w-[448px]';
  const [filterClientId, setFilterClientId] = useState<string>('');
  const [jobModalId, setJobModalId] = useState<string | null>(null);
  const [assetModalId, setAssetModalId] = useState<string | null>(null);

  const activities = useMemo(() => listActivities(), [listActivities]);
  const jobs = useMemo(() => listJobs(), [listJobs]);
  const assets = useMemo(() => listAssets(filterClientId || undefined), [listAssets, filterClientId]);
  const clients = useMemo(() => listClients(), [listClients]);
  const sites = useMemo(() => listLocations(filterClientId || undefined), [listLocations, filterClientId]);
  const categories = useMemo(() => listCategories(), [listCategories]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [batchQueue, setBatchQueue] = useState<string[]>([]);
  const [batchAction, setBatchAction] = useState<'check_in'|'check_out'|'maintenance'>('check_in');
  const [toast, setToast] = useState<string>('');
  const [editAssetId, setEditAssetId] = useState<string>('');
  const [assetEditId, setAssetEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; asset_tag: string; image_url?: string; category_id?: string }>({ name: '', asset_tag: '', image_url: '', category_id: '' });
  const [query, setQuery] = useState('');
  const [siteId, setSiteId] = useState<string>('');
  const [sigJobId, setSigJobId] = useState<string | null>(null);
  const [exec, setExec] = useState<Record<string, { before?: string; after?: string; parts: Array<{ name: string; qty: number }>; returnDate?: string }>>({});
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    registerServiceWorker().then(subscribePush).catch(()=>{});
    navigator.serviceWorker?.addEventListener('message', (e: any) => {
      if (e.data?.type === 'SYNC_QUEUE') processQueue();
    });
    window.addEventListener('online', () => processQueue());
    const params = new URLSearchParams(window.location.search);
    const scanTag = params.get('scan');
    if (scanTag) {
      const a = listAssets(undefined).find(x=>x.asset_tag===scanTag);
      if (a) {
        setFilterClientId(String(a.client_id || ''));
        setAssetModalId(a.id);
      }
    }
    setPendingCount(getQueue().length);
  }, []);

  function processQueue() {
    const q = getQueue();
    q.forEach((item) => {
      try {
        if (item.type === 'updateAsset') {
          const current = listAssets(undefined).find((a:any)=>a.id===item.payload.id);
          const prevStatus = current?.status;
          updateAsset(item.payload.id, item.payload.patch);
          if (prevStatus && item.payload.patch?.status && prevStatus !== item.payload.patch.status) {
            addActivity({ technician_id: 'system', client_id: current?.client_id, asset_id: item.payload.id, type: 'conflict', status: 'logged', notes: `Last-write-wins: queued status ${item.payload.patch.status} vs current ${prevStatus}` });
          }
        }
        if (item.type === 'addActivity') addActivity(item.payload);
        if (item.type === 'addJob') addJob(item.payload);
        if (item.type === 'updateJob') updateJob(item.payload.id, item.payload.patch);
      } catch {}
    });
    clearQueue();
    setPendingCount(0);
  }

  function commitUpdateAsset(id: string, patch: any) {
    if (!navigator.onLine) enqueue({ type: 'updateAsset', payload: { id, patch } });
    else updateAsset(id, patch);
  }

  function commitAddActivity(payload: any) {
    if (!navigator.onLine) enqueue({ type: 'addActivity', payload });
    else addActivity(payload);
    setToast('Maintenance recorded');
    setTimeout(() => setToast(''), 2000);
  }

  async function getGPS() {
    return new Promise<{ lat?: number; lng?: number }>((resolve) => {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve({}),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } catch {
        resolve({});
      }
    });
  }

  function watermarkImage(dataUrl: string, text: string) {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, img.height - 40, img.width, 40);
        ctx.fillStyle = '#fff'; ctx.font = '16px Arial';
        ctx.fillText(text, 10, img.height - 14);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.src = dataUrl;
    });
  }

  

  function exportCSV() {
    const filteredActs = activities.filter(a => !filterClientId || a.client_id === filterClientId);
    const rows = filteredActs.map(a => [a.created_at, a.type, a.status, a.asset_id || '', a.client_id || ''].join(','));
    const csv = ['time,type,status,asset_id,client_id', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${org}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const filteredActs = activities.filter(a => !filterClientId || a.client_id === filterClientId);
    const win = window.open('', '_blank');
    if (!win) return;
    const html = `
      <html><head><title>Report</title>
      <style>body{font-family:Arial;padding:24px} h1{font-size:20px} table{width:100%;border-collapse:collapse} td,th{border:1px solid #e5e7eb;padding:8px;font-size:12px}</style>
      </head><body>
      <h1>Daily Report - ${org}</h1>
      <p>Client: ${filterClientId || 'All'}</p>
      <table><thead><tr><th>Time</th><th>Type</th><th>Status</th><th>Asset</th><th>Client</th></tr></thead><tbody>
      ${filteredActs.map(a => `<tr><td>${a.created_at}</td><td>${a.type}</td><td>${a.status}</td><td>${a.asset_id||''}</td><td>${a.client_id||''}</td></tr>`).join('')}
      </tbody></table>
      </body></html>`;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  function defaultChecklistForJob(job: any, assetsAll: any[], categoriesAll: any[]) {
    const assetsInJob = assetsAll.filter(a => (job.asset_ids||[]).includes(a.id));
    const catNames = assetsInJob.map(a => categoriesAll.find((c:any)=>c.id===a.category_id)?.name || '').join(' ').toLowerCase();
    const items: string[] = [];
    if (catNames.includes('vehicle')) items.push('Check tire pressure', 'Check oil level', 'Inspect brakes');
    if (catNames.includes('it') || catNames.includes('electronics') || catNames.includes('networking')) items.push('Apply software updates', 'Verify antivirus', 'Check network connectivity');
    if (catNames.includes('hvac')) items.push('Clean filters', 'Check refrigerant', 'Test thermostat');
    if (items.length===0) items.push('General inspection', 'Clean exterior');
    return items.map((label, i)=> ({ id:`c_${i}`, label, done:false }));
  }

  function enableNotifications() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(()=>{});
    }
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') new Notification('Notifications enabled', { body: 'You will receive job alerts' });
    });
  }

  function notifyJob(title: string) {
    if (Notification.permission === 'granted') new Notification('New Job', { body: title });
  }

  function openJob(id: string) {
    setJobModalId(id);
    try {
      const job = jobs.find(j=>j.id===id);
      if (job && (!job.checklist || job.checklist.length===0)) {
        const cl = defaultChecklistForJob(job, assets, categories);
        updateJob(job.id, { checklist: cl });
      }
    } catch {}
  }
  function closeJob() {
    setJobModalId(null);
  }
  function openAssetModal(id: string) {
    setAssetModalId(id);
  }
  function closeAssetModal() {
    setAssetModalId(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10">
        <div className={`mx-auto ${maxW} px-6 pt-8 pb-6`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg overflow-hidden flex itemscenter justify-center">
              {settings.branding.logo_url ? (
                <img src={settings.branding.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs opacity-80">Logo</span>
              )}
            </div>
            <div>
              <div className="text-xl font-semibold">{settings.orgProfile.name || org}</div>
              <div className="text-xs text-blue-100 mt-1">Welcome, {user?.name || 'Technician'} — {(clients.find(c=>c.id===filterClientId)?.name) || (settings.orgProfile.name || org)}{siteId ? `, ${sites.find(s=>s.id===siteId)?.name || ''}` : ''}</div>
            </div>
            <div className="flex-1" />
            <div className="w-40">
              <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search" className="w-full px-3 py-2 rounded bg-white bg-opacity-10 text-white placeholder-blue-100 text-xs border border-white/20" />
            </div>
            <div className="ml-3">
              <button onClick={processQueue} className="px-3 py-2 rounded bg-white bg-opacity-10 text-white text-xs border border-white/20">
                Sync Pending {pendingCount>0 && <span className="ml-1 inline-block px-1.5 py-0.5 rounded bg-yellow-400 text-gray-900">{pendingCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </header>
      <nav className="bg-white border-b border-gray-200 sticky top-[96px] z-10">
        <div className={`mx-auto ${maxW} px-6 py-3 grid grid-cols-6 text-center text-xs font-medium`}>
          {(['dashboard','clients','assets','jobs','nfc','reports'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`${tab===t?'text-blue-600':'text-gray-600'}`}>{t[0].toUpperCase()+t.slice(1)}{tab===t&&<div className="mt-1 h-0.5 bg-blue-600" />}</button>
          ))}
        </div>
      </nav>
      <main className={`mx-auto ${maxW} px-6 pt-6 pb-24 space-y-6`}>
        {toast && (
          <div className="fixed top-[110px] left-1/2 -translate-x-1/2 z-20">
            <div className="px-3 py-2 rounded bg-blue-600 text-white text-sm shadow">{toast}</div>
          </div>
        )}
        {tab==='dashboard' && (
          <>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs text-gray-500">Today Scans</div>
                  <div className="text-xl font-semibold">{activities.filter(a=>a.type==='scan').length}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Jobs</div>
                  <div className="text-xl font-semibold">{jobs.filter(j=>j.status!=='completed').length}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Assets</div>
                  <div className="text-xl font-semibold">{assets.length}</div>
                </div>
              
              <div className="mt-3">
                <label className="text-xs text-gray-600">Active client</label>
                <select className="mt-1 border border-gray-300 rounded px-3 py-2 text-sm" value={filterClientId} onChange={e=>setFilterClientId(e.target.value)}>
                  <option value="">All clients</option>
                  {clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm font-semibold">Next Job</div>
              {(() => {
                const next = jobs.find(j=>j.status!=='completed');
                if (!next) return <div className="mt-2 text-sm text-gray-600">No jobs assigned</div>;
                const clientName = clients.find(c=>c.id===next.client_id)?.name || '—';
                const site = listLocations(undefined).find((s:any)=>s.id===next.location_id);
                return (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm">{next.title}</div>
                    <div className="text-xs text-gray-600">Client: {clientName}</div>
                    {site && (
                      <div className="text-xs text-gray-600">Site: {site.name}</div>
                    )}
                    {site?.address && (
                      <div className="text-xs"><a className="text-blue-600" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`} target="_blank" rel="noreferrer">{site.address}</a></div>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>openJob(next.id)}>Open Job</button>
                      <button className="px-3 py-2 rounded bg-gray-100 text-gray-700" onClick={()=>{ setFilterClientId(String(next.client_id||'')); setTab('assets'); }}>Go to Client</button>
                      {site && (<button className="px-3 py-2 rounded bg-gray-100 text-gray-700" onClick={()=>{ setFilterClientId(String(next.client_id||'')); setSiteId(String(next.location_id||'')); setTab('assets'); }}>Go to Site</button>)}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm font-semibold mb-3">Quick Actions</div>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-4 rounded-xl border border-gray-200 text-left active:scale-98" onClick={()=>setTab('assets')}>
                  <div className="text-lg">📦</div>
                  <div className="text-sm font-medium mt-1">Add Asset</div>
                  <div className="text-xs text-gray-600">Create asset and upload photo</div>
                </button>
                <button className="p-4 rounded-xl border border-gray-200 text-left active:scale-98" onClick={()=>setTab('nfc')}>
                  <div className="text-lg">🔍</div>
                  <div className="text-sm font-medium mt-1">Bind Tag</div>
                  <div className="text-xs text-gray-600">Write/scan tag to open asset</div>
                </button>
                <button className="p-4 rounded-xl border border-gray-200 text-left active:scale-98" onClick={()=>setTab('jobs')}>
                  <div className="text-lg">📝</div>
                  <div className="text-sm font-medium mt-1">View Jobs</div>
                  <div className="text-xs text-gray-600">Open assigned tasks</div>
                </button>
                <button className="p-4 rounded-xl border border-gray-200 text-left active:scale-98" onClick={()=>setTab('reports')}>
                  <div className="text-lg">📅</div>
                  <div className="text-sm font-medium mt-1">Export Day</div>
                  <div className="text-xs text-gray-600">CSV or PDF report</div>
                </button>
            </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm font-semibold mb-3">Getting Started</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <button className="p-4 rounded-xl border border-gray-200 active:scale-98" onClick={()=>setTab('assets')}>
                  <div className="text-lg">1️⃣</div>
                  <div className="text-xs mt-1">Add Asset</div>
                </button>
                <button className="p-4 rounded-xl border border-gray-200 active:scale-98" onClick={()=>setTab('nfc')}>
                  <div className="text-lg">2️⃣</div>
                  <div className="text-xs mt-1">Bind Tag</div>
                </button>
                <button className="p-4 rounded-xl border border-gray-200 active:scale-98" onClick={()=>setTab('nfc')}>
                  <div className="text-lg">3️⃣</div>
                  <div className="text-xs mt-1">Tap Tag</div>
                </button>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm font-semibold">Recent Activity</div>
              <div className="mt-3 space-y-2">
                {activities.slice(0,5).map(a => (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span>{a.type} • {a.asset_id || '—'}</span>
                    <span className="text-xs text-gray-500">{new Date(a.created_at||'').toLocaleTimeString()}</span>
                  </div>
                ))}
                {activities.length===0 && (<div className="text-sm text-gray-600">No activity yet</div>)}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm font-semibold">Maintenance</div>
              <div className="mt-3 space-y-2">
                {activities.filter(a=>a.type==='maintenance').slice(0,10).map(a=> (
                  <div key={a.id} className="flex items-center justify-between text-sm">
                    <span>{listAssets(undefined).find(x=>x.id===a.asset_id)?.name || a.asset_id}</span>
                    <span className="text-xs text-gray-500">{clients.find(c=>c.id===a.client_id)?.name || '—'}</span>
                  </div>
                ))}
                {activities.filter(a=>a.type==='maintenance').length===0 && (<div className="text-sm text-gray-600">No maintenance</div>)}
              </div>
            </div>
            
          </>
        )}

        {tab==='clients' && (
          <div className="space-y-4">
            {filterClientId && (() => {
              const c = clients.find(x=>x.id===filterClientId);
              if (!c) return null;
              return (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {c.logo_url ? (<img src={c.logo_url} alt="Logo" className="w-full h-full object-cover" />) : (<span className="text-[10px] text-gray-400">Logo</span>)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{c.name}</div>
                      <div className="text-xs text-blue-600 mt-1"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address || '')}`} target="_blank" rel="noreferrer">{c.address || 'Open in Maps'}</a></div>
                      <div className="text-xs text-gray-600 mt-1"><a href={`tel:${c.phone || ''}`}>{c.phone || 'Phone not set'}</a> • {c.email || ''}</div>
                      <div className="mt-2 flex items-center space-x-2">
                        <button className="px-3 py-2 rounded bg-blue-600 text-white text-xs" onClick={()=> setTab('assets')}>Open Assets</button>
                        <button className="px-3 py-2 rounded bg-gray-100 text-gray-700 text-xs" onClick={()=> { setFilterClientId(''); setSiteId(''); }}>Clear</button>
                      </div>
                      <div className="mt-4">
                        <div className="text-sm font-semibold">Sites</div>
                        <div className="mt-2 space-y-2">
                          {sites.map(s => (
                            <div key={s.id} className={`border border-gray-200 rounded p-3 text-sm flex items-center justify-between ${siteId===s.id?'bg-blue-50':''}`}>
                              <div>
                                <div className="font-medium">{s.name}</div>
                                <a className="text-xs text-blue-600" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address || '')}`} target="_blank" rel="noreferrer">{s.address || 'Open in Maps'}</a>
                              </div>
                              <div className="space-x-2">
                                <button className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800" onClick={()=> { setSiteId(s.id); setTab('assets'); }}>Select Site</button>
                              </div>
                            </div>
                          ))}
                          {sites.length===0 && <div className="text-xs text-gray-500">No sites</div>}
                        </div>
                        <AddSiteForm addLocation={addLocation} clientId={filterClientId} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            {clients.filter(c=> c.name.toLowerCase().includes(query.toLowerCase()) || (c.address||'').toLowerCase().includes(query.toLowerCase())).map(c => (
              <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="text-xs text-blue-600"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address || '')}`} target="_blank" rel="noreferrer">{c.address || 'Open in Maps'}</a></div>
                <div className="text-xs text-gray-600">{c.phone} • {c.email}</div>
                <div className="mt-2"><button className="px-3 py-2 rounded bg-blue-100 text-blue-800 text-xs" onClick={()=> setFilterClientId(c.id)}>Select Client</button></div>
              </div>
            ))}
          </div>
        )}

        {tab==='assets' && (
          <div className="space-y-4">
            <AddAssetForm addAsset={(a)=>addAsset({ ...a, org_id: org!, status:'available', client_id: filterClientId || undefined, location_id: siteId || undefined, category_id: categoryId || undefined })} categories={categories} onAddCategory={(name:string)=>{ const c = addCategory({ name }); setCategoryId(c.id); }} onSelectCategory={(id:string)=> setCategoryId(id)} />
            {assets.filter(a=> (!siteId || a.location_id===siteId) && (!categoryId || a.category_id===categoryId) && ((a.name||'').toLowerCase().includes(query.toLowerCase()) || (a.asset_tag||'').toLowerCase().includes(query.toLowerCase()))).map(asset => (
              <div key={asset.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{asset.name}</div>
                    <div className="text-xs text-gray-600">{asset.asset_tag}</div>
                    {asset.category_id && (<div className="text-xs text-gray-500">{categories.find(c=>c.id===asset.category_id)?.name}</div>)}
                  </div>
                  <div className="text-xs text-gray-600">{asset.status}</div>
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <button onClick={async ()=>{ const gps=await getGPS(); commitUpdateAsset(asset.id, { status: 'checked_out' }); commitAddActivity({ technician_id: user?.technician_id || 't1', client_id: filterClientId || undefined, asset_id: asset.id, type:'check_out', status:'completed', condition:'good', gps_lat:gps.lat, gps_lng:gps.lng }); }} className="px-2 py-1 rounded bg-gray-100 text-xs">Check-out</button>
                  <button onClick={async ()=>{ const gps=await getGPS(); commitUpdateAsset(asset.id, { status: 'available' }); commitAddActivity({ technician_id: user?.technician_id || 't1', client_id: filterClientId || undefined, asset_id: asset.id, type:'check_in', status:'completed', condition:'good', gps_lat:gps.lat, gps_lng:gps.lng }); }} className="px-2 py-1 rounded bg-gray-100 text-xs">Check-in</button>
                  <button onClick={async ()=>{ const gps=await getGPS(); commitUpdateAsset(asset.id, { status: 'maintenance' }); commitAddActivity({ technician_id: user?.technician_id || 't1', client_id: filterClientId || undefined, asset_id: asset.id, type:'maintenance', status:'open', gps_lat:gps.lat, gps_lng:gps.lng }); }} className="px-2 py-1 rounded bg-orange-100 text-orange-800 text-xs">Maintenance</button>
                  <button onClick={()=>{ setAssetEditId(asset.id); setEditForm({ name: asset.name, asset_tag: asset.asset_tag, image_url: asset.image_url || '', category_id: asset.category_id || '' }); }} className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs">Edit</button>
                </div>
                <div className="mt-2 flex items-center space-x-2 text-xs">
                  <span className="text-gray-500">Condition:</span>
                  {(['good','fair','poor'] as const).map(c => (
                    <button key={c} className={`px-2 py-1 rounded ${c==='good'?'bg-green-100 text-green-800':c==='fair'?'bg-yellow-100 text-yellow-800':'bg-red-100 text-red-800'}`} onClick={async ()=>{ const gps=await getGPS(); commitAddActivity({ technician_id: user?.technician_id || 't1', client_id: filterClientId || undefined, asset_id: asset.id, type:'condition', status:'logged', condition:c, gps_lat:gps.lat, gps_lng:gps.lng }); }}> {c} </button>
                  ))}
                </div>
                <div className="mt-3">
                  {asset.image_url ? (
                    <img src={asset.image_url} alt="Asset" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                  ) : (
                    <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500">Image placeholder</div>
                  )}
                  <div className="mt-2">
                    <label className="text-xs text-gray-600">Upload Image</label>
                    <input type="file" accept="image/*" className="mt-1 text-xs" onChange={(e)=>{
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const base = String(reader.result);
                        const wm = await watermarkImage(base, `${new Date().toLocaleString()} • ${asset.asset_tag}`);
                        commitUpdateAsset(asset.id, { image_url: wm });
                      };
                      reader.readAsDataURL(file);
                    }} />
                  </div>
                </div>
                
              </div>
            ))}
          </div>
        )}

        {tab==='jobs' && (
          <JobsTab jobs={jobs.filter(j=> (!filterClientId || j.client_id===filterClientId) && (!siteId || j.location_id===siteId))} addJob={(j)=>{ const job=addJob(j); return job; }} updateJob={updateJob} clients={clients} assets={assets} sites={sites} onOpenJob={openJob} onGoClient={(id)=>{ setFilterClientId(String(id||'')); setTab('assets'); }} onGoSite={(id)=>{ setSiteId(String(id||'')); setTab('assets'); }} />
        )}

        {tab==='nfc' && (
          <NFCTab assets={assets} updateAsset={commitUpdateAsset} onOpenAsset={openAssetModal} />
        )}

        {tab==='reports' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-sm font-semibold">Daily Report</div>
              <div className="mt-3">
                <label className="text-xs text-gray-600">Filter by client</label>
                <select className="mt-1 border border-gray-300 rounded px-3 py-2 text-sm" value={filterClientId} onChange={e=>setFilterClientId(e.target.value)}>
                  <option value="">All clients</option>
                  {clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <button onClick={exportCSV} className="px-3 py-2 rounded bg-blue-600 text-white">Export Excel (CSV)</button>
                <button onClick={exportPDF} className="px-3 py-2 rounded bg-gray-900 text-white">Export PDF</button>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className={`mx-auto ${maxW} px-6 py-2 grid grid-cols-4 gap-2 text-xs`}>
          <button className={`${tab==='dashboard'?'text-blue-600':'text-gray-700'}`} onClick={()=>setTab('dashboard')}>Home</button>
          <button className={`${tab==='assets'?'text-blue-600':'text-gray-700'}`} onClick={()=>setTab('assets')}>Assets</button>
          <button className={`${tab==='nfc'?'text-blue-600':'text-gray-700'}`} onClick={()=>setTab('nfc')}>NFC</button>
          <button className={`${tab==='jobs'?'text-blue-600':'text-gray-700'}`} onClick={()=>setTab('jobs')}>Jobs</button>
        </div>
      </footer>
      {jobModalId && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={closeJob} />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-full max-w-md px-4 pb-4">
            <div className="bg-white rounded-t-2xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
              {(() => {
                const job = jobs.find(j=>j.id===jobModalId);
                if (!job) return <div className="text-sm">Job not found</div>;
                const clientName = clients.find(c=>c.id===job.client_id)?.name || '—';
                const jobAssets = assets.filter(a=> (job.asset_ids||[]).includes(a.id));
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold">{job.title}</div>
                      <button onClick={closeJob} className="text-gray-600">✕</button>
                    </div>
                    <div className="text-xs text-gray-600">Client: {clientName}</div>
                    <div className="text-xs text-gray-600">Status: {job.status}</div>
                    <div className="text-sm font-medium mt-2">Checklist</div>
                    <div className="space-y-2">
                      {(job.checklist||[]).map(step => (
                        <div key={step.id} className="flex items-center justify-between">
                          <label className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={step.done} onChange={()=> updateJob(job.id, { checklist: (job.checklist||[]).map(s => s.id===step.id ? { ...s, done: !s.done } : s) })} />
                            <span>{step.label}</span>
                          </label>
                          <button className="text-xs px-2 py-1 rounded bg-gray-100" onClick={()=> updateJob(job.id, { checklist: (job.checklist||[]).filter(s => s.id !== step.id) })}>Remove</button>
                        </div>
                      ))}
                      {(job.checklist||[]).length===0 && <div className="text-xs text-gray-500">No steps</div>}
                      <div className="flex items-center space-x-2 mt-2">
                        <input id={`cnew_${job.id}`} className="border border-gray-300 rounded px-2 py-1 text-sm flex-1" placeholder="New item" />
                        <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs" onClick={()=>{ const el=document.getElementById(`cnew_${job.id}`) as HTMLInputElement; const label=(el?.value||'').trim(); if(!label) return; updateJob(job.id, { checklist: [ ...(job.checklist||[]), { id:`c_${Date.now()}`, label, done:false } ] }); el.value=''; }}>Add</button>
                      </div>
                    </div>
                    <div className="text-sm font-medium mt-2">Notes</div>
                    <textarea className="w-full border border-gray-300 rounded p-2 text-sm" rows={3} value={job.notes || ''} onChange={(e)=> updateJob(job.id, { notes: e.target.value })} />
                    <div className="text-sm font-medium mt-2">Before & After Photos</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Before</div>
                        <input type="file" accept="image/*" capture="environment" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=async ()=> { const base=String(r.result); const wm = await watermarkImage(base, `BEFORE • ${job.title} • ${new Date().toLocaleString()}`); setExec(prev=> ({ ...prev, [job.id]: { ...(prev[job.id]||{ parts:[] }), before: wm } })); updateJob(job.id, { attachments: [ ...(job.attachments||[]), wm ] }); }; r.readAsDataURL(f); }} />
                        {exec[job.id]?.before && (<img src={exec[job.id]?.before} alt="" className="mt-1 w-full h-20 object-cover rounded border border-gray-200" />)}
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">After</div>
                        <input type="file" accept="image/*" capture="environment" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=async ()=> { const base=String(r.result); const wm = await watermarkImage(base, `AFTER • ${job.title} • ${new Date().toLocaleString()}`); setExec(prev=> ({ ...prev, [job.id]: { ...(prev[job.id]||{ parts:[] }), after: wm } })); updateJob(job.id, { attachments: [ ...(job.attachments||[]), wm ] }); }; r.readAsDataURL(f); }} />
                        {exec[job.id]?.after && (<img src={exec[job.id]?.after} alt="" className="mt-1 w-full h-20 object-cover rounded border border-gray-200" />)}
                      </div>
                    </div>

                    <div className="text-sm font-medium mt-2">Parts Used</div>
                    <div className="flex items-center space-x-2">
                      <input className="border border-gray-300 rounded px-2 py-1 text-sm flex-1" placeholder="Part name" id={`pname_${job.id}`} />
                      <input className="border border-gray-300 rounded px-2 py-1 text-sm w-16" placeholder="Qty" type="number" id={`pqty_${job.id}`} />
                      <input className="border border-gray-300 rounded px-2 py-1 text-sm w-24" placeholder="Unit cost" type="number" step="0.01" id={`pcost_${job.id}`} />
                      <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs" onClick={()=>{ const name = (document.getElementById(`pname_${job.id}`) as HTMLInputElement)?.value || ''; const qty = Number((document.getElementById(`pqty_${job.id}`) as HTMLInputElement)?.value || '1'); const unit_cost = Number((document.getElementById(`pcost_${job.id}`) as HTMLInputElement)?.value || '0'); if(!name) return; updateJob(job.id, { parts: [ ...(job.parts||[]), { name, qty, unit_cost } ] }); (document.getElementById(`pname_${job.id}`) as HTMLInputElement).value=''; (document.getElementById(`pqty_${job.id}`) as HTMLInputElement).value=''; (document.getElementById(`pcost_${job.id}`) as HTMLInputElement).value=''; }}>Add</button>
                    </div>
                    <div className="text-xs text-gray-600">
                      {(job.parts||[]).map((p:any,i:number)=> (<div key={i}>• {p.qty}× {p.name}{typeof p.unit_cost==='number' ? ` @ ${p.unit_cost.toFixed(2)}` : ''}</div>))}
                      {(job.parts||[]).length===0 && (<div>No parts logged</div>)}
                    </div>

                    

                    <div className="text-sm font-medium mt-2">Next Service Date</div>
                    <input type="date" className="border border-gray-300 rounded px-3 py-2 text-sm" value={(job.next_service_at||'').slice(0,10)} onChange={(e)=>{ const d=e.target.value; updateJob(job.id, { next_service_at: d }); const firstAsset = jobAssets[0]; if(firstAsset) commitUpdateAsset(firstAsset.id, { next_service_at: d }); }} />

                    <div className="mt-2">
                      <button className="px-3 py-2 rounded bg-gray-900 text-white text-xs" onClick={async ()=>{ const paragraphs = [ `Client: ${clientName}`, `Parts: ${(job.parts||[]).map((p:any)=> `${p.qty}× ${p.name}`).join(', ') || 'None'}` ]; const images = [ exec[job.id]?.before, exec[job.id]?.after, ...(job.attachments||[]) ].filter(Boolean) as string[]; await downloadPDF(`certificate_${job.title}.pdf`, { title: 'Certificate of Maintenance', subtitle: new Date().toLocaleString(), paragraphs, images, headerFields: [ {label:'Job', value: job.title}, {label:'Status', value: job.status}, {label:'Next Service', value: job.next_service_at || '—'} ], pageFooter: 'BezAssetTracker • Proof of service' }); }}>Download Certificate</button>
                    </div>
                    <div className="text-sm font-medium mt-2">Assets</div>
                    <div className="space-y-2">
                      {jobAssets.map(a=> (
                        <div key={a.id} className="border border-gray-200 rounded p-2 text-sm flex items-center justify-between">
                          <span>{a.name}</span>
                          <div className="space-x-2">
                            <button className="text-xs px-2 py-1 rounded bg-gray-100" onClick={()=>commitUpdateAsset(a.id, { status: 'checked_out' })}>Check-out</button>
                            <button className="text-xs px-2 py-1 rounded bg-gray-100" onClick={()=>commitUpdateAsset(a.id, { status: 'available' })}>Check-in</button>
                            <button className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800" onClick={()=>commitAddActivity({ technician_id: user?.technician_id || 't1', client_id: job.client_id, asset_id: a.id, type:'maintenance', status:'open' })}>Maintenance</button>
                          </div>
                        </div>
                      ))}
                      {jobAssets.length===0 && <div className="text-xs text-gray-500">No assets attached</div>}
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      {job.status!=='in_progress' && (<button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>{ updateJob(job.id, { status: 'in_progress' }); jobAssets.forEach(a=> commitUpdateAsset(a.id, { status: 'maintenance' })); }}>Start</button>)}
                      {job.status!=='completed' && (<button className="px-3 py-2 rounded bg-gray-100" onClick={()=>{ const hasBefore = !!exec[job.id]?.before; const hasAfter = !!exec[job.id]?.after; const allDone = (job.checklist||[]).every((s:any)=> s.done); const hasSignature = (job.attachments||[]).some((a:string)=> a.startsWith('data:image/png')); const hasNextService = !!job.next_service_at; if(!hasBefore || !hasAfter){ alert('Capture both BEFORE and AFTER photos'); return; } if(!allDone){ alert('Complete all checklist items'); return; } if(!hasSignature){ alert('Capture client signature'); return; } if(!hasNextService){ alert('Set Next Service Date'); return; } updateJob(job.id, { status: 'completed' }); closeJob(); }}>Complete</button>)}
                      <button className="px-3 py-2 rounded bg-orange-100 text-orange-800" onClick={()=>{ updateJob(job.id, { needs_approval: true }); alert('Approval requested'); }}>Request Approval</button>
                      <button className="px-3 py-2 rounded bg-gray-100" onClick={()=> setSigJobId(job.id)}>Capture Signature</button>
                      <button className="px-3 py-2 rounded bg-gray-100" onClick={()=>{ setFilterClientId(String(job.client_id||'')); setTab('assets'); closeJob(); }}>Go to Client</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {assetEditId && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setAssetEditId(null)} />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-full max-w-md px-4 pb-4">
            <div className="bg-white rounded-t-2xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
              {(() => {
                const a = assets.find(x=>x.id===assetEditId);
                if (!a) return <div className="text-sm">Asset not found</div>;
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold">Edit Asset</div>
                      <button onClick={()=>setAssetEditId(null)} className="text-gray-600">✕</button>
                    </div>
                    <div className="text-sm font-medium">Name</div>
                    <input className="border border-gray-300 rounded px-3 py-2 w-full" value={editForm.name} onChange={(e)=>setEditForm({ ...editForm, name: e.target.value })} />
                    <div className="text-sm font-medium">Asset Tag</div>
                    <input className="border border-gray-300 rounded px-3 py-2 w-full" value={editForm.asset_tag} onChange={(e)=>setEditForm({ ...editForm, asset_tag: e.target.value })} />
                    <div className="text-sm font-medium">Category</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select className="border border-gray-300 rounded px-3 py-2 w-full" value={editForm.category_id} onChange={(e)=>setEditForm({ ...editForm, category_id: e.target.value })}>
                        <option value="">Select category</option>
                        {categories.map((c:any)=> <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <div className="border border-gray-300 rounded px-3 py-2 flex items-center space-x-2">
                        <input className="flex-1 outline-none" placeholder="New category" onChange={(e)=>setEditForm({ ...editForm, category_id: e.target.value ? editForm.category_id : editForm.category_id })} />
                        <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs" onClick={()=>{ const name = (document.activeElement as HTMLInputElement)?.value || ''; if(!name) return; const cat = addCategory({ name }); setEditForm({ ...editForm, category_id: cat.id }); }}>Add</button>
                      </div>
                    </div>
                    <div className="text-sm font-medium">Image</div>
                    <input type="file" accept="image/*" onChange={(e)=>{ const file=e.target.files?.[0]; if(!file) return; const r=new FileReader(); r.onload=async ()=> { const base = String(r.result); const txt = `${new Date().toLocaleString()} • ${editForm.asset_tag || editForm.name}`; const wm = await watermarkImage(base, txt); setEditForm({ ...editForm, image_url: wm }); }; r.readAsDataURL(file); }} />
                    <div className="mt-2 flex items-center space-x-2">
                      <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>{ commitUpdateAsset(a.id, { name: editForm.name, asset_tag: editForm.asset_tag, image_url: editForm.image_url, category_id: editForm.category_id }); setAssetEditId(null); }}>Save</button>
                      <button className="px-3 py-2 rounded bg-gray-100 text-gray-700" onClick={()=>setAssetEditId(null)}>Cancel</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {sigJobId && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setSigJobId(null)} />
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-full max-w-md px-4">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="text-sm font-semibold mb-2">Client Signature</div>
              <SignaturePad onSave={(img)=>{ const j = jobs.find(x=>x.id===sigJobId); if(!j) return; updateJob(j.id, { attachments: [ ...(j.attachments||[]), img ] }); setSigJobId(null); }} onCancel={()=>setSigJobId(null)} />
            </div>
          </div>
        </div>
      )}
      {assetModalId && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={closeAssetModal} />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-full max-w-md px-4 pb-4">
            <div className="bg-white rounded-t-2xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
              {(() => {
                const a = assets.find(x=>x.id===assetModalId);
                if (!a) return <div className="text-sm">Asset not found</div>;
                const timeline = activities.filter(act=>act.asset_id===a.id).sort((x,y)=> (new Date(y.created_at||'').getTime()) - (new Date(x.created_at||'').getTime()));
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold">{a.name}</div>
                      <button onClick={closeAssetModal} className="text-gray-600">✕</button>
                    </div>
                    <div className="text-xs text-gray-600">Tag: {a.asset_tag}</div>
                    <div className="text-xs text-gray-600">Status: {a.status}</div>
                     <div className="flex items-center space-x-2 mt-2">
                       <button className="px-3 py-2 rounded bg-gray-100" onClick={()=>commitUpdateAsset(a.id, { status: 'checked_out' })}>Check-out</button>
                       <button className="px-3 py-2 rounded bg-gray-100" onClick={()=>commitUpdateAsset(a.id, { status: 'available' })}>Check-in</button>
                       <button className="px-3 py-2 rounded bg-orange-100 text-orange-800" onClick={()=>commitAddActivity({ technician_id: user?.technician_id || 't1', client_id: filterClientId || undefined, asset_id: a.id, type:'maintenance', status:'open' })}>Maintenance</button>
                     </div>
                    <div className="mt-2 flex items-center space-x-2 text-xs">
                      <span className="text-gray-500">Condition:</span>
                      {(['good','fair','poor'] as const).map(c => (
                        <button key={c} className={`px-2 py-1 rounded ${c==='good'?'bg-green-100 text-green-800':c==='fair'?'bg-yellow-100 text-yellow-800':'bg-red-100 text-red-800'}`} onClick={async ()=>{ const gps=await getGPS(); commitAddActivity({ technician_id: user?.technician_id || 't1', client_id: filterClientId || undefined, asset_id: a.id, type:'condition', status:'logged', condition:c, gps_lat:gps.lat, gps_lng:gps.lng }); }}> {c} </button>
                      ))}
                    </div>
                    <div className="mt-4">
                      <div className="text-sm font-semibold">Timeline</div>
                      <div className="mt-2 space-y-2">
                        {timeline.map(t=> (
                          <div key={t.id} className="border border-gray-200 rounded p-2 text-xs flex items-center justify-between">
                            <div>
                              <div className="font-medium">{t.type} • {t.status}</div>
                              <div className="text-gray-600">{new Date(t.created_at||'').toLocaleString()}</div>
                              {t.condition && (<div className="text-gray-600">Condition: {t.condition}</div>)}
                              {(t.gps_lat && t.gps_lng) && (<div className="text-gray-600">GPS: {t.gps_lat?.toFixed(5)}, {t.gps_lng?.toFixed(5)}</div>)}
                            </div>
                          </div>
                        ))}
                        {timeline.length===0 && <div className="text-xs text-gray-500">No history yet</div>}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SignaturePad({ onSave, onCancel }: { onSave: (img:string)=>void; onCancel: ()=>void }) {
  const canvasRef = React.useRef<HTMLCanvasElement|null>(null);
  React.useEffect(()=>{
    const canvas = canvasRef.current!; const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.lineWidth = 2; ctx.strokeStyle = '#111';
    let drawing=false;
    function pos(e: any) { const rect = canvas.getBoundingClientRect(); const x = (e.touches? e.touches[0].clientX : e.clientX) - rect.left; const y = (e.touches? e.touches[0].clientY : e.clientY) - rect.top; return { x, y }; }
    function down(e:any){ drawing=true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
    function move(e:any){ if(!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }
    function up(){ drawing=false; }
    canvas.addEventListener('mousedown', down); canvas.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); down(e); }); canvas.addEventListener('touchmove', (e)=>{ e.preventDefault(); move(e); }); window.addEventListener('touchend', up);
    return ()=>{ canvas.removeEventListener('mousedown', down); canvas.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);
  return (
    <div>
      <canvas ref={canvasRef} width={320} height={160} className="border border-gray-300 rounded w-full" />
      <div className="mt-2 flex items-center space-x-2">
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>{ const img = canvasRef.current!.toDataURL('image/png'); onSave(img); }}>Save</button>
        <button className="px-3 py-2 rounded bg-gray-100 text-gray-700" onClick={()=>{ const ctx = canvasRef.current!.getContext('2d')!; ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvasRef.current!.width, canvasRef.current!.height); }}>Clear</button>
        <button className="px-3 py-2 rounded bg-gray-100 text-gray-700" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function NfcTapHelper({ assets, assetId, onOpenAsset }: { assets: any[]; assetId: string; onOpenAsset: (id: string)=>void }) {
  const a = assets.find(x=>x.id===assetId);
  if (!a) return null as any;
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const org = window.location.pathname.split('/')[1] || 'demo-org';
  const tapUrl = `${base}/${org}/tech/mobile?scan=${encodeURIComponent(a.asset_tag || '')}`;
  return (
    <div className="mt-3 text-xs">
      <div className="text-gray-600">Tap URL (write this as NFC URL record):</div>
      <div className="mt-1 break-all p-2 border border-gray-200 rounded bg-gray-50">{tapUrl}</div>
      <div className="mt-2 flex items-center space-x-2">
        <button className="px-3 py-2 rounded bg-gray-900 text-white" onClick={()=>{ navigator.clipboard?.writeText(tapUrl); }}>Copy</button>
        <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>onOpenAsset(a.id)}>Simulate Tap</button>
      </div>
    </div>
  );
}


// removed AddClientForm: client creation is restricted to admins/clients

function AddSiteForm({ addLocation, clientId }: { addLocation: (l: any) => any; clientId: string }) {
  const [f, setF] = useState({ name:'', address:'' });
  return (
    <div className="mt-3 bg-white border border-gray-200 rounded p-3">
      <div className="text-xs font-semibold mb-2">Add Site</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input className="border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Site name" value={f.name} onChange={(e)=>setF({ ...f, name: e.target.value })} />
        <input className="border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Address" value={f.address} onChange={(e)=>setF({ ...f, address: e.target.value })} />
      </div>
      <button className="mt-2 px-3 py-2 rounded bg-blue-600 text-white text-xs" onClick={()=>{ if(!f.name) return; addLocation({ client_id: clientId, name: f.name, address: f.address }); setF({ name:'', address:'' }); }}>Save Site</button>
    </div>
  );
}

function AddAssetForm({ addAsset, categories, onAddCategory, onSelectCategory }: { addAsset: (a: any) => any; categories: any[]; onAddCategory: (name: string)=>void; onSelectCategory: (id: string)=>void }) {
  const [f, setF] = useState({ name:'', asset_tag:'', image_url:'', category_id:'' });
  const [newCat, setNewCat] = useState('');
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  function onDropFile(file?: File) {
    if (!file) return;
    const r = new FileReader();
    r.onload = async () => { const base = String(r.result); const txt = `${new Date().toLocaleString()} • ${f.asset_tag || f.name}`; const wm = await watermarkImage(base, txt); setF({ ...f, image_url: wm }); setFileName(file.name); };
    r.readAsDataURL(file);
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-sm font-semibold mb-3">Add Asset</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600">Name</label>
          <input className="mt-1 border border-gray-300 rounded px-3 py-2 w-full" value={f.name} onChange={e=>setF({...f, name:e.target.value})} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Asset Tag</label>
          <input className="mt-1 border border-gray-300 rounded px-3 py-2 w-full" value={f.asset_tag} onChange={e=>setF({...f, asset_tag:e.target.value})} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Category</label>
          <div className="mt-1 flex items-center space-x-2">
            <select className="border border-gray-300 rounded px-3 py-2 w-full" value={f.category_id} onChange={(e)=>{ setF({...f, category_id: e.target.value}); onSelectCategory(e.target.value); }}>
              <option value="">Select category</option>
              {categories.map((c:any)=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="px-3 py-2 rounded bg-gray-100 text-gray-700 text-xs" onClick={()=>{ if(!newCat) return; const c = onAddCategory(newCat) as any; setNewCat(''); if(c?.id) { setF({...f, category_id: c.id}); onSelectCategory(c.id); } }}>Create</button>
          </div>
          <input className="mt-2 border border-gray-300 rounded px-3 py-2 w-full text-xs" placeholder="New category" value={newCat} onChange={e=>setNewCat(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-600">Upload file</label>
          <div
            className={`mt-1 border-2 border-dashed rounded px-4 py-6 text-center ${dragging?'border-blue-400 bg-blue-50':'border-gray-300'}`}
            onDragOver={e=>{ e.preventDefault(); setDragging(true); }}
            onDragLeave={()=>setDragging(false)}
            onDrop={e=>{ e.preventDefault(); setDragging(false); const file=e.dataTransfer.files?.[0]; onDropFile(file); }}
          >
            <div className="text-xs text-gray-600">Drag and drop or click to upload</div>
            <input type="file" accept="image/*" className="mt-2 text-xs" onChange={(e)=> onDropFile(e.target.files?.[0]||undefined)} />
            {fileName && (<div className="mt-2 text-xs text-gray-600">{fileName}</div>)}
            {f.image_url && (<img src={f.image_url} alt="Preview" className="mt-3 w-full h-24 object-cover rounded" />)}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <button className="text-xs text-gray-600" onClick={()=>{ setF({ name:'', asset_tag:'', image_url:'', category_id:'' }); setNewCat(''); setFileName(''); }}>Cancel</button>
        <button className="px-3 py-2 rounded bg-blue-600 text-white w-32" onClick={()=>{ if(!f.name||!f.asset_tag||!f.image_url||!f.category_id) return; addAsset(f); setF({ name:'', asset_tag:'', image_url:'', category_id:'' }); setNewCat(''); setFileName(''); }}>Save asset</button>
      </div>
    </div>
  );
}

function JobsTab({ jobs, addJob, updateJob, clients, assets, sites, onOpenJob, onGoClient, onGoSite }: { jobs: any[]; addJob: any; updateJob: any; clients: any[]; assets: any[]; sites: any[]; onOpenJob: (id: string)=>void; onGoClient: (id: string)=>void; onGoSite: (id: string)=>void }) {
  const [f, setF] = useState({ title:'', client_id:'', location_id:'', asset_ids:[] as string[] });
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="text-sm font-semibold mb-2">Create Job</div>
        <input className="border border-gray-300 rounded px-3 py-2 w-full mb-2" placeholder="Title" value={f.title} onChange={e=>setF({...f, title:e.target.value})} />
        <select className="border border-gray-300 rounded px-3 py-2 w-full mb-2" value={f.client_id} onChange={e=>setF({...f, client_id:e.target.value, location_id:''})}>
          <option value="">Select client</option>
          {clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="border border-gray-300 rounded px-3 py-2 w-full mb-2" value={f.location_id} onChange={e=>setF({...f, location_id:e.target.value})}>
          <option value="">Select site</option>
          {sites.filter(s=> !f.client_id || s.client_id===f.client_id).map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="text-xs text-gray-600 mb-2">Assets</div>
        {f.client_id ? (
          <div className="grid grid-cols-2 gap-2">
            {assets.filter(a=> a.client_id===f.client_id && (!f.location_id || a.location_id===f.location_id)).map(a=> (
              <label key={a.id} className="text-xs flex items-center space-x-2">
                <input type="checkbox" checked={f.asset_ids.includes(a.id)} onChange={e=> setF({...f, asset_ids: e.target.checked ? [...f.asset_ids, a.id] : f.asset_ids.filter(x=>x!==a.id) })} />
                <span>{a.name}</span>
              </label>
            ))}
            {assets.filter(a=> a.client_id===f.client_id && (!f.location_id || a.location_id===f.location_id)).length===0 && (
              <div className="text-xs text-gray-500">No assets for selected client/site</div>
            )}
          </div>
        ) : (
          <div className="text-xs text-gray-500">Select a client to view assets</div>
        )}
        <button className="mt-3 px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>{ if(!f.title) return; const j = addJob({ title:f.title, client_id:f.client_id, location_id:f.location_id, asset_ids:f.asset_ids }); setF({ title:'', client_id:'', location_id:'', asset_ids:[] }); if ('Notification' in window) { try { Notification.permission==='granted' ? new Notification('New Job', { body: j.title }) : null; } catch {} } }}>Save</button>
        <button className="mt-3 ml-2 px-3 py-2 rounded bg-gray-100 text-gray-700" onClick={()=>{ if ('Notification' in window) { Notification.requestPermission(); } }}>Enable Notifications</button>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="text-sm font-semibold mb-2">Jobs</div>
        <div className="space-y-2">
          {jobs.map(j=> (
            <div key={j.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{j.title}</span>
              <div className="flex items-center space-x-2">
                <button className="text-xs px-2 py-1 rounded bg-blue-600 text-white" onClick={()=>onOpenJob(j.id)}>Open</button>
                <button className="text-xs px-2 py-1 rounded bg-gray-100" onClick={()=>onGoClient(String(j.client_id||''))}>Go to Client</button>
                <button className="text-xs px-2 py-1 rounded bg-gray-100" onClick={()=>onGoSite(String(j.location_id||''))}>Go to Site</button>
                {j.status!=='completed' && (<button className="text-xs px-2 py-1 rounded bg-gray-100" onClick={()=>updateJob(j.id, { status: 'completed' })}>Complete</button>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NFCTab({ assets, updateAsset, onOpenAsset }: { assets: any[]; updateAsset: any; onOpenAsset: (id: string)=>void }) {
  const [tag, setTag] = useState('');
  const [assetId, setAssetId] = useState('');
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="text-sm font-semibold mb-2">Write Tag</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="border border-gray-300 rounded px-3 py-2" placeholder="Tag text" value={tag} onChange={e=>setTag(e.target.value)} />
          <select className="border border-gray-300 rounded px-3 py-2" value={assetId} onChange={e=>setAssetId(e.target.value)}>
            <option value="">Select asset</option>
            {assets.map(a=> <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <button className="mt-3 px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>{ if(!assetId) return; updateAsset(assetId, { asset_tag: tag }); alert('Tag stored (demo). Program NFC with the Tap URL below for instant open.'); }}>Write</button>
        <button className="mt-3 ml-2 px-3 py-2 rounded bg-blue-600 text-white" onClick={async ()=>{ try { if (!('NDEFReader' in window)) { alert('Web NFC not supported'); return; } const a = assets.find(x=>x.id===assetId); if (!a) { alert('Select asset'); return; } const org = window.location.pathname.split('/')[1] || 'demo-org'; const tapUrl = `${window.location.origin}/${org}/tech/mobile?scan=${encodeURIComponent(a.asset_tag || tag)}`; const ndef = new (window as any).NDEFReader(); await ndef.write({ records: [{ recordType: 'url', data: tapUrl }] }); alert('NFC tag written'); } catch { alert('Failed to write NFC'); } }}>Write to NFC (Web)</button>
        {assetId && (
          <NfcTapHelper assets={assets} assetId={assetId} onOpenAsset={(id)=>{ const a=assets.find(x=>x.id===id); if(a) setTag(a.asset_tag||''); setAssetId(id); setTimeout(()=>{},0); }} />
        )}
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="text-sm font-semibold mb-2">Read Tag</div>
        <input className="border border-gray-300 rounded px-3 py-2 w-full" placeholder="Enter tag to lookup" value={tag} onChange={e=>setTag(e.target.value)} />
        <div className="mt-2 text-sm text-gray-600">{(() => { const a = assets.find(x=>x.asset_tag===tag); return a ? (<div className="flex items-center justify-between"><span>Found: {a.name}</span><button className="text-xs px-2 py-1 rounded bg-blue-600 text-white" onClick={()=>onOpenAsset(a.id)}>Open</button></div>) : 'No asset'; })()}</div>
        <div className="mt-3">
          <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={async ()=>{ try { if (!('NDEFReader' in window)) { alert('Web NFC not supported'); return; } const ndef = new (window as any).NDEFReader(); await ndef.scan(); ndef.onreading = async (evt: any) => { let url=''; for(const r of evt.message.records){ if(r.recordType==='url'){ try{ url = r.data; }catch{} } } if(url){ let scan=''; try{ const u=new URL(url); scan=u.searchParams.get('scan')||''; }catch{} const found = assets.find(x=>x.asset_tag===scan) || assets.find(x=>x.asset_tag===url); if(found){ const gps = await getGPS(); commitAddActivity({ technician_id: user?.technician_id || 't1', client_id: filterClientId || undefined, asset_id: found.id, type:'scan', status:'completed', gps_lat: gps.lat, gps_lng: gps.lng }); (window as any).openAssetModal?.(found.id); } } }; alert('Hold device near tag…'); } catch { alert('Failed to start NFC scan'); } }}>Start NFC Scan (Web)</button>
        </div>
      </div>
    </div>
  );
}
