import React, { useState, useEffect } from 'react';
import { useNFC } from '../hooks/useNFC';
import { NFCAssetData } from '../services/nfcService';
import { SUPABASE_CONFIGURED } from '../lib/supabase';
import { WifiIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface NFCTagProgrammerProps {
  asset: {
    id: string;
    asset_tag: string;
    name: string;
    org_id: string;
  };
  onProgramSuccess?: (tagId: string) => void;
  onProgramError?: (error: string) => void;
  className?: string;
}

export const NFCTagProgrammer: React.FC<NFCTagProgrammerProps> = ({ 
  asset, 
  onProgramSuccess, 
  onProgramError, 
  className = '' 
}) => {
  const { 
    isSupported, 
    isWriting, 
    writeError, 
    writeNFC, 
    resetErrors 
  } = useNFC();

  const [programStatus, setProgramStatus] = useState<'idle' | 'writing' | 'success' | 'error'>('idle');
  const [tagId, setTagId] = useState<string>('');

  useEffect(() => {
    if (isWriting) {
      setProgramStatus('writing');
    } else if (writeError) {
      setProgramStatus('error');
      onProgramError?.(writeError);
    } else if (tagId) {
      setProgramStatus('success');
      onProgramSuccess?.(tagId);
    } else {
      setProgramStatus('idle');
    }
  }, [isWriting, writeError, tagId, onProgramSuccess, onProgramError]);

  const handleProgram = async () => {
    resetErrors();
    
    const assetData: NFCAssetData = {
      asset_id: asset.id,
      asset_tag: asset.asset_tag,
      name: asset.name,
      checksum: `${asset.id}-${asset.asset_tag}-${Date.now()}`.slice(0, 16), // Simple checksum
      timestamp: Date.now(),
      org_id: asset.org_id
    };

    try {
      const result = await writeNFC(assetData);
      if (result.success && result.tag_id) {
        setTagId(result.tag_id);
        onProgramSuccess?.(result.tag_id);
      } else if (!result.success) {
        onProgramError?.(result.message);
      }
    } catch (error) {
      console.error('NFC programming error:', error);
      onProgramError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  if (!isSupported) {
    return (
      <div className={`p-6 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">NFC Not Supported</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your browser or device doesn't support NFC programming. Please use a compatible device or browser.
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
            Supabase is not configured. Programming will be disabled until environment variables are set.
          </div>
        )}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          {programStatus === 'writing' && (
            <div className="animate-spin">
              <WifiIcon className="h-6 w-6 text-blue-600" />
            </div>
          )}
          {programStatus === 'success' && (
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          )}
          {programStatus === 'error' && (
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          )}
          {programStatus === 'idle' && (
            <WifiIcon className="h-6 w-6 text-gray-400" />
          )}
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {programStatus === 'writing' && 'Programming NFC Tag...'}
          {programStatus === 'success' && 'NFC Tag Programmed Successfully'}
          {programStatus === 'error' && 'Programming Failed'}
          {programStatus === 'idle' && 'Ready to Program NFC Tag'}
        </h3>

        <p className="text-sm text-gray-500 mb-4">
          {programStatus === 'writing' && 'Hold your device near the NFC tag to program'}
          {programStatus === 'success' && `Tag ID: ${tagId}`}
          {programStatus === 'error' && (writeError || 'An error occurred during programming')}
          {programStatus === 'idle' && 'This will write asset information to the NFC tag'}
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-left">
          <h4 className="font-medium text-gray-900 mb-2">Asset Information to Program</h4>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Asset Tag:</dt>
              <dd className="font-medium">{asset.asset_tag}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Name:</dt>
              <dd className="font-medium">{asset.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Asset ID:</dt>
              <dd className="font-medium font-mono text-xs">{asset.id}</dd>
            </div>
          </dl>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleProgram}
            disabled={isWriting || programStatus === 'success'}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isWriting || programStatus === 'success'
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {programStatus === 'writing' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Programming...
              </>
            ) : programStatus === 'success' ? (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Programmed
              </>
            ) : (
              'Program NFC Tag'
            )}
          </button>
          
          {programStatus === 'success' && (
            <button
              onClick={() => {
                setProgramStatus('idle');
                setTagId('');
                resetErrors();
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Program Another Tag
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NFCTagProgrammer;
