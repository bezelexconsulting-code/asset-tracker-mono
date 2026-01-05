import React from 'react';
import { useData } from '../contexts/DataContext';
import { Link, useParams } from 'react-router-dom';
import { ClockIcon, DocumentTextIcon, CubeIcon, BuildingOfficeIcon, UserIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

export default function AuditLog() {
  const { org } = useParams();
  const { listAudit } = useData() as any;
  const [query, setQuery] = React.useState('');
  const [entityFilter, setEntityFilter] = React.useState<string>('');
  const [selected, setSelected] = React.useState<any | null>(null);
  const [copied, setCopied] = React.useState(false);
  const events = listAudit().filter((e) => {
    if (!query) return true;
    return (
      (e.entity && e.entity.toLowerCase().includes(query.toLowerCase())) ||
      (e.type && e.type.toLowerCase().includes(query.toLowerCase())) ||
      (e.details && JSON.stringify(e.details).toLowerCase().includes(query.toLowerCase()))
    );
  }).filter((e)=> !entityFilter || e.entity===entityFilter);

  const icons: Record<string, any> = {
    asset: CubeIcon,
    client: BuildingOfficeIcon,
    user: UserIcon,
    technician: WrenchScrewdriverIcon,
    activity: DocumentTextIcon,
    location: BuildingOfficeIcon,
    job: DocumentTextIcon,
  };
  function rel(t: string) {
    const d = new Date(t).getTime();
    const diff = Date.now() - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 rounded p-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <input placeholder="Search" className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="border border-gray-300 rounded px-3 py-2 text-sm" value={entityFilter} onChange={(e)=>setEntityFilter(e.target.value)}>
            <option value="">All entities</option>
            {Array.from(new Set(listAudit().map((e:any)=> e.entity))).map((en)=> (
              <option key={en} value={en}>{en}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {events.map((e)=> {
          const Icon = icons[e.entity] || DocumentTextIcon;
          return (
            <button key={e.id} className="text-left bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:translate-y-[1px] transition" onClick={()=> setSelected(e)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className="h-5 w-5 text-gray-500" />
                  <span className="px-2 py-[2px] rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100">{e.type}</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500"><ClockIcon className="h-4 w-4" /><span>{rel(e.created_at)}</span></div>
              </div>
              <div className="mt-2 text-sm font-medium text-gray-900">{e.entity}</div>
              <div className="mt-1 text-xs text-gray-600">{new Date(e.created_at).toLocaleString()}</div>
              <div className="mt-2 text-xs text-gray-500 line-clamp-2">{e.details ? JSON.stringify(e.details) : ''}</div>
            </button>
          );
        })}
        {events.length===0 && (
          <div className="text-sm text-gray-500">No events</div>
        )}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={()=> setSelected(null)} />
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-full max-w-lg px-4">
            <div className="bg-white rounded-2xl shadow-lg p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Event Details</div>
                <button className="text-gray-600" onClick={()=> setSelected(null)}>✕</button>
              </div>
              <div className="mt-2 text-xs text-gray-500">{new Date(selected.created_at).toLocaleString()}</div>
              <div className="mt-1 text-sm">Type: {selected.type}</div>
              <div className="text-sm">Entity: {selected.entity}</div>
              {selected.details?.patch?.attachments && (
                <div className="mt-3">
                  <div className="text-sm font-semibold">Attachments</div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(selected.details.patch.attachments||[]).map((img:string, i:number)=> (
                      <img key={i} src={img} alt="" className="w-full h-20 object-cover rounded border border-gray-200" />
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Payload</div>
                  <button className="px-2 py-1 rounded bg-gray-100 text-xs" onClick={()=>{ navigator.clipboard?.writeText(selected.details ? JSON.stringify(selected.details, null, 2) : ''); setCopied(true); setTimeout(()=>setCopied(false), 1500); }}>{copied ? 'Copied' : 'Copy'}</button>
                </div>
                {(() => {
                  let obj: any = {};
                  try { obj = typeof selected.details === 'string' ? JSON.parse(selected.details) : (selected.details || {}); } catch { obj = selected.details || {}; }
                  const entries = Object.entries(obj || {});
                  if (entries.length === 0) {
                    return (<pre className="mt-2 text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-x-auto">{selected.details ? JSON.stringify(selected.details, null, 2) : ''}</pre>);
                  }
                  return (
                    <div className="mt-2 bg-gray-50 border border-gray-200 rounded p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {entries.map(([k,v]) => (
                          <div key={k} className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">{k}</label>
                            <input className="w-full border border-gray-300 rounded px-3 py-2 text-xs bg-white" readOnly value={String(v)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="mt-3 flex items-center space-x-2">
                {selected.entity==='asset' && selected.entity_id && (<Link className="px-3 py-2 rounded bg-blue-600 text-white text-xs" to={`/${org}/assets/${selected.entity_id}`}>Open Asset</Link>)}
                {selected.entity==='client' && selected.entity_id && (<Link className="px-3 py-2 rounded bg-gray-100 text-gray-700 text-xs" to={`/${org}/clients`}>Open Client</Link>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
