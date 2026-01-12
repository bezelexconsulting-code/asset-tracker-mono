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
  const [qrData, setQrData] = useState<string>('');
  const [installEvt, setInstallEvt] = useState<any>(null);
  const [installed, setInstalled] = useState<boolean>(false);
  const techParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tech') : '';
  useEffect(() => {
    QRCode.toDataURL(appLink, { width: 180, margin: 1 }).then(setQrData).catch(() => setQrData(''));
  }, [appLink]);

  useEffect(() => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(()=>{});
      }
      window.addEventListener('beforeinstallprompt', (e: any) => {
        e.preventDefault();
        setInstallEvt(e);
      });
      const media = window.matchMedia('(display-mode: standalone)');
      setInstalled(media.matches);
      media.addEventListener?.('change', () => setInstalled(media.matches));
    } catch {}
  }, []);
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
      <div className="grid grid-cols-1 gap-4">
        <a href={`${appLink}${techParam ? `?tech=${techParam}` : ''}`} target="_blank" rel="noreferrer" className="bg-white border border-gray-200 rounded p-4">
          <div className="font-semibold">Open App (Full Features)</div>
          <div className="text-sm text-gray-600">Dashboard, Clients, Assets, Jobs, NFC, Reports</div>
        </a>
        <a href={`/${org}/tech/login`} className="bg-white border border-gray-200 rounded p-4">
          <div className="font-semibold">Technician Login</div>
          <div className="text-sm text-gray-600">Sign in to your technician account</div>
        </a>
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="text-sm text-gray-700">Direct Link</div>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-xs text-gray-500 break-all">{`${appLink}${techParam ? `?tech=${techParam}` : ''}`}</span>
            <button className="px-2 py-1 text-xs rounded bg-gray-100" onClick={()=> navigator.clipboard?.writeText(`${appLink}${techParam ? `?tech=${techParam}` : ''}`)}>Copy</button>
          </div>
          {qrData && (
            <div className="mt-3">
              <img src={qrData} alt="QR" className="w-28 h-28 border border-gray-200 rounded" />
            </div>
          )}
          <div className="mt-3">
            {installed ? (
              <span className="text-xs text-green-700">Installed</span>
            ) : installEvt ? (
              <button className="px-3 py-2 rounded bg-blue-600 text-white text-xs" onClick={async()=>{ try { await installEvt.prompt(); setInstallEvt(null); } catch {} }}>Install App</button>
            ) : (
              <p className="text-xs text-gray-600">On Chrome Android, use “Add to Home screen”. On iOS Safari, use Share → Add to Home Screen.</p>
            )}
          </div>
        </div>
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
      <div className="bg-white border border-gray-200 rounded p-4">
        <h2 className="text-lg font-semibold">Login</h2>
        <p className="text-sm text-gray-600 mt-1">Use your organization login to access features.</p>
        <a href={`/${org}/login`} className="inline-block mt-2 px-3 py-2 rounded bg-blue-600 text-white">Open Login</a>
      </div>
    </div>
  );
}
