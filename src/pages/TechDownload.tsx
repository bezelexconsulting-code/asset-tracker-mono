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
    <div className="space-y-6 px-4 py-6 max-w-sm mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src={settings.branding.logo_url || '/branding/bez-logo.png'}
              onError={(e:any)=>{ e.currentTarget.src='/branding/bez-logo.png'; }}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-lg font-semibold" style={{ color: settings.branding.primary_color || '#111827' }}>{settings.orgProfile.name || org}</div>
            <div className="text-xs text-gray-500">Technician Access</div>
          </div>
        </div>
      </div>

      <a href={`/${org}/tech/login`} className="block bg-blue-600 text-white rounded-xl p-4 text-center text-base font-semibold">Login as Technician</a>
      <a href={`${appLink}${techParam ? `?tech=${techParam}` : ''}`} target="_blank" rel="noreferrer" className="block bg-gray-900 text-white rounded-xl p-4 text-center text-base font-semibold">Open Technician App</a>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="text-sm text-gray-700">Direct App Link</div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 break-all">{`${appLink}${techParam ? `?tech=${techParam}` : ''}`}</span>
          <button className="px-3 py-1 text-xs rounded bg-gray-100" onClick={()=> navigator.clipboard?.writeText(`${appLink}${techParam ? `?tech=${techParam}` : ''}`)}>Copy</button>
        </div>
        {qrData && (
          <div className="flex justify-center">
            <img src={qrData} alt="QR" className="w-28 h-28 border border-gray-200 rounded" />
          </div>
        )}
        <div className="pt-2">
          {installed ? (
            <span className="text-xs text-green-700">Installed</span>
          ) : installEvt ? (
            <button className="w-full px-3 py-2 rounded bg-blue-600 text-white text-sm" onClick={async()=>{ try { await installEvt.prompt(); setInstallEvt(null); } catch {} }}>Install App</button>
          ) : (
            <p className="text-xs text-gray-600">On Chrome Android, use “Add to Home screen”. On iOS Safari, use Share → Add to Home Screen.</p>
          )}
        </div>
      </div>
    </div>
  );
}
