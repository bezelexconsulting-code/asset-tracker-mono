import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CubeIcon, 
  QrCodeIcon, 
  ArrowUpTrayIcon, 
  ArrowDownTrayIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { SUPABASE_CONFIGURED, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface QuickStat {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href?: string;
}

interface RecentActivity {
  id: string;
  type: 'checkin' | 'checkout';
  asset_tag: string;
  asset_name: string;
  timestamp: string;
  location?: string;
}

export default function ClientDashboard() {
  const { org } = useParams<{ org: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [assignedAssets, setAssignedAssets] = useState<any[]>([]);
  const [overdueAssets, setOverdueAssets] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [org, user]);

  const loadDashboardData = async () => {
    if (!SUPABASE_CONFIGURED || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: orgRow } = await supabase.from('organizations').select('id').eq('slug', org);
      const orgId = orgRow?.[0]?.id;
      if (!orgId) { setAssignedAssets([]); setRecentActivity([]); setOverdueAssets([]); setStats([]); setLoading(false); return; }
      
      // Assigned assets: show checked_out assets for this org
      const { data: assignedData, error: assignedError } = await supabase
        .from('assets')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'checked_out')
        .order('updated_at', { ascending: false });

      if (assignedError) throw assignedError;
      setAssignedAssets(assignedData || []);

      // Load recent activity for this user
      const { data: activityData, error: activityError } = await supabase
        .from('transactions')
        .select('*, asset:assets(name,asset_tag), from_location:locations(name), to_location:locations(name)')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (activityError) throw activityError;
      
      const formattedActivity: RecentActivity[] = (activityData || []).map((t: any) => ({
        id: t.id,
        type: (t.type === 'check_in' ? 'checkin' : 'checkout') as 'checkin' | 'checkout',
        asset_tag: t.asset?.asset_tag || '',
        asset_name: t.asset?.name || '',
        timestamp: t.created_at,
        location: t.to_location?.name || t.from_location?.name || ''
      }));
      setRecentActivity(formattedActivity);

      // Overdue assets: heuristic — checked_out more than 7 days ago
      const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString();
      const { data: overdueData, error: overdueError } = await supabase
        .from('assets')
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'checked_out')
        .lt('created_at', sevenDaysAgo)
        .order('created_at', { ascending: true });

      if (overdueError) throw overdueError;
      setOverdueAssets(overdueData || []);

      // Calculate stats
      const stats: QuickStat[] = [
        {
          label: 'Assets Assigned',
          value: assignedData?.length || 0,
          icon: CubeIcon,
          color: 'bg-blue-500',
          href: `/${org}/assets`
        },
        {
          label: 'Overdue Returns',
          value: overdueData?.length || 0,
          icon: ExclamationTriangleIcon,
          color: 'bg-red-500',
          href: `/${org}/assets?filter=overdue`
        },
        {
          label: 'Check-ins Today',
          value: formattedActivity.filter(a => 
            a.type === 'checkin' && 
            new Date(a.timestamp).toDateString() === new Date().toDateString()
          ).length,
          icon: ArrowDownTrayIcon,
          color: 'bg-green-500',
          href: `/${org}/check`
        },
        {
          label: 'Check-outs Today',
          value: formattedActivity.filter(a => 
            a.type === 'checkout' && 
            new Date(a.timestamp).toDateString() === new Date().toDateString()
          ).length,
          icon: ArrowUpTrayIcon,
          color: 'bg-orange-500',
          href: `/${org}/check`
        }
      ];
      setStats(stats);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Check Out Asset',
      description: 'Assign an asset to yourself',
      icon: ArrowUpTrayIcon,
      href: `/${org}/check?mode=checkout`,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'Check In Asset',
      description: 'Return an assigned asset',
      icon: ArrowDownTrayIcon,
      href: `/${org}/check?mode=checkin`,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Scan NFC Tag',
      description: 'Quickly identify an asset',
      icon: QrCodeIcon,
      href: `/${org}/nfc`,
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

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
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.full_name || 'Client'}!</h1>
        <p className="mt-2 text-gray-600">Here's what's happening with your assets today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.href || '#'}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className={`block p-6 rounded-lg text-white ${action.color} transition-colors`}
            >
              <div className="flex items-center">
                <action.icon className="h-8 w-8 mr-3" />
                <div>
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assigned Assets */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">My Assigned Assets</h3>
            <p className="text-sm text-gray-500">Assets currently checked out to you</p>
          </div>
          <div className="p-6">
            {assignedAssets.length > 0 ? (
              <div className="space-y-4">
                {assignedAssets.slice(0, 3).map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
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
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{asset.name}</p>
                        <p className="text-sm text-gray-500">{asset.asset_tag}</p>
                        <p className="text-xs text-gray-400">{asset.category?.name}</p>
                      </div>
                    </div>
                    <Link
                      to={`/${org}/assets/${asset.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
                {assignedAssets.length > 3 && (
                  <Link
                    to={`/${org}/assets`}
                    className="block text-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    View all {assignedAssets.length} assets
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No assets currently assigned to you.</p>
                <Link
                  to={`/${org}/check?mode=checkout`}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Check Out an Asset
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-500">Your latest check-ins and check-outs</p>
          </div>
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className={`flex-shrink-0 p-2 rounded-full ${
                      activity.type === 'checkin' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {activity.type === 'checkin' ? (
                        <ArrowDownTrayIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowUpTrayIcon className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.type === 'checkin' ? 'Checked in' : 'Checked out'} {activity.asset_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.asset_tag} • {activity.location || 'No location'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                <Link
                  to={`/${org}/check`}
                  className="block text-center text-sm text-blue-600 hover:text-blue-800"
                >
                  View all activity
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No recent activity.</p>
                <Link
                  to={`/${org}/check?mode=checkout`}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Check Out an Asset
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overdue Alerts */}
      {overdueAssets.length > 0 && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Overdue Assets</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You have {overdueAssets.length} asset(s) that are overdue for return:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {overdueAssets.slice(0, 3).map((asset) => (
                    <li key={asset.id}>
                      {asset.name} ({asset.asset_tag}) - Due {new Date(asset.transactions[0]?.expected_return_date).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <Link
                  to={`/${org}/check?mode=checkin`}
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Return these assets now →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
