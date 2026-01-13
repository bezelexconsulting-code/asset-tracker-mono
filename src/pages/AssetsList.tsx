import { useEffect, useState } from 'react';
import { SUPABASE_CONFIGURED, supabase } from '../lib/supabase';
import { useData } from '../contexts/DataContext';
import { Link, useParams } from 'react-router-dom';
import AssetImageUploader from '../components/AssetImageUploader';
import { PlusIcon, MagnifyingGlassIcon, Squares2X2Icon, ListBulletIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Asset {
  id: string;
  asset_tag: string;
  name: string;
  status: string;
  image_url?: string;
  client_id?: string;
  location_id?: string;
  category_id?: string;
  description?: string;
}

interface ClientOpt {
  id: string;
  name: string;
}

export default function AssetsList() {
  const { org } = useParams();
  const { listClients, listAssets, addAsset, listLocations, listCategories, addCategory, listActivities, addActivity, updateAsset } = useData() as any;
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<ClientOpt[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<{ asset_tag: string; name: string; client_id: string; location_id?: string; category_id?: string; category_name?: string; description?: string; image_url?: string }>({ asset_tag: '', name: '', client_id: '', location_id: '', category_id: '', category_name: '', description: '', image_url: '' } as any);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [timelineAssetId, setTimelineAssetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  function loadDemo() {
    try { const loader = (window as any).bezDemoLoader; if (typeof loader === 'function') loader(); setAssets(listAssets(selectedClient || undefined)); setCategories(listCategories()); } catch {}
  }
  async function watermarkImage(dataUrl: string, text: string) {
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (SUPABASE_CONFIGURED) {
        const { data: as } = await supabase.rpc('get_assets_by_slug', { p_slug: org });
        const { data: cats } = await supabase.rpc('get_categories_by_slug', { p_slug: org });
        const { data: cls } = await supabase.rpc('get_clients_by_slug', { p_slug: org });
        setAssets(((as||[]) as any));
        setCategories((cats||[]) as any);
        setClients(((cls||[]) as any));
      } else {
        const cls = listClients();
        setClients(cls);
        const as = listAssets(selectedClient || undefined);
        setAssets(as);
        setCategories(listCategories());
      }
      setLoading(false);
    })();
  }, [org, selectedClient, listClients, listAssets, listCategories]);

  const filteredAssets = assets.filter(a => {
    const matchesSearch = searchQuery === '' || 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.asset_tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesClient = !selectedClient || a.client_id === selectedClient;
    const matchesSite = !selectedSite || a.location_id === selectedSite;
    const matchesCategory = !selectedCategory || a.category_id === selectedCategory;
    
    return matchesSearch && matchesClient && matchesSite && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'in_use': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'checked_out': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const colors = [
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-teal-100 text-teal-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ];
    const index = categoryName.length % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {!showCreate ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
              <p className="text-gray-600 mt-1">{filteredAssets.length} assets found</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors">
              <PlusIcon className="h-5 w-5 mr-2" /> Add Asset
            </button>
          </div>

          {error && (
            <div className="p-3 border border-red-200 bg-red-50 rounded-lg text-sm text-red-800">{error}</div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-3">
              {!SUPABASE_CONFIGURED && (
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All clients</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              
              <select value={selectedCategory} onChange={(e)=>setSelectedCategory(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">All categories</option>
                {categories.map((c:any)=> (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Demo data removed in production */}
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreate(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Asset</h1>
              <p className="text-gray-600 mt-1">Register a new asset in your inventory</p>
            </div>
          </div>
        </>
      )}

      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Asset Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return; const reader=new FileReader(); reader.onload=async ()=>{ const base = String(reader.result); const wm = await watermarkImage(base, `${new Date().toLocaleString()} • ${createForm.asset_tag || createForm.name}`); setCreateForm({ ...createForm, image_url: wm }); }; reader.readAsDataURL(f); }}
                      />
                    </label>
                    <span className="pl-1">or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
                {createForm.image_url && (
                  <div className="mt-4">
                    <img src={createForm.image_url} alt="Preview" className="mx-auto max-h-32 rounded-lg" />
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Asset Name *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Asset Tag *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" value={createForm.asset_tag} onChange={(e) => setCreateForm({ ...createForm, asset_tag: e.target.value })} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" value={createForm.category_id} onChange={(e) => setCreateForm({ ...createForm, category_id: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((c:any)=> (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" value={createForm.status || 'available'} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}>
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="checked_out">Checked Out</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" value={createForm.client_id} onChange={(e) => setCreateForm({ ...createForm, client_id: e.target.value })}>
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" value={createForm.location_id} onChange={(e) => setCreateForm({ ...createForm, location_id: e.target.value })}>
                <option value="">Select location</option>
                {listLocations(createForm.client_id || undefined).map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Cost</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="$0.00" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={createForm.client_id || ''}
                onChange={(e)=> setCreateForm({ ...createForm, client_id: e.target.value })}
              >
                <option value="">Unassigned</option>
                {clients.map((c: any)=> (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Category</label>
              <div className="flex items-center space-x-2">
                <input className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Category name" value={createForm.category_name || ''} onChange={(e)=> setCreateForm({ ...createForm, category_name: e.target.value })} />
                <button className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors" onClick={async()=>{ if(!createForm.category_name) return; if (SUPABASE_CONFIGURED) { const { data } = await supabase.rpc('add_category_by_slug', { p_slug: org, p_name: createForm.category_name }); setCreateForm({ ...createForm, category_id: (data as any)?.id, category_name: '' }); const { data: cats } = await supabase.rpc('get_categories_by_slug', { p_slug: org }); setCategories((cats||[]) as any); } else { const cat = addCategory({ name: createForm.category_name }); setCreateForm({ ...createForm, category_id: cat.id, category_name: '' }); setCategories(listCategories()); } }}>Add</button>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" rows={3} placeholder="Brief asset description" value={createForm.description || ''} onChange={(e)=> setCreateForm({ ...createForm, description: e.target.value })} />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setShowCreate(false)} className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Cancel</button>
            <button
              onClick={async () => {
                setError(null);
                if (!createForm.asset_tag || !createForm.name) { setError('Asset tag and name are required'); return; }
                let imgUrl = createForm.image_url || '';
                if (imgUrl) { imgUrl = await watermarkImage(imgUrl, `${new Date().toLocaleString()} • ${createForm.asset_tag || createForm.name}`); }
                if (SUPABASE_CONFIGURED) {
                  const { error } = await supabase.rpc('add_asset_by_slug', { p_slug: org, p_asset_tag: createForm.asset_tag, p_name: createForm.name, p_status: createForm.status || 'available', p_client_id: createForm.client_id || null, p_location_id: createForm.location_id || null, p_category_id: createForm.category_id || null, p_description: createForm.description || '', p_image_url: imgUrl || null } as any);
                  if (error) { setError(String(error.message)); return; }
                  const { data: refreshed } = await supabase.rpc('get_assets_by_slug', { p_slug: org });
                  setAssets(((refreshed||[]) as any));
                } else {
                  const created = addAsset({ asset_tag: createForm.asset_tag, name: createForm.name, client_id: createForm.client_id || undefined, location_id: createForm.location_id || undefined, category_id: createForm.category_id || undefined, status: createForm.status || 'available', description: createForm.description || '', image_url: imgUrl || undefined });
                  setAssets([created, ...assets]);
                }
                setShowCreate(false);
                setCreateForm({ asset_tag: '', name: '', client_id: '', location_id: '', category_id: '', category_name: '', description: '', image_url: '', status: 'available' } as any);
              }}
              className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >Save Asset</button>
          </div>
        </div>
      )}
      
      {!showCreate && (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredAssets.map((a) => (
            <div key={a.id} className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${viewMode === 'list' ? 'p-4' : 'overflow-hidden'}`}>
              {viewMode === 'grid' ? (
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-purple-100">
                      {a.image_url ? (
                        <img src={a.image_url} alt="Asset" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-purple-600 font-semibold text-sm">{getInitials(a.name)}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(a.status)}`}>
                        {a.status.replace('_', ' ')}
                      </span>
                      {a.category_id && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(categories.find((c:any)=>c.id===a.category_id)?.name || '')}`}>
                          {categories.find((c:any)=>c.id===a.category_id)?.name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <Link to={`/${org}/assets/${a.id}`} className="block mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors">{a.name}</h3>
                    <p className="text-sm text-gray-500 font-mono">{a.asset_tag}</p>
                  </Link>
                  
                  {a.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{a.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {a.client_id && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>{clients.find(c => c.id === a.client_id)?.name}</span>
                      </div>
                    )}
                    
                    {a.location_id && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{listLocations(selectedClient || undefined).find((l:any)=>l.id===a.location_id)?.name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" onClick={()=> setTimelineAssetId(a.id)}>View Timeline</button>
                    <label className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors cursor-pointer">
                      Upload Image
                      <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const file=e.target.files?.[0]; if(!file) return; const reader=new FileReader(); reader.onload=async ()=>{ const base=String(reader.result); const wm=await watermarkImage(base, `${new Date().toLocaleString()} • ${a.asset_tag}`); updateAsset(a.id, { image_url: wm }); setAssets(listAssets(selectedClient || undefined)); }; reader.readAsDataURL(file); }} />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 bg-purple-100">
                    {a.image_url ? (
                      <img src={a.image_url} alt="Asset" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-purple-600 font-semibold text-sm">{getInitials(a.name)}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <Link to={`/${org}/assets/${a.id}`} className="block">
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors truncate">{a.name}</h3>
                      <p className="text-sm text-gray-500 font-mono">{a.asset_tag}</p>
                    </Link>
                    
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(a.status)}`}>
                        {a.status.replace('_', ' ')}
                      </span>
                      {a.category_id && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(categories.find((c:any)=>c.id===a.category_id)?.name || '')}`}>
                          {categories.find((c:any)=>c.id===a.category_id)?.name}
                        </span>
                      )}
                      {a.client_id && (
                        <span className="text-sm text-gray-600">{clients.find(c => c.id === a.client_id)?.name}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" onClick={()=> setTimelineAssetId(a.id)}>Timeline</button>
                    <label className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors cursor-pointer">
                      Image
                      <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ const file=e.target.files?.[0]; if(!file) return; const reader=new FileReader(); reader.onload=async ()=>{ const base=String(reader.result); const wm=await watermarkImage(base, `${new Date().toLocaleString()} • ${a.asset_tag}`); updateAsset(a.id, { image_url: wm }); setAssets(listAssets(selectedClient || undefined)); }; reader.readAsDataURL(file); }} />
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {filteredAssets.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No assets found</h3>
              <p className="text-gray-500">{loading ? 'Loading assets...' : 'Try adjusting your search or filter criteria.'}</p>
            </div>
          )}
        </div>
      )}
      {timelineAssetId && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setTimelineAssetId(null)} />
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-full max-w-md px-4">
            <div className="bg-white rounded-2xl shadow-lg p-4 max-h-[80vh] overflow-y-auto">
              <div className="text-sm font-semibold mb-2">Asset Timeline</div>
              <div className="mb-2 text-xs flex items-center space-x-2">
                <span className="text-gray-600">Set quality:</span>
                {(['good','fair','poor'] as const).map(c => (
                  <button key={c} className={`px-2 py-1 rounded ${c==='good'?'bg-green-100 text-green-800':c==='fair'?'bg-yellow-100 text-yellow-800':'bg-red-100 text-red-800'}`} onClick={()=>{ addActivity({ technician_id: 'client', client_id: selectedClient || undefined, asset_id: timelineAssetId, type:'condition', status:'logged', condition:c }); }}> {c} </button>
                ))}
              </div>
              {(listActivities() as any[]).filter((a:any)=>a.asset_id===timelineAssetId).sort((x:any,y:any)=> (new Date(y.created_at||'').getTime()) - (new Date(x.created_at||'').getTime())).map((t:any)=> (
                <div key={t.id} className="border border-gray-200 rounded p-2 text-xs mb-2">
                  <div className="font-medium">{t.type} • {t.status}</div>
                  <div className="text-gray-600">{new Date(t.created_at||'').toLocaleString()}</div>
                  {t.condition && (<div className="text-gray-600">Condition: {t.condition}</div>)}
                  {(t.gps_lat && t.gps_lng) && (<div className="text-gray-600">GPS: {t.gps_lat?.toFixed(5)}, {t.gps_lng?.toFixed(5)}</div>)}
                </div>
              ))}
              <div className="mt-2 flex items-center justify-end"><button className="px-3 py-2 rounded bg-gray-100" onClick={()=>setTimelineAssetId(null)}>Close</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
