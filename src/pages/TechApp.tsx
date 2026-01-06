import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useData } from '../contexts/DataContext';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

export default function TechApp() {
  const { org } = useParams();
  const { user, login, logout } = useAuth();
  const { settings } = useSettings();
  const { listClients, listTechnicians, addTechnician, listActivities, addActivity, updateAsset, listAssets, listCategories, addAsset, addCategory } = useData() as any;
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const qpTech = params.get('tech') || '';
  const [techId, setTechId] = useState<string>('');
  const [techEmail, setTechEmail] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'scan' | 'assets' | 'history'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [modalAssetId, setModalAssetId] = useState<string | null>(null);
  const [modalNote, setModalNote] = useState<string>('');
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [view, setView] = useState<'grid'|'list'>('grid');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<{ name: string; asset_tag: string; status: string; image_url?: string; category_id?: string }>({ name: '', asset_tag: '', status: 'available', image_url: '', category_id: '' });

  useEffect(() => {
    (async ()=>{
      if (SUPABASE_CONFIGURED) {
        const { data: orgRow } = await supabase.from('organizations').select('id').eq('slug', org);
        const orgId = orgRow?.[0]?.id;
        const { data: techs } = await supabase.from('technicians').select('*').eq('org_id', orgId).order('full_name');
        const t = qpTech ? (techs||[]).find((x:any) => x.id === qpTech) : (techs||[])[0];
        if (t) {
          setTechId(t.id);
          setTechEmail(t.email || t.username || '');
          if (!user || user.role !== 'technician') {
            login({ id: `tech_${Date.now()}`, email: t.email || t.username || '', role: 'technician', name: t.full_name || t.username || 'Technician', technician_id: t.id });
          }
        }
        supabase.channel(`techapp_${orgId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'technicians', filter: `org_id=eq.${orgId}` }, async ()=>{
            const { data: techs } = await supabase.from('technicians').select('*').eq('org_id', orgId).order('full_name');
            const current = (techs||[]).find((x:any)=> x.id===techId) || (techs||[])[0];
            if (current) setTechEmail(current.email || current.username || '');
          })
          .subscribe();
      } else {
        let techs = listTechnicians();
        if (!techs || techs.length === 0) return;
        const t = qpTech ? techs.find((x) => x.id === qpTech) : techs[0];
        if (t) {
          setTechId(t.id);
          setTechEmail(t.email || t.username || '');
          if (!user || user.role !== 'technician') {
            login({ id: `tech_${Date.now()}`, email: t.email || t.username || '', role: 'technician', name: t.name, technician_id: t.id });
          }
        }
      }
    })();
  }, [qpTech, listTechnicians]);

  const activities = useMemo(() => listActivities().filter((a) => a.technician_id === (techId || qpTech)), [listActivities, techId, qpTech]);
  const clients = useMemo(() => listClients(), [listClients]);
  const categories = useMemo(() => listCategories(), [listCategories]);
  const assets = useMemo(() => listAssets(undefined), [listAssets]);
  const filteredAssets = useMemo(() => assets.filter((a: any) => (!categoryId || a.category_id === categoryId) && (!statusFilter || a.status === statusFilter) && ((a.name||'').toLowerCase().includes(query.toLowerCase()) || (a.asset_tag||'').toLowerCase().includes(query.toLowerCase()) || (a.description||'').toLowerCase().includes(query.toLowerCase()))), [assets, categoryId, statusFilter, query]);

  function fallbackImage(a: any) {
    const n = (a.name || '').toLowerCase();
    if (n.includes('laptop') || n.includes('macbook') || n.includes('dell')) return '/assets-samples/laptop.svg';
    if (n.includes('router') || n.includes('cisco')) return '/assets-samples/router.svg';
    if (n.includes('tablet') || n.includes('samsung')) return '/assets-samples/tablet.svg';
    if (n.includes('camera') || n.includes('flir')) return '/assets-samples/camera.svg';
    if (n.includes('printer') || n.includes('hp')) return '/assets-samples/printer.svg';
    return '';
  }

  function complete(aid: string, assetId?: string) {
    if (assetId) updateAsset(assetId, { status: 'available' });
  }

  function startScanning() {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      addActivity({ technician_id: techId || qpTech, client_id: activities[0]?.client_id, asset_id: activities[0]?.asset_id, type: 'scan', status: 'completed' });
    }, 3000);
  }

  function stopScanning() {
    setIsScanning(false);
  }

  function openAsset(id?: string) {
    if (!id) return;
    setModalAssetId(id);
  }
  function closeModal() {
    setModalAssetId(null);
    setModalNote('');
  }
  function setStatus(status: string) {
    if (!modalAssetId) return;
    updateAsset(modalAssetId, { status });
  }
  function reportIssue() {
    if (!modalAssetId) return;
    addActivity({ technician_id: techId || qpTech, client_id: activities[0]?.client_id, asset_id: modalAssetId, type: 'maintenance', status: 'open', notes: modalNote });
    closeModal();
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

  if (!techId && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-md mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold">Asset Tracker</h1>
            <p className="text-blue-100 mt-1">Select a client to start tracking</p>
          </div>
        </header>
        <main className="max-w-md mx-auto px-4 py-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="text-gray-600">No technician ID provided.</div>
            <div className="text-gray-500 text-sm mt-1">Open from your personal link or ask admin to send it.</div>
            <div className="mt-4">
              <Link className="px-4 py-2 bg-gray-900 text-white rounded-lg" to={`/${org}/tech`}>Open Download Page</Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Gradient Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg overflow-hidden flex items-center justify-center">
                {settings.branding.logo_url || '/branding/bez-logo.png' ? (
                  <img src={settings.branding.logo_url || '/branding/bez-logo.png'} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">AT</span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold">Asset Tracker</h1>
                <p className="text-blue-100 text-sm">{settings.orgProfile.name || org}</p>
              </div>
            </div>
            <div className="text-blue-100 text-sm">{user?.name || techEmail}</div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-[88px] z-10">
        <div className="max-w-md mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 py-4 text-center ${activeTab === 'scan' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              <div className="text-lg mb-1">🔍</div>
              <div className="text-xs font-medium">Scan</div>
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`flex-1 py-4 text-center ${activeTab === 'assets' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              <div className="text-lg mb-1">📦</div>
              <div className="text-xs font-medium">Assets</div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-4 text-center ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              <div className="text-lg mb-1">🕐</div>
              <div className="text-xs font-medium">History</div>
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-md mx-auto px-4 py-6 pb-24">
        {activeTab === 'scan' && (
          <div className="space-y-6">
            {!isScanning ? (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Start NFC Scanning</h3>
                  <p className="text-gray-600 text-sm mb-6">Hold your device near an NFC tag to scan assets</p>
                  <button
                    onClick={startScanning}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-medium shadow-lg active:scale-95 transition-transform"
                  >
                    Start NFC Scanning
                  </button>
                </div>

                <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                  <h4 className="font-medium text-blue-900 mb-2">How to Scan</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Tap the "Start NFC Scanning" button</li>
                    <li>2. Hold your device near the NFC tag</li>
                    <li>3. Wait for the confirmation beep/vibration</li>
                    <li>4. View asset details and update status</li>
                  </ol>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-3xl">🔍</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Scanning Active</h3>
                <p className="text-gray-600 text-sm mb-8">Hold device near tag...</p>
                <button
                  onClick={stopScanning}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-medium active:scale-95 transition-transform"
                >
                  Stop Scanning
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Assets</h2>
                <div className="text-xs text-gray-500">{filteredAssets.length} assets found</div>
              </div>
              <button onClick={()=>setShowAdd(true)} className="px-3 py-2 rounded bg-purple-600 text-white text-xs">+ Add Asset</button>
            </div>
            <div className="flex items-center space-x-2">
              <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search assets…" className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" />
              <select value={categoryId} onChange={(e)=>setCategoryId(e.target.value)} className="border border-gray-300 rounded px-2 py-2 text-sm">
                <option value="">All Categories</option>
                {categories.map((c:any)=> (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="border border-gray-300 rounded px-2 py-2 text-sm">
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="checked_out">Checked Out</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <div className="flex items-center border border-gray-300 rounded">
                <button onClick={()=>setView('grid')} className={`px-2 py-2 text-sm ${view==='grid'?'bg-gray-100':''}`}>⬛⬛</button>
                <button onClick={()=>setView('list')} className={`px-2 py-2 text-sm ${view==='list'?'bg-gray-100':''}`}>≡</button>
              </div>
            </div>
            {view==='grid' ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredAssets.map((asset:any)=> (
                  <div key={asset.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    {(() => { const src = asset.image_url || fallbackImage(asset); return src ? (<img src={src} alt="Asset" className="w-full h-24 object-cover rounded-lg border border-gray-200 mb-2" />) : null; })()}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                        <span>{(asset.name||'A').slice(0,1).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{asset.name}</div>
                        <div className="text-xs text-gray-600 truncate">{asset.asset_tag}</div>
                        <div className="mt-2 flex items-center space-x-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${asset.status==='available'?'bg-green-100 text-green-800':asset.status==='checked_out'?'bg-yellow-100 text-yellow-800':asset.status==='maintenance'?'bg-orange-100 text-orange-800':'bg-gray-100 text-gray-700'}`}>{asset.status}</span>
                          {asset.category_id && (<span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800">{categories.find((c:any)=>c.id===asset.category_id)?.name || '—'}</span>)}
                        </div>
                        <div className="mt-2 text-[11px] text-gray-600">
                          <div>📍 {asset.location_id || '—'}</div>
                          <div>📅 {new Date().toLocaleDateString()}</div>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <button onClick={()=>openAsset(asset.id)} className="text-xs text-blue-600">View</button>
                          <label className="text-xs text-gray-600 cursor-pointer">
                            Upload
                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e)=>{ const file=e.target.files?.[0]; if(!file) return; const r=new FileReader(); r.onload=async ()=>{ const base=String(r.result); const wm = await watermarkImage(base, `${new Date().toLocaleString()} • ${asset.asset_tag}`); updateAsset(asset.id, { image_url: wm }); }; r.readAsDataURL(file); }} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredAssets.length===0 && (
                  <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-600">No assets found</div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAssets.map((asset:any)=> (
                  <div key={asset.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{asset.name}</div>
                      <div className="text-xs text-gray-600 truncate">{asset.asset_tag}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${asset.status==='available'?'bg-green-100 text-green-800':asset.status==='checked_out'?'bg-yellow-100 text-yellow-800':asset.status==='maintenance'?'bg-orange-100 text-orange-800':'bg-gray-100 text-gray-700'}`}>{asset.status}</span>
                      <button onClick={()=>openAsset(asset.id)} className="text-xs text-blue-600">View</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showAdd && (
              <div className="fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/50" onClick={()=>setShowAdd(false)} />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-full max-w-md px-4 pb-4">
                  <div className="bg-white rounded-t-2xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
                    <div className="text-lg font-semibold">Add Asset</div>
                    <div className="grid grid-cols-1 gap-3 mt-3">
                      <input className="border border-gray-300 rounded px-3 py-2" placeholder="Asset Name" value={addForm.name} onChange={(e)=>setAddForm({...addForm, name:e.target.value})} />
                      <input className="border border-gray-300 rounded px-3 py-2" placeholder="Asset Tag" value={addForm.asset_tag} onChange={(e)=>setAddForm({...addForm, asset_tag:e.target.value})} />
                      <select className="border border-gray-300 rounded px-3 py-2" value={addForm.status} onChange={(e)=>setAddForm({...addForm, status: e.target.value})}>
                        <option value="available">Available</option>
                        <option value="checked_out">Checked Out</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                      <select className="border border-gray-300 rounded px-3 py-2" value={addForm.category_id} onChange={(e)=>setAddForm({...addForm, category_id: e.target.value})}>
                        <option value="">Select category</option>
                        {categories.map((c:any)=> (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                      <div className="border border-gray-300 rounded px-3 py-2 flex items-center space-x-2">
                        <input className="flex-1 outline-none" placeholder="New category" />
                        <button className="px-2 py-1 rounded bg-blue-600 text-white text-xs" onClick={()=>{ const name = (document.activeElement as HTMLInputElement)?.value || ''; if(!name) return; const cat = addCategory({ name }); setAddForm({ ...addForm, category_id: cat.id }); }}>Add</button>
                      </div>
                      <input type="file" accept="image/*" capture="environment" onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=async ()=>{ const base=String(r.result); const wm=await watermarkImage(base, `${new Date().toLocaleString()} • ${addForm.asset_tag||addForm.name}`); setAddForm({ ...addForm, image_url: wm }); }; r.readAsDataURL(f); }} />
                    </div>
                    <div className="mt-3 flex items-center space-x-2">
                      <button className="px-3 py-2 rounded bg-purple-600 text-white" onClick={()=>{ if(!addForm.name||!addForm.asset_tag) return; addAsset({ ...addForm }); setShowAdd(false); setAddForm({ name:'', asset_tag:'', status:'available', image_url:'', category_id:'' }); }}>Save</button>
                      <button className="px-3 py-2 rounded bg-gray-100 text-gray-700" onClick={()=>setShowAdd(false)}>Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Scan History</h2>
              <span className="text-sm text-gray-500">{activities.length} scans</span>
            </div>

            {activities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-xl border border-gray-200 p-4 active:scale-98 transition-transform">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📦</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900">Laptop Dell XPS 15</h3>
                    <p className="text-sm text-gray-600 mt-1">Office 3A</p>
                    <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
                      <span>🕐 Dec 23, 10:30 AM</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {activities.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-gray-400">🕐</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No scan history</h3>
                <p className="text-gray-600">Start scanning assets to see history here</p>
              </div>
            )}
          </div>
        )}
      </main>
      {modalAssetId && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-full max-w-md px-4 pb-4">
            <div className="bg-white rounded-t-2xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Asset Details</h3>
                <button onClick={closeModal} className="text-gray-600">✕</button>
              </div>
              {(() => {
                const asset = listAssets(undefined).find(a => a.id === modalAssetId);
                return asset ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">📦</div>
                      <div>
                        <div className="text-sm font-semibold">{asset.name}</div>
                        <div className="text-xs text-gray-600">ID: {asset.asset_tag}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm">Status</div>
                      <div className="mt-2 flex items-center space-x-2">
                        <button onClick={() => setStatus('active')} className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">active</button>
                        <button onClick={() => setStatus('inactive')} className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">inactive</button>
                        <button onClick={() => setStatus('maintenance')} className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">maint</button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">Location: {asset.location_id || '—'}</div>
                    <div className="text-xs text-gray-600">Last Scanned: {new Date().toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">NFC ID: {asset.id}</div>
                    <div className="mt-3">
                      <div className="text-sm">Report Issue</div>
                      <textarea value={modalNote} onChange={(e)=>setModalNote(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm" rows={3} placeholder="Describe the issue" />
                      <div className="mt-2 flex items-center space-x-2">
                        <button onClick={reportIssue} className="px-3 py-2 rounded bg-blue-600 text-white">Submit</button>
                        <button onClick={closeModal} className="px-3 py-2 rounded bg-gray-100 text-gray-700">Cancel</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600 mt-4">Asset not found</div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
