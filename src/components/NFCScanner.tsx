import React, { useState, useEffect } from 'react';
import { useNFC } from '../hooks/useNFC';
import { SUPABASE_CONFIGURED } from '../lib/supabase';
import { CheckCircleIcon, WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface NFCScannerProps {
  onScanSuccess?: (asset: any) => void;
  onScanError?: (error: string) => void;
  className?: string;
}

export const NFCScanner: React.FC<NFCScannerProps> = ({ 
  onScanSuccess, 
  onScanError, 
  className = '' 
}) => {
  const { 
    isSupported, 
    isScanning, 
    lastScannedAsset, 
    scanError, 
    scanNFC, 
    resetErrors 
  } = useNFC();

  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isScanning) {
      setScanStatus('scanning');
    } else if (scanError) {
      setScanStatus('error');
      onScanError?.(scanError);
    } else if (lastScannedAsset?.asset) {
      setScanStatus('success');
      onScanSuccess?.(lastScannedAsset.asset);
    } else {
      setScanStatus('idle');
    }
  }, [isScanning, scanError, lastScannedAsset, onScanSuccess, onScanError]);

  const handleScan = async () => {
    resetErrors();
    await scanNFC();
  };

  if (!isSupported) {
    return (
      <div className={`p-6 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">NFC Not Supported</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your browser or device doesn't support NFC. Please use a compatible device or browser.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="text-center">
        {!SUPABASE_CONFIGURED && (
          <div className="mb-4 p-3 border border-yellow-200 bg-yellow-50 rounded text-sm text-yellow-800">
            Supabase is not configured. Scans will not fetch asset details until environment variables are set.
          </div>
        )}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          {scanStatus === 'scanning' && (
            <div className="animate-spin">
              <WifiIcon className="h-6 w-6 text-blue-600" />
            </div>
          )}
          {scanStatus === 'success' && (
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          )}
          {scanStatus === 'error' && (
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          )}
          {scanStatus === 'idle' && (
            <WifiIcon className="h-6 w-6 text-gray-400" />
          )}
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {scanStatus === 'scanning' && 'Scanning for NFC Tag...'}
          {scanStatus === 'success' && 'NFC Tag Scanned Successfully'}
          {scanStatus === 'error' && 'Scan Failed'}
          {scanStatus === 'idle' && 'Ready to Scan NFC Tag'}
        </h3>

        <p className="text-sm text-gray-500 mb-4">
          {scanStatus === 'scanning' && 'Hold your device near the NFC tag'}
          {scanStatus === 'success' && 'Asset information retrieved successfully'}
          {scanStatus === 'error' && (scanError || 'An error occurred during scanning')}
          {scanStatus === 'idle' && 'Tap the button below and hold your device near an NFC tag'}
        </p>

        {lastScannedAsset?.asset && scanStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-left">
            <h4 className="font-medium text-green-900 mb-2">Asset Details</h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Asset Tag:</dt>
                <dd className="font-medium">{lastScannedAsset.asset.asset_tag}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Name:</dt>
                <dd className="font-medium">{lastScannedAsset.asset.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status:</dt>
                <dd className="font-medium">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    lastScannedAsset.asset.status === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {lastScannedAsset.asset.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        )}

        <button
          onClick={handleScan}
          disabled={isScanning}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            scanStatus === 'scanning'
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {scanStatus === 'scanning' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Scanning...
            </>
          ) : (
            'Scan NFC Tag'
          )}
        </button>
      </div>
    </div>
  );
};

export default NFCScanner;
