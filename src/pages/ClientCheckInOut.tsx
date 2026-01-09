import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  QrCodeIcon, 
  CubeIcon,
  ArrowUpTrayIcon, 
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { SUPABASE_CONFIGURED, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import NFCScanner from '../components/NFCScanner';
import { addPendingTransaction, processQueue } from '../lib/offlineQueue';

interface Asset {
  id: string;
  asset_tag: string;
  name: string;
  description?: string;
  status: string;
  category?: { name: string };
  location?: { name: string };
  assigned_to?: { full_name: string };
  image_url?: string;
  nfc_tag?: { tag_id: string };
}

interface Location {
  id: string;
  name: string;
}

export default function ClientCheckInOut() {
  const { org } = useParams<{ org: string }>();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') as 'checkin' | 'checkout' | null;
  const preselectedAssetId = searchParams.get('asset');

  const [step, setStep] = useState<'select' | 'scan' | 'details' | 'confirm'>('select');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [formData, setFormData] = useState({
    condition: 'good',
    notes: '',
    location_id: '',
    expected_return_date: '',
    purpose: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [org, user]);

  useEffect(() => {
    if (preselectedAssetId && assets.length > 0) {
      const asset = assets.find(a => a.id === preselectedAssetId);
      if (asset) {
        setSelectedAsset(asset);
        setStep('details');
      }
    }
  }, [preselectedAssetId, assets]);

  const loadInitialData = async () => {
    if (!SUPABASE_CONFIGURED || !user) return;
    try {
      setLoading(true);
      const { data: orgRow } = await supabase.from('organizations').select('id').eq('slug', org);
      const orgId = orgRow?.[0]?.id;
      const { data: locationsData } = await supabase.from('locations').select('id,name').eq('org_id', orgId);
      setLocations(locationsData || []);
      let { data: assetsData } = await supabase.from('assets').select('*').eq('org_id', orgId).order('created_at', { ascending: false });
      if (mode === 'checkin') {
        assetsData = (assetsData || []).filter(a => a.status === 'checked_out');
      } else {
        assetsData = (assetsData || []).filter(a => a.status === 'available');
      }
      setAssets((assetsData || []) as any);
      await processQueue(async (tx)=>{
        const { error } = await supabase.from('transactions').insert(tx as any);
        if (error) throw error;
      });
    } catch (err) {
      setError('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleNFCSuccess = (scannedAsset: any) => {
    setSelectedAsset(scannedAsset);
    setStep('details');
    setError(null);
  };

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    setStep('details');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedAsset || !user) return;

    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();
      
      const { data: orgRow } = await supabase.from('organizations').select('id').eq('slug', org);
      const orgId = orgRow?.[0]?.id;
      if (mode === 'checkin') {
        const { error: updateError } = await supabase.from('assets').update({ status: 'available', location_id: formData.location_id || null }).eq('id', selectedAsset.id);
        if (updateError) throw updateError;
        const tx = { org_id: orgId, asset_id: selectedAsset.id, type: 'check_in', from_location_id: selectedAsset.location_id || null, to_location_id: formData.location_id || null, notes: formData.notes, created_at: now };
        const { error: transactionError } = await supabase.from('transactions').insert(tx as any);
        if (transactionError) throw transactionError;
      } else {
        const { error: updateError } = await supabase.from('assets').update({ status: 'checked_out', location_id: formData.location_id || null }).eq('id', selectedAsset.id);
        if (updateError) throw updateError;
        const tx = { org_id: orgId, asset_id: selectedAsset.id, type: 'check_out', from_location_id: selectedAsset.location_id || null, to_location_id: formData.location_id || null, notes: formData.notes, created_at: now };
        const { error: transactionError } = await supabase.from('transactions').insert(tx as any);
        if (transactionError) throw transactionError;
      }

      setSuccess(true);
      
      // Reload assets after successful transaction
      setTimeout(() => {
        loadInitialData();
        setStep('select');
        setSelectedAsset(null);
        setFormData({
          condition: 'good',
          notes: '',
          location_id: '',
          expected_return_date: '',
          purpose: ''
        });
        setSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('Error processing transaction:', err);
      try {
        const { data: orgRow } = await supabase.from('organizations').select('id').eq('slug', org);
        const orgId = orgRow?.[0]?.id;
        addPendingTransaction({
          org_id: orgId,
          asset_id: selectedAsset!.id,
          type: mode === 'checkin' ? 'check_in' : 'check_out',
          from_location_id: selectedAsset!.location_id || null,
          to_location_id: formData.location_id || null,
          notes: formData.notes,
          created_at: new Date().toISOString()
        });
      } catch {}
      setError('Failed to process transaction');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('select');
    setSelectedAsset(null);
    setError(null);
    setSuccess(false);
    setFormData({
      condition: 'good',
      notes: '',
      location_id: '',
      expected_return_date: '',
      purpose: ''
    });
  };

  if (loading && step === 'select') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {mode === 'checkin' ? 'Check In Asset' : 'Check Out Asset'}
        </h1>
        <p className="mt-2 text-gray-600">
          {mode === 'checkin' 
            ? 'Return an asset you currently have checked out'
            : 'Assign an asset to yourself for temporary use'
          }
        </p>
      </div>

      {/* Mode Selection */}
      {!mode && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to={`/${org}/check?mode=checkout`}
            className="block p-6 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center">
              <ArrowUpTrayIcon className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Check Out Asset</h3>
                <p className="text-sm text-blue-700 mt-1">Assign an asset to yourself</p>
              </div>
            </div>
          </Link>
          <Link
            to={`/${org}/check?mode=checkin`}
            className="block p-6 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center">
              <ArrowDownTrayIcon className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">Check In Asset</h3>
                <p className="text-sm text-green-700 mt-1">Return an assigned asset</p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Step 1: Select Asset */}
      {step === 'select' && mode && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'checkin' ? 'Select Asset to Return' : 'Select Asset to Check Out'}
            </h2>
            <button
              onClick={() => setStep('scan')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <QrCodeIcon className="h-4 w-4 mr-2" />
              Scan NFC Instead
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleAssetSelect(asset)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {asset.image_url ? (
                      <img
                        src={asset.image_url}
                        alt={asset.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <CubeIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{asset.name}</h3>
                    <p className="text-sm text-gray-500">{asset.asset_tag}</p>
                    {asset.category && (
                      <p className="text-xs text-gray-400">{asset.category.name}</p>
                    )}
                    {asset.location && (
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        {asset.location.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {assets.length === 0 && (
            <div className="text-center py-12">
              <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {mode === 'checkin' ? 'No assets to return' : 'No assets available'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {mode === 'checkin' 
                  ? 'You don\'t have any assets checked out.'
                  : 'All assets are currently assigned to other users.'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* NFC Scanner */}
      {step === 'scan' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Scan NFC Tag</h2>
            <button
              onClick={() => setStep('select')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Back to list
            </button>
          </div>

          <NFCScanner
            onScanSuccess={handleNFCSuccess}
            className="max-w-2xl mx-auto"
          />
        </div>
      )}

      {/* Asset Details & Confirmation */}
      {step === 'details' && selectedAsset && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Confirm Transaction</h2>
            <button
              onClick={resetForm}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← Start over
            </button>
          </div>

          {/* Asset Info */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {selectedAsset.image_url ? (
                  <img
                    src={selectedAsset.image_url}
                    alt={selectedAsset.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <CubeIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{selectedAsset.name}</h3>
                <p className="text-sm text-gray-500">{selectedAsset.asset_tag}</p>
                {selectedAsset.category && (
                  <p className="text-sm text-gray-600">{selectedAsset.category.name}</p>
                )}
                {selectedAsset.description && (
                  <p className="text-sm text-gray-600 mt-2">{selectedAsset.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Transaction Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({...formData, condition: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  value={formData.location_id}
                  onChange={(e) => setFormData({...formData, location_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select location...</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              {mode === 'checkout' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Return Date
                    </label>
                    <input
                      type="date"
                      value={formData.expected_return_date}
                      onChange={(e) => setFormData({...formData, expected_return_date: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purpose
                    </label>
                    <input
                      type="text"
                      value={formData.purpose}
                      onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                      placeholder="e.g., Project work, Meeting, Field work"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  placeholder="Any additional notes..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    {mode === 'checkin' ? 'Asset checked in successfully!' : 'Asset checked out successfully!'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.location_id || (mode === 'checkout' && !formData.expected_return_date)}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                mode === 'checkin'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  {mode === 'checkin' ? (
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  ) : (
                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                  )}
                  {mode === 'checkin' ? 'Check In' : 'Check Out'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
