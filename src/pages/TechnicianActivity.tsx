import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';
import { Calendar, Clock, User, Building, Wrench, CheckCircle, XCircle, Clock3, Filter, Download, Activity as ActivityIcon } from 'lucide-react';

interface Activity {
  id: string;
  technician_id: string;
  technician_name: string;
  client_id: string;
  client_name: string;
  asset_id: string;
  asset_name: string;
  asset_tag: string;
  activity_type: 'checkin' | 'checkout' | 'maintenance' | 'repair' | 'inspection';
  description: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  status: 'completed' | 'in_progress' | 'cancelled' | 'scheduled';
  notes?: string;
  location?: string;
}

interface Technician {
  id: string;
  full_name: string;
  specialization?: string;
}

interface Client {
  id: string;
  name: string;
}

export const TechnicianActivity: React.FC = () => {
  const { org } = useParams<{ org: string }>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedActivityType, setSelectedActivityType] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0], // Today
  });

  useEffect(() => {
    loadData();
  }, [org]);

  const loadData = async () => {
    if (!SUPABASE_CONFIGURED) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Load technicians
      const { data: techData } = await supabase
        .from('technicians')
        .select('id, full_name, specialization')
        .eq('org_id', org)
        .eq('is_active', true)
        .order('full_name');

      // Load clients
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, name')
        .eq('org_id', org)
        .order('name');

      // Load activities
      await loadActivities();

      setTechnicians(techData || []);
      setClients(clientData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    if (!SUPABASE_CONFIGURED) {
      setActivities([]);
      return;
    }
    
    try {
      let query = supabase
        .from('technician_activities')
        .select(`
          *,
          technician:technicians!technician_id(id, full_name),
          client:clients!client_id(id, name),
          asset:assets!asset_id(id, name, asset_tag)
        `)
        .eq('org_id', org)
        .gte('start_time', `${dateRange.start}T00:00:00`)
        .lte('start_time', `${dateRange.end}T23:59:59`)
        .order('start_time', { ascending: false });

      if (selectedTechnician) {
        query = query.eq('technician_id', selectedTechnician);
      }
      if (selectedClient) {
        query = query.eq('client_id', selectedClient);
      }
      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }
      if (selectedActivityType) {
        query = query.eq('activity_type', selectedActivityType);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedActivities = (data || []).map((item: any) => ({
        id: item.id,
        technician_id: item.technician_id,
        technician_name: item.technician?.full_name || 'Unknown',
        client_id: item.client_id,
        client_name: item.client?.name || 'Unknown',
        asset_id: item.asset_id,
        asset_name: item.asset?.name || 'Unknown',
        asset_tag: item.asset?.asset_tag || 'N/A',
        activity_type: item.activity_type,
        description: item.description,
        start_time: item.start_time,
        end_time: item.end_time,
        duration_minutes: item.duration_minutes,
        status: item.status,
        notes: item.notes,
        location: item.location,
      }));

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'checkin':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'checkout':
        return <Clock3 className="w-4 h-4 text-blue-600" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-orange-600" />;
      case 'repair':
        return <Wrench className="w-4 h-4 text-red-600" />;
      case 'inspection':
        return <CheckCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'checkin':
        return 'bg-green-100 text-green-800';
      case 'checkout':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'repair':
        return 'bg-red-100 text-red-800';
      case 'inspection':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Technician', 'Client', 'Asset', 'Activity', 'Status', 'Duration', 'Description'],
      ...activities.map(activity => [
        new Date(activity.start_time).toLocaleDateString(),
        activity.technician_name,
        activity.client_name,
        `${activity.asset_name} (${activity.asset_tag})`,
        activity.activity_type,
        activity.status,
        formatDuration(activity.duration_minutes),
        activity.description,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `technician-activities-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSelectedTechnician('');
    setSelectedClient('');
    setSelectedStatus('');
    setSelectedActivityType('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Technician Activity Tracking</h1>
        <p className="mt-2 text-gray-600">Track what each technician has done and for which clients</p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Filters</h2>
          <div className="flex space-x-2">
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Filters
            </button>
            <button
              onClick={exportData}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technician
            </label>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Technicians</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity Type
            </label>
            <select
              value={selectedActivityType}
              onChange={(e) => setSelectedActivityType(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="checkin">Check-in</option>
              <option value="checkout">Check-out</option>
              <option value="maintenance">Maintenance</option>
              <option value="repair">Repair</option>
              <option value="inspection">Inspection</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="scheduled">Scheduled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <button
          onClick={loadActivities}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Apply Filters
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ActivityIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Activities</p>
              <p className="text-2xl font-semibold text-gray-900">{activities.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activities.filter(a => a.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">
                {activities.filter(a => a.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Technicians</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(activities.map(a => a.technician_id)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activities List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <ActivityIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600">Try adjusting your filters or date range.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activities.map((activity) => (
                <div key={activity.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {activity.description}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(activity.activity_type)}`}>
                              {activity.activity_type}
                            </span>
                            <span className="flex items-center text-xs text-gray-500">
                              {getStatusIcon(activity.status)}
                              <span className="ml-1 capitalize">{activity.status.replace('_', ' ')}</span>
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{activity.technician_name}</span>
                          </div>
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{activity.client_name}</span>
                          </div>
                          <div className="flex items-center">
                            <Wrench className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{activity.asset_name} ({activity.asset_tag})</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>{formatDuration(activity.duration_minutes)}</span>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>
                            {new Date(activity.start_time).toLocaleString()} - 
                            {activity.end_time ? new Date(activity.end_time).toLocaleString() : 'Ongoing'}
                          </span>
                        </div>

                        {activity.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Notes:</strong> {activity.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};