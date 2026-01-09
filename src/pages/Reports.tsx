import React from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import ExcelJS from 'exceljs';
import { downloadPDF } from '../lib/pdf';

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { org } = useParams();
  const { listClients, listAssets, listTechnicians, listJobs, listActivities, updateJob } = useData() as any;
  const { settings } = useSettings();
  const clients = listClients();
  const [clientId, setClientId] = React.useState<string>('');
  const client = clients.find((c: any) => c.id === clientId);
  const assets = listAssets(clientId || undefined);
  const techs = listTechnicians();
  const jobs = (listJobs() as any[]).filter(j=> (!clientId || j.client_id===clientId));
  const acts = (listActivities() as any[]);

  const exportCSV = () => {
    const rows = [
      ['Client', client?.name || 'All'],
      ['Org', settings.orgProfile.name || org || ''],
      [],
      ['Asset Tag', 'Asset Name', 'Status'],
      ...assets.map((a: any) => [a.asset_tag, a.name, a.status]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadBlob(`report_${client?.name || 'all'}.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  };

  const exportTransactionsCSV = () => {
    const acts = listActivities() as any[];
    const rows = [
      ['Org', settings.orgProfile.name || org || ''],
      [],
      ['Type', 'Asset Tag', 'Asset Name', 'From', 'To', 'Timestamp', 'Notes'],
      ...acts.map((t:any)=> [t.type, t.asset?.asset_tag||'', t.asset?.name||'', t.from_location?.name||'', t.to_location?.name||'', t.created_at, t.notes||''])
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v??'').replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadBlob(`transactions_${client?.name || 'all'}.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  };

  const exportJobsCSV = () => {
    const jobs = (listJobs() as any[]).filter(j=> (!clientId || j.client_id===clientId));
    const rows = [
      ['Client', client?.name || 'All'],
      ['Org', settings.orgProfile.name || org || ''],
      [],
      ['Title','Status','Due','Assigned Tech','Location'],
      ...jobs.map((j:any)=> [j.title, j.status, j.due_at||'', j.technician_id||'', j.location_id||''])
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v??'').replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadBlob(`jobs_${client?.name || 'all'}.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  };

  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Report');
    ws.columns = [
      { header: 'Asset Tag', key: 'asset_tag', width: 16 },
      { header: 'Asset Name', key: 'asset_name', width: 28 },
      { header: 'Status', key: 'status', width: 16 },
    ];

    ws.mergeCells('A1:C1');
    ws.getCell('A1').value = `${client?.name || 'All Clients'} Report`;
    ws.getCell('A1').font = { size: 16, bold: true };
    ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };

    // Add logo image if available
    const logo = client?.logo_url || settings.branding.logo_url || '';
    if (logo.startsWith('data:image')) {
      const match = logo.match(/^data:image\/(png|jpeg|jpg);base64,(.*)$/);
      if (match) {
        const ext = match[1] === 'jpg' ? 'jpeg' : match[1];
        const base64 = match[2];
        const imgId = wb.addImage({ base64, extension: ext as any });
        ws.addImage(imgId, { tl: { col: 0, row: 1 }, ext: { width: 180, height: 60 } });
      }
    }

    // Header row at row 4 (leave space for title and logo)
    const headerRowIndex = 4;
    ws.getRow(headerRowIndex).values = ['Asset Tag', 'Asset Name', 'Status'];
    ws.getRow(headerRowIndex).font = { bold: true };
    ws.getRow(headerRowIndex).alignment = { horizontal: 'left' };

    assets.forEach((a: any) => {
      ws.addRow({ asset_tag: a.asset_tag, asset_name: a.name, status: a.status });
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    downloadBlob(`report_${client?.name || 'all'}.xlsx`, blob);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex items-center space-x-2">
          <button onClick={exportCSV} className="px-3 py-2 rounded bg-gray-900 text-white">Export CSV</button>
          <button onClick={exportExcel} className="px-3 py-2 rounded bg-blue-600 text-white">Export Excel</button>
          <button onClick={exportTransactionsCSV} className="px-3 py-2 rounded bg-green-600 text-white">Export Transactions</button>
          <button onClick={exportJobsCSV} className="px-3 py-2 rounded bg-purple-600 text-white">Export Jobs</button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Approvals</h2>
        </div>
        <div className="mt-3 space-y-2">
          {jobs.filter(j=> j.needs_approval).map(j=> (
            <div key={j.id} className="flex items-center justify-between text-sm">
              <span>{j.title}</span>
              <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={()=>{ updateJob(j.id, { needs_approval: false, status: 'assigned' }); }}>Approve</button>
            </div>
          ))}
          {jobs.filter(j=> j.needs_approval).length===0 && (<div className="text-sm text-gray-600">No pending approvals</div>)}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Maintenance Calendar</h2>
        <div className="space-y-2 text-sm">
          {assets.filter((a:any)=> a.next_service_at).sort((a:any,b:any)=> new Date(a.next_service_at).getTime()-new Date(b.next_service_at).getTime()).map((a:any)=> (
            <div key={a.id} className="flex items-center justify-between">
              <span>{a.name}</span>
              <span>{new Date(a.next_service_at||'').toLocaleDateString()}</span>
            </div>
          ))}
          {assets.filter((a:any)=> a.next_service_at).length===0 && (<div className="text-sm text-gray-600">No scheduled maintenance</div>)}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Cost of Ownership</h2>
        {(() => {
          function costForAsset(assetId: string) {
            const relatedJobs = jobs.filter(j=> (j.asset_ids||[]).includes(assetId));
            let partsCost = 0;
            relatedJobs.forEach(j=> { (j.parts||[]).forEach(p=> { partsCost += (p.qty||0) * (p.unit_cost||0); }); });
            return { partsCost, total: partsCost };
          }
          return (
            <div className="space-y-2">
              {assets.map((a:any)=> { const c=costForAsset(a.id); return (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span>{a.name}</span>
                  <span>
                    Parts: {c.partsCost.toFixed(2)} • Total: {c.total.toFixed(2)}
                  </span>
                </div>
              ); })}
              {assets.length===0 && (<div className="text-sm text-gray-600">No assets</div>)}
            </div>
          );
        })()}
      </div>

      <div className="flex items-center space-x-3">
        <label className="text-sm text-gray-700">Client</label>
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
          <option value="">All clients</option>
          {clients.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="text-sm text-gray-500">Assets</div>
          <div className="mt-2 text-2xl font-semibold">{assets.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="text-sm text-gray-500">Technicians</div>
          <div className="mt-2 text-2xl font-semibold">{techs.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="text-sm text-gray-500">Completed Jobs</div>
          <div className="mt-2 text-2xl font-semibold">{jobs.filter(j=> j.status==='completed').length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="text-sm text-gray-500">Checked Out</div>
          <div className="mt-2 text-2xl font-semibold">{assets.filter((a: any) => a.status === 'checked_out').length}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Maintenance Health</h2>
        {(() => {
          const now = new Date();
          const withNext = assets.map((a:any)=> ({...a, next: a.next_service_at ? new Date(a.next_service_at) : null}));
          const healthy = withNext.filter(a=> a.next && (a.next.getTime() - now.getTime()) > 30*24*60*60*1000).length;
          const dueSoon = withNext.filter(a=> a.next && (a.next.getTime() - now.getTime()) <= 30*24*60*60*1000 && a.next >= now).length;
          const overdue = withNext.filter(a=> a.next && a.next < now).length;
          const totalTracked = healthy + dueSoon + overdue || 1;
          const pct = (n:number)=> Math.round((n/totalTracked)*100);
          return (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Healthy</span>
                <span>{healthy} ({pct(healthy)}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Due Soon</span>
                <span>{dueSoon} ({pct(dueSoon)}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Overdue</span>
                <span>{overdue} ({pct(overdue)}%)</span>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="bg-white border border-gray-200 rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset Tag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assets.map((a: any) => (
              <tr key={a.id}>
                <td className="px-6 py-4 text-sm font-mono">{a.asset_tag}</td>
                <td className="px-6 py-4 text-sm">{a.name}</td>
                <td className="px-6 py-4 text-sm">{a.status}</td>
                <td className="px-6 py-4 text-sm">
                  {(() => {
                    const next = a.next_service_at ? new Date(a.next_service_at) : null;
                    if (!next) return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">Unknown</span>;
                    const now = new Date();
                    const diff = next.getTime() - now.getTime();
                    const label = diff < 0 ? 'Overdue' : diff <= 30*24*60*60*1000 ? 'Due Soon' : 'Healthy';
                    const cls = label==='Healthy' ? 'bg-green-100 text-green-800' : label==='Due Soon' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
                    return <span className={`px-2 py-1 rounded-full text-xs ${cls}`}>{label}</span>;
                  })()}
                </td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">No assets</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Job Sign-offs</h2>
          <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={async ()=>{ const completed = jobs.filter(j=> j.status==='completed' || (j.attachments||[]).length>0); const images = completed.flatMap(j=> j.attachments || []); const paragraphs = completed.map(j=> `${j.title} • Status: ${j.status}${j.notes? ' • Notes: '+j.notes: ''}`); await downloadPDF(`job_signoffs_${client?.name || 'all'}.pdf`, { title: `${client?.name || 'All Clients'} — Job Sign-offs`, subtitle: new Date().toLocaleString(), paragraphs, images, headerFields: [ { label:'Client', value: client?.name || 'All' }, { label:'Assets', value: String(assets.length) }, { label:'Completed Jobs', value: String(completed.length) } ], pageFooter: `Generated by Bez Asset Tracker • ${new Date().toLocaleDateString()}` }); }}>Download PDF</button>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.filter(j=> (j.attachments||[]).length>0).map(j=> (
            <div key={j.id} className="border border-gray-200 rounded p-3">
              <div className="text-sm font-medium">{j.title}</div>
              <div className="text-xs text-gray-600">Status: {j.status}</div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(j.attachments||[]).map((img:string, i:number)=> (
                  <img key={i} src={img} alt="" className="w-full h-20 object-cover rounded border border-gray-200" />
                ))}
              </div>
            </div>
          ))}
          {jobs.filter(j=> (j.attachments||[]).length>0).length===0 && (<div className="text-sm text-gray-500">No sign-offs yet</div>)}
        </div>
      </div>
    </div>
  );
}
