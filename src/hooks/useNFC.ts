import { useState, useCallback, useEffect } from 'react';
import { nfcService, NFCScanResult, NFCWriteResult, NFCAssetData } from '../services/nfcService';

export interface UseNFCReturn {
  isSupported: boolean;
  isScanning: boolean;
  isWriting: boolean;
  lastScannedAsset: NFCScanResult | null;
  scanError: string | null;
  writeError: string | null;
  scanNFC: () => Promise<void>;
  writeNFC: (assetData: NFCAssetData) => Promise<NFCWriteResult>;
  resetErrors: () => void;
}

export const useNFC = (): UseNFCReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [lastScannedAsset, setLastScannedAsset] = useState<NFCScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);

  useEffect(() => {
    // Check NFC support on mount
    const checkSupport = async () => {
      try {
        const supported = nfcService.isNFCSupported();
        setIsSupported(supported);
      } catch (error) {
        console.error('Error checking NFC support:', error);
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  const scanNFC = useCallback(async () => {
    if (!isSupported) {
      setScanError('NFC is not supported in this browser or device');
      return;
    }

    setIsScanning(true);
    setScanError(null);

    try {
      const result = await nfcService.scanNFC();
      setLastScannedAsset(result);
      
      // Show success feedback
      if (result && result.tag_info.data_integrity === 'valid' && result.asset) {
        // You could trigger a success notification here
        console.log('NFC scan successful:', result);
      } else if (result && result.tag_info.data_integrity === 'tampered') {
        setScanError('Warning: NFC tag data appears to be tampered');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setScanError(errorMessage);
      console.error('NFC scan error:', error);
    } finally {
      setIsScanning(false);
    }
  }, [isSupported]);

  const writeNFC = useCallback(async (assetData: NFCAssetData) => {
    if (!isSupported) {
      setWriteError('NFC is not supported in this browser or device');
      return {
        success: false,
        message: 'NFC is not supported in this browser or device'
      };
    }

    setIsWriting(true);
    setWriteError(null);

    try {
      const result = await nfcService.writeNFC(assetData);
      
      if (result.success) {
        // Show success feedback
        console.log('NFC write successful:', result);
      } else {
        setWriteError(result.message);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setWriteError(errorMessage);
      console.error('NFC write error:', error);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsWriting(false);
    }
  }, [isSupported]);

  const resetErrors = useCallback(() => {
    setScanError(null);
    setWriteError(null);
  }, []);

  return {
    isSupported,
    isScanning,
    isWriting,
    lastScannedAsset,
    scanError,
    writeError,
    scanNFC,
    writeNFC,
    resetErrors,
  };
};

export default useNFC;