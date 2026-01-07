import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';
import { resolveOrgId } from '../lib/org';
import NFCScanner from '../components/NFCScanner';
import NFCTagProgrammer from '../components/NFCTagProgrammer';
import { QrCodeIcon, TagIcon, TableCellsIcon } from '@heroicons/react/24/outline';

interface Asset {
  id: string;
  asset_tag: string;
  name: string;
  status: string;
  has_nfc_tag: boolean;
  org_id: string;
}

interface NFCTag {
  id: string;
  tag_id: string;
  tag_type: string;
  asset_id: string;
  last_programmed: string;
  programmed_by: string;
  is_active: boolean;
  asset?: {
    name: string;
    asset_tag: string;
  };
}

const NFCManagement: React.FC = () => {
  const { org } = useParams<{ org: string }>();
  const [activeTab, setActiveTab] = useState<'scan' | 'program' | 'manage'>('scan');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [nfcTags, setNfcTags] = useState<NFCTag[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    (async ()=>{
      const orgId = await resolveOrgId(org);
      await fetchAssets(orgId || undefined);
      await fetchNFCTags(orgId || undefined);
    })();
  }, [org]);

  const fetchAssets = async (orgId?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets_v2')
        .select('*')
        .eq('org_id', orgId);

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNFCTags = async (orgId?: string) => {
    try {
      const { data, error } = await supabase
        .from('nfc_tags')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNfcTags(data || []);
    } catch (error) {
      console.error('Error fetching NFC tags:', error);
    }
  };

  const handleScanSuccess = (asset: any) => {
    console.log('NFC scan successful:', asset);
    // You could navigate to asset details or trigger a check-in/out workflow here
  };

  const handleProgramSuccess = (tagId: string) => {
    console.log('NFC tag programmed successfully:', tagId);
    fetchAssets();
    fetchNFCTags();
  };

  const handleDeactivateTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('nfc_tags')
        .update({ is_active: false })
        .eq('tag_id', tagId);

      if (error) throw error;
      fetchNFCTags();
    } catch (error) {
      console.error('Error deactivating NFC tag:', error);
    }
  };

  const tabs = [
    {
      id: 'scan',
      name: 'Scan NFC Tags',
      icon: QrCodeIcon,
      description: 'Read asset information from NFC tags'
    },
    {
      id: 'program',
      name: 'Program Tags',
      icon: TagIcon,
      description: 'Write asset data to NFC tags'
    },
    {
      id: 'manage',
      name: 'Manage Tags',
      icon: TableCellsIcon,
      description: 'View and manage all NFC tags'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">NFC Management</h1>
        <p className="mt-2 text-gray-600">
          Program, scan, and manage NFC tags for your assets
        </p>
      </div>

      {!SUPABASE_CONFIGURED && (
        <div className="mb-8 p-4 border border-yellow-200 bg-yellow-50 rounded">
          <div className="text-sm text-yellow-800">
            Supabase is not configured. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` to enable data features.
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'scan' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Scan NFC Tags</h2>
              <p className="mt-1 text-gray-600">
                Hold your device near an NFC tag to read asset information
              </p>
            </div>
            <NFCScanner 
              onScanSuccess={handleScanSuccess}
              className="max-w-2xl"
            />
          </div>
        )}

        {activeTab === 'program' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Program NFC Tags</h2>
              <p className="mt-1 text-gray-600">
                Select an asset and write its information to an NFC tag
              </p>
            </div>

            {/* Asset Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Asset to Program
              </label>
              <select
                value={selectedAsset?.id || ''}
                onChange={(e) => {
                  const asset = assets.find(a => a.id === e.target.value);
                  setSelectedAsset(asset || null);
                }}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Choose an asset...</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_tag} - {asset.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedAsset && SUPABASE_CONFIGURED && (
              <NFCTagProgrammer
                asset={selectedAsset}
                onProgramSuccess={handleProgramSuccess}
                className="max-w-2xl"
              />
            )}
          </div>
        )}

        {activeTab === 'manage' && SUPABASE_CONFIGURED && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Manage NFC Tags</h2>
              <p className="mt-1 text-gray-600">
                View and manage all NFC tags in your organization
              </p>
            </div>

            {/* NFC Tags Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tag ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tag Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Programmed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {nfcTags.map((tag) => (
                    <tr key={tag.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {tag.tag_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tag.asset ? (
                          <div>
                            <div className="font-medium">{tag.asset.name}</div>
                            <div className="text-gray-500">{tag.asset.asset_tag}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">No asset assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tag.tag_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(tag.last_programmed).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tag.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tag.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => handleDeactivateTag(tag.tag_id)}
                          disabled={!tag.is_active}
                          className={`text-sm ${
                            tag.is_active
                              ? 'text-red-600 hover:text-red-900'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {tag.is_active ? 'Deactivate' : 'Deactivated'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {nfcTags.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No NFC tags found. Start by programming some tags!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFCManagement;
