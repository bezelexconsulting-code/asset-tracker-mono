import React, { useEffect, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';

export default function TechDownload() {
  const { org } = useParams();
  const { settings } = useSettings();
  const links = settings.billing.app_links || {};
  const link = links.web_url || (typeof window !== 'undefined' ? window.location.origin : '');
  const appLink = `${link.replace(/\/$/, '')}/${org}/tech/app`;
  const mobileLink = `${link.replace(/\/$/, '')}/${org}/tech/mobile`;
  const [qrData, setQrData] = useState<string>('');
  const techParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tech') : '';
  useEffect(() => {
    QRCode.toDataURL(link, { width: 180, margin: 1 }).then(setQrData).catch(() => setQrData(''));
  }, [link]);
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded overflow-hidden flex items-center justify-center">
            {settings.branding.logo_url || '/branding/bez-logo.png' ? (
              <img src={settings.branding.logo_url || '/branding/bez-logo.png'} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-gray-400">Logo</span>
            )}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: settings.branding.primary_color || '#111827' }}>{settings.orgProfile.name || org} Technician Access</h1>
        </div>
        <p className="mt-2 text-gray-600">Choose the interface that fits your workflow. The Mobile App includes the full feature set.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a href={`${appLink}${techParam ? `?tech=${techParam}` : ''}`} target="_blank" rel="noreferrer" className="bg-white border border-gray-200 rounded p-4">
          <div className="font-semibold">Open Technician App</div>
          <div className="text-sm text-gray-600">Tabs: Scan, Assets, History</div>
        </a>
        <a href={`${mobileLink}${techParam ? `?tech=${techParam}` : ''}`} target="_blank" rel="noreferrer" className="bg-white border border-gray-200 rounded p-4">
          <div className="font-semibold">Open Mobile App (Full Features)</div>
          <div className="text-sm text-gray-600">Dashboard, Clients, Assets, Jobs, NFC, Reports</div>
        </a>
      </div>
      <div className="bg-white border border-gray-200 rounded p-4">
        <h2 className="text-lg font-semibold">Feature Overview</h2>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
          <div className="p-2 border border-gray-200 rounded">Jobs: create, checklist, notes, photos, signatures</div>
          <div className="p-2 border border-gray-200 rounded">NFC: write tags, read tags, simulate tap</div>
          <div className="p-2 border border-gray-200 rounded">Assets: card grid, filters, status updates</div>
          <div className="p-2 border border-gray-200 rounded">Photos: inline upload with automatic watermark</div>
          <div className="p-2 border border-gray-200 rounded">Reports: export daily CSV/PDF</div>
          <div className="p-2 border border-gray-200 rounded">Offline queue and real-time activity log</div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded p-4">
        <h2 className="text-lg font-semibold">Install as App</h2>
        <p className="text-sm text-gray-600 mt-1">Add to Home Screen from your browser menu to install the web app on mobile. On desktop, bookmark or pin the site for quick access.</p>
      </div>
    </div>
  );
}
