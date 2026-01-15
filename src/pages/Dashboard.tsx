import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOrganization } from '../contexts/OrganizationContext';
import { SUPABASE_CONFIGURED, supabase } from '../lib/supabase';
import { restRpc } from '../lib/rest';
import { resolveOrgId } from '../lib/org';
import { useSettings } from '../contexts/SettingsContext';
import { useData } from '../contexts/DataContext';
import { downloadPDF } from '../lib/pdf';
import { QrCodeIcon, PlusIcon, ArrowRightCircleIcon, UsersIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { org } = useParams();
  const { settings } = useSettings();
  const { listActivities, listAssets, listClients, listJobs, listTechnicians, state } = useData() as any;
  const { orgId } = useOrganization();
  const greeting = 'Welcome';
  const [selectedAct, setSelectedAct] = React.useState<any | null>(null);
  const [counts, setCounts] = React.useState<{ assets: number; checked: number; clients: number; techs: number }>({ assets: 0, checked: 0, clients: 0, techs: 0 });
  const [recent, setRecent] = React.useState<any[]>([]);
  let openInvoice: { amount_cents: number; period: string } | null = null;
  try {
    const raw = localStorage.getItem('bez-superadmin');
    if (raw) {
      const data = JSON.parse(raw);
      const inv = (data.invoices || []).find((i: any) => i.org_id === org && i.status === 'open');
      if (inv) openInvoice = { amount_cents: inv.amount_cents, period: inv.period };
    }
  } catch {}
  const formatR = (cents: number) => `R ${(cents / 100).toFixed(2)}`;
  const vatRate = 0.15;
  async function makeTechRequest() {
    if (SUPABASE_CONFIGURED) {
      const { data: orgRow } = await supabase.from('organizations').select('id, slug, contact_phone').eq('slug', org);
      const orgId = orgRow?.[0]?.id;
      const phone = (orgRow?.[0] as any)?.contact_phone || settings.orgProfile.contact_phone || '';
      await supabase.from('requests').insert({ org_id: orgId, org_slug: org, requester_email: settings.orgProfile.contact_email || '', note: `Technician requested from dashboard${phone ? ` • phone: ${phone}` : ''}`, status: 'pending' });
      alert('Technician request sent');
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 rounded p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded overflow-hidden flex items-center justify-center">
              {settings.branding.logo_url ? (
                <img src={settings.branding.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-gray-400">Logo</span>
              )}
            </div>
            <h1 className="text-2xl font-bold" style={{ color: settings.branding.primary_color || '#111827' }}>
              {greeting}, {settings.orgProfile.name || org}
            </h1>
          </div>
        </div>
        <p className="mt-2 text-gray-600">Welcome back. Here’s your overview and quick actions.</p>
        {openInvoice && (
          <div className="mt-3 p-3 border border-blue-200 bg-blue-50 rounded text-sm text-blue-800">
            Invoice for {openInvoice.period}: Subtotal {formatR(openInvoice.amount_cents)}, VAT {formatR(Math.round(openInvoice.amount_cents * vatRate))}, Total {formatR(Math.round(openInvoice.amount_cents * (1 + vatRate)))}. Please check your email for details.
          </div>
        )}
        {!SUPABASE_CONFIGURED && (
          <div className="mt-4 p-3 border border-yellow-200 bg-yellow-50 rounded text-sm text-yellow-800">
            Supabase is not configured. Showing demo stats until environment variables are set.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="text-sm text-gray-500">Total Assets</div>
          <div className="mt-2 text-2xl font-semibold">{SUPABASE_CONFIGURED ? counts.assets : listAssets(undefined).length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="text-sm text-gray-500">Checked Out</div>
          <div className="mt-2 text-2xl font-semibold">{SUPABASE_CONFIGURED ? counts.checked : listAssets(undefined).filter((a:any)=> a.status==='checked_out').length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="text-sm text-gray-500">Clients</div>
          <div className="mt-2 text-2xl font-semibold">{SUPABASE_CONFIGURED ? counts.clients : listClients().length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="text-sm text-gray-500">Technicians</div>
          <div className="mt-2 text-2xl font-semibold">{SUPABASE_CONFIGURED ? counts.techs : listTechnicians().length}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <button className="px-3 py-2 rounded bg-blue-600 text-white text-xs" onClick={async ()=>{
            const jobs = (listJobs() as any[]);
            const today = new Date().toDateString();
            const imgs = jobs.flatMap((j:any)=> j.attachments || []);
            const paragraphs = jobs.filter((j:any)=> (new Date(j.created_at||'').toDateString())===today).map((j:any)=> `${j.title} • ${j.status}`);
            await downloadPDF(`daily_dashboard_${new Date().toISOString().slice(0,10)}.pdf`, { title: `${settings.orgProfile.name || org} — Daily Summary`, subtitle: new Date().toLocaleString(), headerFields: [ { label:'Assets', value: String(listAssets(undefined).length) }, { label:'Technicians', value: String(listTechnicians().length) }, { label:'Clients', value: String(listClients().length) }, { label:'Jobs Today', value: String(paragraphs.length) } ], paragraphs, images: imgs.slice(0,12), pageFooter: `Generated ${new Date().toLocaleDateString()}` });
          }}>Download Daily PDF</button>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link to={`/${org}/assets`} className="inline-flex items-center px-4 py-3 rounded-md border border-gray-200 hover:bg-gray-50">
            <ArrowRightCircleIcon className="h-5 w-5 mr-2 text-gray-500" /> View Assets
          </Link>
          <Link to={`/${org}/clients`} className="inline-flex items-center px-4 py-3 rounded-md border border-gray-200 hover:bg-gray-50">
            <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-500" /> View Clients
          </Link>
          <Link to={`/${org}/technicians`} className="inline-flex items-center px-4 py-3 rounded-md border border-gray-200 hover:bg-gray-50">
            <UsersIcon className="h-5 w-5 mr-2 text-gray-500" /> View Technicians
          </Link>
          <Link to={`/${org}/check`} className="inline-flex items-center px-4 py-3 rounded-md border border-gray-200 hover:bg-gray-50">
            <ArrowRightCircleIcon className="h-5 w-5 mr-2 text-gray-500" /> Check-in / Check-out
          </Link>
          <Link to={`/${org}/nfc`} className="inline-flex items-center px-4 py-3 rounded-md border border-gray-200 hover:bg-gray-50">
            <QrCodeIcon className="h-5 w-5 mr-2 text-gray-500" /> NFC Management
          </Link>
          <Link to={`/${org}/assets`} className="inline-flex items-center px-4 py-3 rounded-md border border-gray-200 hover:bg-gray-50">
            <PlusIcon className="h-5 w-5 mr-2 text-gray-500" /> Add Asset
          </Link>
          <button onClick={makeTechRequest} className="inline-flex items-center px-4 py-3 rounded-md border border-gray-200 hover:bg-gray-50">
            <UsersIcon className="h-5 w-5 mr-2 text-gray-500" /> Request Technician
          </button>
          <Link to={`/${org}/account`} className="inline-flex items-center px-4 py-3 rounded-md border border-gray-200 hover:bg-gray-50">
            <ArrowRightCircleIcon className="h-5 w-5 mr-2 text-gray-500" /> Account
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <div className="mt-4 divide-y divide-gray-200">
          {(SUPABASE_CONFIGURED ? recent : (listActivities() as any[])).slice(0,10).map((a:any)=> {
            const assetName = a.asset_name || (listAssets(undefined).find((x:any)=>x.id===a.asset_id)?.name) || '';
            const clientName = a.client_name || (listClients().find((c:any)=>c.id===a.client_id)?.name) || '';
            return (
              <button key={a.id} className="w-full text-left py-3 flex items-center justify-between hover:bg-gray-50" onClick={()=> setSelectedAct(a)}>
                <span className="text-sm text-gray-700">{a.type || a.transaction_type} • {assetName} • {clientName}</span>
                <span className="text-xs text-gray-500">{new Date(a.created_at||'').toLocaleString()}</span>
              </button>
            );
          })}
          {(SUPABASE_CONFIGURED ? recent.length===0 : (listActivities() as any[]).length===0) && <div className="text-sm text-gray-500">No activity</div>}
        </div>
      </div>
      {selectedAct && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={()=> setSelectedAct(null)} />
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-full max-w-md px-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Activity Details</div>
                <button className="text-gray-600" onClick={()=> setSelectedAct(null)}>✕</button>
              </div>
              <div className="mt-2 text-xs text-gray-500">{new Date(selectedAct.created_at||'').toLocaleString()}</div>
              <div className="text-sm">Type: {selectedAct.type || selectedAct.transaction_type}</div>
              <div className="text-sm">Status: {selectedAct.status}</div>
              {selectedAct.condition && (<div className="text-sm">Condition: {selectedAct.condition}</div>)}
              {(selectedAct.gps_lat && selectedAct.gps_lng) && (<div className="text-sm">GPS: {selectedAct.gps_lat.toFixed(5)}, {selectedAct.gps_lng.toFixed(5)}</div>)}
              <div className="mt-3 flex items-center space-x-2">
                {selectedAct.asset_id && (<Link className="px-3 py-2 rounded bg-blue-600 text-white text-xs" to={`/${org}/assets`}>Open Assets</Link>)}
                {selectedAct.client_id && (<Link className="px-3 py-2 rounded bg-gray-100 text-gray-700 text-xs" to={`/${org}/clients`}>Open Client</Link>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  React.useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    (async () => {
      try {
        // Use orgId from OrganizationProvider for RPC calls
        const resolvedOrgId = orgId || await resolveOrgId(org);
        
        // Try using supabase.rpc directly first (more reliable)
        let c: any = null;
        try {
          const { data, error } = await supabase.rpc('get_dashboard_counts_by_slug', { p_slug: org });
          if (error) {
            console.warn('RPC get_dashboard_counts_by_slug error:', error);
            // Fallback to restRpc
            c = await restRpc<any>('get_dashboard_counts_by_slug', { p_slug: org }, resolvedOrgId || undefined).catch(() => null);
          } else {
            c = data;
          }
        } catch (err) {
          console.warn('Supabase RPC failed, trying restRpc:', err);
          c = await restRpc<any>('get_dashboard_counts_by_slug', { p_slug: org }, resolvedOrgId || undefined).catch(() => null);
        }
        
        const assetsCount = Number(c?.assets || 0);
        const checkedCount = Number(c?.checked || 0);
        const clientsCount = Number(c?.clients || 0);
        const techsCount = Number(c?.technicians || 0);
        
        if (assetsCount === 0 && clientsCount === 0 && techsCount === 0) {
          // Fallback: fetch directly using RPCs
          const [aResult, tResult, clResult] = await Promise.all([
            supabase.rpc('get_assets_by_slug', { p_slug: org }).catch(() => ({ data: null, error: null })),
            supabase.rpc('get_technicians_by_slug', { p_slug: org }).catch(() => ({ data: null, error: null })),
            supabase.rpc('get_clients_by_slug', { p_slug: org }).catch(() => ({ data: null, error: null })),
          ]);
          
          const a = aResult.data || [];
          const t = tResult.data || [];
          const cl = clResult.data || [];
          
          console.log('Fetched directly:', { assets: a.length, techs: t.length, clients: cl.length });
          
          setCounts({ 
            assets: a.length, 
            checked: a.filter((x:any)=> x.status==='checked_out').length, 
            clients: cl.length, 
            techs: t.length 
          });
        } else {
          setCounts({ assets: assetsCount, checked: checkedCount, clients: clientsCount, techs: techsCount });
        }
        // Use RPC for transactions if available, otherwise use direct query with orgId
        if (resolvedOrgId) {
          // Try to get transactions using RPC, fallback to direct query
          try {
            const { data: tx } = await supabase.rpc('get_transactions_by_slug', { p_slug: org, p_limit: 10 }).catch(() => ({ data: null }));
            if (tx) {
              setRecent(tx || []);
            } else {
              // Fallback to direct query
              const { data: txData } = await supabase.from('transactions').select('*').eq('org_id', resolvedOrgId).order('created_at', { ascending: false }).limit(10);
              setRecent(txData || []);
            }
          } catch {
            // Fallback to direct query
            const { data: txData } = await supabase.from('transactions').select('*').eq('org_id', resolvedOrgId).order('created_at', { ascending: false }).limit(10);
            setRecent(txData || []);
          }
        } else {
          setRecent([]);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setCounts({ assets: 0, checked: 0, clients: 0, techs: 0 });
        setRecent([]);
      }
      })();
    const ch = supabase.channel(`dashboard_${org}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, async ()=>{
        try {
          const resolvedOrgId = orgId || await resolveOrgId(org);
          const cj = await restRpc<any>('get_dashboard_counts_by_slug', { p_slug: org }, resolvedOrgId || undefined);
          if (cj && (cj.assets || cj.checked)) {
            setCounts((c)=> ({ ...c, assets: Number(cj.assets || c.assets), checked: Number(cj.checked || c.checked) }));
          } else {
            const data = await restRpc<any[]>('get_assets_by_slug', { p_slug: org }, resolvedOrgId || undefined);
            const a = (data as any[]) || [];
            setCounts((c)=> ({ ...c, assets: a.length, checked: a.filter((x:any)=> x.status==='checked_out').length }));
          }
        } catch (error) {
          console.error('Error updating assets count:', error);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technicians' }, async ()=>{
        try {
          const resolvedOrgId = orgId || await resolveOrgId(org);
          const cj = await restRpc<any>('get_dashboard_counts_by_slug', { p_slug: org }, resolvedOrgId || undefined);
          if (cj && cj.technicians !== undefined) {
            setCounts((c)=> ({ ...c, techs: Number(cj.technicians) }));
          } else {
            const data = await restRpc<any[]>('get_technicians_by_slug', { p_slug: org }, resolvedOrgId || undefined);
            setCounts((c)=> ({ ...c, techs: Array.isArray(data) ? (data as any[]).length : c.techs }));
          }
        } catch (error) {
          console.error('Error updating technicians count:', error);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, async ()=>{
        try {
          const resolvedOrgId = orgId || await resolveOrgId(org);
          const cj = await restRpc<any>('get_dashboard_counts_by_slug', { p_slug: org }, resolvedOrgId || undefined);
          if (cj && cj.clients !== undefined) {
            setCounts((c)=> ({ ...c, clients: Number(cj.clients) }));
          } else {
            const data = await restRpc<any[]>('get_clients_by_slug', { p_slug: org }, resolvedOrgId || undefined);
            setCounts((c)=> ({ ...c, clients: Array.isArray(data) ? (data as any[]).length : c.clients }));
          }
        } catch (error) {
          console.error('Error updating clients count:', error);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, async ()=>{
        try {
          const resolvedOrgId = orgId || await resolveOrgId(org);
          if (!resolvedOrgId) return;
          // Try RPC first, fallback to direct query
          try {
            const { data: tx } = await supabase.rpc('get_transactions_by_slug', { p_slug: org, p_limit: 10 }).catch(() => ({ data: null }));
            if (tx) {
              setRecent(tx || []);
            } else {
              const { data: txData } = await supabase.from('transactions').select('*').eq('org_id', resolvedOrgId).order('created_at', { ascending: false }).limit(10);
              setRecent(txData || []);
            }
          } catch {
            const { data: txData } = await supabase.from('transactions').select('*').eq('org_id', resolvedOrgId).order('created_at', { ascending: false }).limit(10);
            setRecent(txData || []);
          }
        } catch (error) {
          console.error('Error updating transactions:', error);
        }
      })
      .subscribe();
    return () => { try { supabase.removeChannel(ch); } catch {} };
  }, [org, orgId]);

  React.useEffect(() => {
    const localAssets = listAssets(undefined) || [];
    const localClients = listClients() || [];
    const localTechs = listTechnicians() || [];
    if ((counts.assets === 0 && counts.clients === 0 && counts.techs === 0) && (localAssets.length + localClients.length + localTechs.length > 0)) {
      const checked = localAssets.filter((a:any)=> a.status==='checked_out').length;
      setCounts({ assets: localAssets.length, checked, clients: localClients.length, techs: localTechs.length });
    }
  }, [state, listAssets, listClients, listTechnicians]);
}
