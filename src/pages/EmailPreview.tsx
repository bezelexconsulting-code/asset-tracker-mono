import React from 'react';
import { useParams } from 'react-router-dom';
import { EmailTemplates } from '../lib/emailTemplates';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';

const options = [
  { key: 'technicianInvite', label: 'Technician Invite' },
  { key: 'jobAssigned', label: 'Job Assigned' },
  { key: 'jobReminder', label: 'Job Reminder' },
  { key: 'jobCompletedSignoff', label: 'Job Completed Sign-off' },
  { key: 'assetQualityAlert', label: 'Asset Quality Alert' },
  { key: 'dailyDigest', label: 'Daily Digest' },
  { key: 'monthlyOrgSummary', label: 'Monthly Org Summary' },
  { key: 'technicianCredentialsSet', label: 'Technician Credentials Set' },
  { key: 'requestTechnicianReceived', label: 'Request Technician Received' },
];

export default function EmailPreview() {
  const { org } = useParams();
  const { listClients, listAssets, listJobs, listTechnicians, listLocations } = useData() as any;
  const { settings } = useSettings();
  const [tpl, setTpl] = React.useState(options[0].key);
  const client = listClients()[0] || { name: 'Client' };
  const asset = listAssets()[0] || { name: 'Asset', asset_tag: 'AST-001' };
  const job = listJobs()[0] || { id: 'j1', title: 'Demo Job', notes: 'Demo notes' };
  const tech = listTechnicians()[0] || { name: 'Technician' };
  const site = listLocations(client.id)[0] || { name: 'Site', address: '' };
  const payload: any = {
    org_name: settings.orgProfile.name || org,
    tech_name: tech.name,
    client_name: client.name,
    site_name: site.name,
    address: site.address,
    assets: [asset.name],
    asset_name: asset.name,
    asset_tag: asset.asset_tag,
    title: job.title,
    job_id: job.id,
    notes: job.notes,
    link: `${window.location.origin}/${org}/technicians/${tech.id || 't1'}`,
    pdf_url: `${window.location.origin}/${org}/reports`,
    period: new Date().toISOString().slice(0,7),
    assets_count: listAssets().length,
    jobs_today: listJobs().filter((j:any)=> new Date(j.created_at||'').toDateString()===new Date().toDateString()).length,
    jobs_completed: listJobs().filter((j:any)=> j.status==='completed').length,
    techs_active: listTechnicians().length,
    requester_email: settings.orgProfile.contact_email || 'ops@example.com',
  };
  const html = (EmailTemplates as any)[tpl](payload);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Email Templates Preview</h1>
        <div className="flex items-center space-x-2">
          <select value={tpl} onChange={(e)=> setTpl(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
            {options.map(o=> <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <button className="px-3 py-2 rounded bg-gray-900 text-white" onClick={()=>{ navigator.clipboard?.writeText(html); }}>Copy HTML</button>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded p-4">
        <iframe title="preview" style={{ width:'100%', height:'70vh', border:'0' }} srcDoc={html} />
      </div>
    </div>
  );
}

