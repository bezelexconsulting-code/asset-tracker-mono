import NFCScanner from '../components/NFCScanner';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

export default function CheckInOut() {
  const { org } = useParams();
  const [assetTagInput, setAssetTagInput] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Check-in / Check-out</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold">Scan via NFC</h2>
          <NFCScanner onScanSuccess={() => setMessage('Scan successful. Proceed with assignment.')} className="mt-3" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Manual Entry</h2>
          <div className="mt-3 bg-white border border-gray-200 rounded p-4">
            <label className="block text-sm text-gray-700">Asset Tag</label>
            <input
              value={assetTagInput}
              onChange={(e) => setAssetTagInput(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
              placeholder="e.g. AST-001"
            />
            <div className="mt-3 flex space-x-2">
              <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={() => setMessage('Checked out')}>Check-out</button>
              <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={() => setMessage('Checked in')}>Check-in</button>
            </div>
            {message && <div className="mt-3 text-sm text-gray-700">{message}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
