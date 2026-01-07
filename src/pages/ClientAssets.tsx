import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CubeIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  QrCodeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { SUPABASE_CONFIGURED, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  created_at: string;
  updated_at: string;
}

interface FilterState {
  search: string;
  status: string;
  category: string;
  location: string;
  assigned_to: string;
  showOverdue: boolean;
}

export default function ClientAssets() {
  const { org } = useParams<{ org: string }>();
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: '',
    category: '',
    location: '',
    assigned_to: '',
    showOverdue: false
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadAssets();
    loadFilters();
  }, [org, user]);

  useEffect(() => {
    applyFilters();
  }, [assets, filters]);

  const loadAssets = async () => {
    if (!SUPABASE_CONFIGURED || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: orgRow } = await supabase.from('organizations').select('id').eq('slug', org);
      const orgId = orgRow?.[0]?.id;
      if (!orgId) { setAssets([]); setLoading(false); return; }
      // Load assets visible to this client (assigned to them or available)
      let query = supabase
        .from('assets_v2')
        .select('*')
        .eq('org_id', orgId)
        .order('updated_at', { ascending: false });

      // Client can see their assigned assets and available assets
      query = query.or(`assigned_to_id.eq.${user.id},status.eq.available`);

      const { data, error } = await query;

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilters = async () => {
    if (!SUPABASE_CONFIGURED) return;

    try {
      const { data: orgRow } = await supabase.from('organizations').select('id').eq('slug', org);
      const orgId = orgRow?.[0]?.id;
      if (!orgId) return;
      // Load categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('org_id', orgId);
      setCategories(categoriesData || []);

      // Load locations
      const { data: locationsData } = await supabase
        .from('locations')
        .select('id, name')
        .eq('org_id', orgId);
      setLocations(locationsData || []);
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...assets];

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(search) ||
        asset.asset_tag.toLowerCase().includes(search) ||
        asset.description?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(asset => asset.status === filters.status);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(asset => asset.category?.name === filters.category);
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(asset => asset.location?.name === filters.location);
    }

    // Assigned to filter
    if (filters.assigned_to) {
      if (filters.assigned_to === 'me') {
        filtered = filtered.filter(asset => asset.assigned_to?.full_name === user?.full_name);
      } else if (filters.assigned_to === 'unassigned') {
        filtered = filtered.filter(asset => !asset.assigned_to);
      }
    }

    // Overdue filter
    if (filters.showOverdue) {
      filtered = filtered.filter(asset => {
        // This would need to check transaction expected_return_date
        // For now, we'll filter by status 'overdue'
        return asset.status === 'overdue';
      });
    }

    setFilteredAssets(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof FilterState, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      category: '',
      location: '',
      assigned_to: '',
      showOverdue: false
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'checked_out': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'retired': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircleIcon className="h-4 w-4" />;
      case 'checked_out': return <ArrowUpTrayIcon className="h-4 w-4" />;
      case 'maintenance': return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'retired': return <ClockIcon className="h-4 w-4" />;
      case 'overdue': return <ExclamationTriangleIcon className="h-4 w-4" />;
      default: return <CubeIcon className="h-4 w-4" />;
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Assets</h1>
        <p className="mt-2 text-gray-600">View and manage assets assigned to you or available for checkout.</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
            showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          Filters
        </button>
        {(filters.status || filters.category || filters.location || filters.assigned_to || filters.showOverdue) && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="available">Available</option>
                <option value="checked_out">Checked Out</option>
                <option value="maintenance">Maintenance</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Locations</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assignment</label>
              <select
                value={filters.assigned_to}
                onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Assets</option>
                <option value="me">Assigned to Me</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.showOverdue}
                onChange={(e) => handleFilterChange('showOverdue', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Show only overdue assets</span>
            </label>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {paginatedAssets.length} of {filteredAssets.length} assets
        </p>
        <div className="flex space-x-2">
          <Link
            to={`/${org}/check?mode=checkout`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
            Check Out Asset
          </Link>
          <Link
            to={`/${org}/nfc`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <QrCodeIcon className="h-4 w-4 mr-2" />
            Scan NFC
          </Link>
        </div>
      </div>

      {/* Assets Grid */}
      {paginatedAssets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedAssets.map((asset) => (
            <div key={asset.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              {/* Asset Image */}
              <div className="aspect-w-16 aspect-h-9">
                {asset.image_url ? (
                  <img
                    src={asset.image_url}
                    alt={asset.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                    <CubeIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900 truncate">{asset.name}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                    {getStatusIcon(asset.status)}
                    <span className="ml-1">{asset.status.replace('_', ' ')}</span>
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{asset.asset_tag}</p>
                {asset.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{asset.description}</p>
                )}
                
                <div className="space-y-2 mb-4">
                  {asset.category && (
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Category:</span>
                      <span className="ml-2">{asset.category.name}</span>
                    </div>
                  )}
                  {asset.location && (
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Location:</span>
                      <span className="ml-2">{asset.location.name}</span>
                    </div>
                  )}
                  {asset.assigned_to && (
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Assigned to:</span>
                      <span className="ml-2">{asset.assigned_to.full_name}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Link
                    to={`/${org}/assets/${asset.id}`}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    View Details
                  </Link>
                  {asset.status === 'available' && (
                    <Link
                      to={`/${org}/check?mode=checkout&asset=${asset.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                      Check Out
                    </Link>
                  )}
                  {asset.status === 'checked_out' && asset.assigned_to?.full_name === user?.full_name && (
                    <Link
                      to={`/${org}/check?mode=checkin&asset=${asset.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Check In
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assets found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search ? 'Try adjusting your search terms.' : 'No assets match your current filters.'}
          </p>
          <div className="mt-6">
            <Link
              to={`/${org}/check?mode=checkout`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Check Out an Asset
            </Link>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
