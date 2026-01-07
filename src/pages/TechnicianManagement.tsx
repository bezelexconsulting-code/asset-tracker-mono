import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';
import { UserPlus, Edit2, Trash2, Mail, Phone, User, Calendar, Wrench, Activity } from 'lucide-react';

const technicianSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  license_number: z.string().optional(),
  years_experience: z.number().min(0).max(50).optional(),
  is_active: z.boolean(),
  notes: z.string().optional(),
});

type TechnicianFormData = z.infer<typeof technicianSchema>;

interface Technician {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  specialization?: string;
  license_number?: string;
  years_experience?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  work_order_count: number;
  client_count: number;
  average_rating?: number;
}

export const TechnicianManagement: React.FC = () => {
  const { org } = useParams<{ org: string }>();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TechnicianFormData>({
    resolver: zodResolver(technicianSchema),
  });

  useEffect(() => {
    loadTechnicians();
  }, [org]);

  const loadTechnicians = async () => {
    if (!SUPABASE_CONFIGURED) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data: orgRow } = await supabase.from('organizations').select('id').eq('slug', org);
      const orgId = orgRow?.[0]?.id;
      if (!orgId) { setTechnicians([]); setLoading(false); return; }
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTechnicians(data || []);
    } catch (error) {
      console.error('Error loading technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TechnicianFormData) => {
    if (!SUPABASE_CONFIGURED) return;
    
    try {
      if (editingTechnician) {
        const { error } = await supabase
          .from('technicians')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTechnician.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('technicians')
          .insert({
            ...data,
            org_id: orgId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingTechnician(null);
      reset();
      loadTechnicians();
    } catch (error) {
      console.error('Error saving technician:', error);
    }
  };

  const handleEdit = (technician: Technician) => {
    setEditingTechnician(technician);
    reset(technician);
    setShowModal(true);
  };

  const handleDelete = async (technicianId: string) => {
    if (!confirm('Are you sure you want to delete this technician?')) return;
    if (!SUPABASE_CONFIGURED) return;

    try {
      const { error } = await supabase
        .from('technicians')
        .delete()
        .eq('id', technicianId);

      if (error) throw error;
      loadTechnicians();
    } catch (error) {
      console.error('Error deleting technician:', error);
    }
  };

  const handleAddTechnician = () => {
    setEditingTechnician(null);
    reset({
      full_name: '',
      email: '',
      phone: '',
      specialization: '',
      license_number: '',
      years_experience: 0,
      is_active: true,
      notes: '',
    });
    setShowModal(true);
  };

  const toggleStatus = async (technicianId: string, currentStatus: boolean) => {
    if (!SUPABASE_CONFIGURED) return;
    
    try {
      const { error } = await supabase
        .from('technicians')
        .update({ is_active: !currentStatus })
        .eq('id', technicianId);

      if (error) throw error;
      loadTechnicians();
    } catch (error) {
      console.error('Error updating technician status:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Technician Management</h1>
        <p className="mt-2 text-gray-600">Manage your technicians and their information</p>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {technicians.length} technician{technicians.length !== 1 ? 's' : ''} total
        </div>
        <button
          onClick={handleAddTechnician}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Technician
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {technicians.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No technicians yet</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first technician.</p>
              <button
                onClick={handleAddTechnician}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Your First Technician
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Technician
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Work Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clients
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
                  {technicians.map((technician) => (
                    <tr key={technician.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{technician.full_name}</div>
                            {technician.license_number && (
                              <div className="text-sm text-gray-500">License: {technician.license_number}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 mr-2" />
                          {technician.email}
                        </div>
                        {technician.phone && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Phone className="w-4 h-4 mr-2" />
                            {technician.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {technician.specialization || 'General'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {technician.years_experience ? `${technician.years_experience} years` : 'New'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Activity className="w-4 h-4 mr-2" />
                          {technician.work_order_count || 0} orders
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{technician.client_count || 0} clients</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            technician.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {technician.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleStatus(technician.id, technician.is_active)}
                            className={`text-sm px-2 py-1 rounded ${
                              technician.is_active
                                ? 'text-red-600 hover:text-red-900 bg-red-50'
                                : 'text-green-600 hover:text-green-900 bg-green-50'
                            }`}
                          >
                            {technician.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleEdit(technician)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(technician.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingTechnician ? 'Edit Technician' : 'Add New Technician'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  {...register('full_name')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                <input
                  {...register('specialization')}
                  type="text"
                  placeholder="e.g., HVAC, Electrical, Plumbing"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                <input
                  {...register('license_number')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience
                </label>
                <input
                  {...register('years_experience', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTechnician(null);
                    reset();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingTechnician ? 'Update' : 'Create'} Technician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
