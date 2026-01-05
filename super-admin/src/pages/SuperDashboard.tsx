import React from 'react';
import { Link } from 'react-router-dom';
import { useSuperAdmin } from '../contexts/SuperAdminContext';
import { downloadPDF } from '../lib/pdf';

export default function SuperDashboard() {
  const { state } = useSuperAdmin();
  const totalSeats = (state.orgs || []).reduce((sum, o) => sum + (o.seats || 0), 0);
  const activeOrgs = (state.orgs || []).filter((o) => o.active).length;
  const pending = (state.requests || []).filter((r) => r.status === 'pending');
  const changes = (state as any).user_changes || [];
  const adoptionKeys = ['nfc_batch', 'quality_logging', 'signature_capture', 'pdf_exports'];
  const adoption = adoptionKeys.map((k) => ({ key: k, enabled: (state.flags || []).filter((f) => f.key === k && f.enabled).length }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">BezAssetTracker Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Link to="/super/orgs" className="px-3 py-2 rounded bg-blue-600 text-white">Manage Orgs</Link>
          <Link to="/super/requests" className="px-3 py-2 rounded bg-gray-900 text-white">Review Requests</Link>
          <button className="px-3 py-2 rounded bg-indigo-600 text-white" onClick={async ()=>{
            const logos = (state.orgs || []).map((o)=> o.logo_url).filter((l)=> !!l);
            const headerFields = [
              { label: 'Organizations', value: String(state.orgs.length) },
              { label: 'Active Orgs', value: String(activeOrgs) },
              { label: 'Technician Slots', value: String(totalSeats) },
              { label: 'Pending Requests', value: String(pending.length) },
            ];
            const paragraphs = adoption.map(a=> `${a.key}: ${a.enabled}/${state.orgs.length} enabled`);
            await downloadPDF(`monthly_org_summary_${new Date().toISOString().slice(0,7)}.pdf`, {
              title: 'Monthly Organization Summary',
              subtitle: new Date().toLocaleString(),
              headerFields,
              paragraphs,
              images: logos as any,
              pageFooter: `Generated ${new Date().toLocaleDateString()}`,
            });
          }}>Download Monthly Summary</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="text-sm text-gray-500">Organizations</div>
          <div className="mt-2 text-2xl font-semibold">{state.orgs.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="text-sm text-gray-500">Active Orgs</div>
          <div className="mt-2 text-2xl font-semibold">{activeOrgs}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="text-sm text-gray-500">Technician Slots</div>
          <div className="mt-2 text-2xl font-semibold">{totalSeats}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="text-sm text-gray-500">Pending Requests</div>
          <div className="mt-2 text-2xl font-semibold">{pending.length}</div>
        </div>
      </div>
    </div>
  );
}
