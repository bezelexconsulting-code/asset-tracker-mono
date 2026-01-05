import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useSettings } from '../contexts/SettingsContext';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'qrcode';

export default function UsersRoles() {
  const { org } = useParams();
  const { settings } = useSettings();
  const { listTechnicians } = useData();
  const techs = listTechnicians();

  const supportEmail = settings.billing.support_email || 'support@example.com';
  const seats = settings.billing.technician_seats || 0;

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  const links = settings.billing.app_links || {};
  const web = links.web_url || '';
  const [qrData, setQrData] = useState<string>('');
  useEffect(() => {
    if (web) QRCode.toDataURL(web, { width: 130, margin: 1 }).then(setQrData).catch(() => setQrData(''));
  }, [web]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Technician Access</h1>
      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">Technician slots: <span className="font-semibold">{seats}</span></div>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Self-add disabled</span>
        </div>
        <p className="text-sm text-gray-600">To add a technician, please contact us. Technicians can download the app using the links below after we enable seats for your organization.</p>
        <div className="flex items-center space-x-2">
          <a href={`mailto:${supportEmail}?subject=Technician request for ${org}`} className="px-3 py-2 rounded bg-blue-600 text-white">Request Technician</a>
          <Link to={`/${org}/tech`} className="px-3 py-2 rounded bg-gray-900 text-white">Open Technician Download Page</Link>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">App Download</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-700">Website Link</div>
            <div className="flex items-center space-x-2 mt-1">
              <a className="text-blue-600 hover:underline" href={web} target="_blank" rel="noreferrer">Open</a>
              <button className="px-2 py-1 text-xs rounded bg-gray-100" onClick={() => copy(web)}>Copy</button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {qrData ? (
              <img src={qrData} alt="QR" className="w-20 h-20 border border-gray-200 rounded" />
            ) : (
              <div className="w-20 h-20 border border-gray-200 rounded flex items-center justify-center text-xs text-gray-500">QR unavailable</div>
            )}
            <div className="text-xs text-gray-500 break-all">{web}</div>
          </div>
        </div>
        <p className="text-sm text-gray-600">On mobile, use “Add to Home Screen” in your browser to install the web app.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invite</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {techs.map((t) => (
              <tr key={t.id}>
                <td className="px-6 py-4 text-sm">{t.name}</td>
                <td className="px-6 py-4 text-sm">{t.email} • {t.phone}</td>
                <td className="px-6 py-4 text-sm">{t.specialization}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${t.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{t.status}</span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {(() => {
                    const link = `${window.location.origin}/${org}/tech?tech=${t.id}`;
                    const subject = encodeURIComponent(`Your Technician App Access`);
                    const body = encodeURIComponent(`Hi ${t.name || ''},\n\nUse the link below to open and install the Technician web app for ${settings.orgProfile.name || org}. You can add it to your Home Screen for easy access.\n\n${link}\n\nThanks!`);
                    const mailto = `mailto:${t.email || ''}?subject=${subject}&body=${body}`;
                    return (
                      <div className="flex items-center space-x-2">
                        <a href={mailto} className="px-3 py-2 rounded bg-blue-600 text-white">Email Invite</a>
                        <button className="px-3 py-2 rounded bg-gray-100 text-gray-700" onClick={() => navigator.clipboard?.writeText(link)}>Copy Link</button>
                      </div>
                    );
                  })()}
                </td>
              </tr>
            ))}
            {techs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">No technicians</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
