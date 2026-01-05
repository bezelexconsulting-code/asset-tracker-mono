import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const assetSchema = z.object({
  asset_tag: z.string().min(1, 'Asset tag is required'),
  name: z.string().min(1, 'Name is required'),
  category_id: z.string().min(1, 'Category is required'),
  location_id: z.string().optional(),
  status: z.enum(['active', 'checked_out', 'maintenance', 'retired']),
  purchase_price: z.number().optional(),
  purchase_date: z.string().optional(),
  warranty_months: z.number().optional(),
  description: z.string().optional(),
  specifications: z.string().optional(),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface Category {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

export const CreateAsset: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      status: 'active',
    },
  });

  useEffect(() => {
    fetchCategories();
    fetchLocations();
  }, []);

  const fetchCategories = async () => {
    if (!user?.org_id) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('org_id', user.org_id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLocations = async () => {
    if (!user?.org_id) return;

    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('org_id', user.org_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const onSubmit = async (data: AssetFormData) => {
    if (!user?.org_id) return;

    try {
      setLoading(true);

      // Calculate warranty expiry date
      let warranty_expiry = null;
      if (data.purchase_date && data.warranty_months) {
        const purchaseDate = new Date(data.purchase_date);
        warranty_expiry = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + data.warranty_months, purchaseDate.getDate());
      }

      const assetData = {
        org_id: user.org_id,
        asset_tag: data.asset_tag,
        name: data.name,
        category_id: data.category_id,
        location_id: data.location_id || null,
        status: data.status,
        purchase_price: data.purchase_price || null,
        purchase_date: data.purchase_date || null,
        warranty_expiry: warranty_expiry,
        description: data.description || null,
        specifications: data.specifications ? JSON.parse(data.specifications) : {},
      };

      const { data: asset, error } = await supabase
        .from('assets')
        .insert(assetData)
        .select()
        .single();

      if (error) throw error;

      // Create audit log entry
      await supabase.from('audit_logs').insert({
        org_id: user.org_id,
        user_id: user.id,
        asset_id: asset.id,
        action: 'create',
        new_values: asset,
      });

      navigate('/assets');
    } catch (error) {
      console.error('Error creating asset:', error);
      alert('Error creating asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/assets')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Assets
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Asset</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="asset_tag" className="block text-sm font-medium text-gray-700">
                Asset Tag *
              </label>
              <input
                type="text"
                id="asset_tag"
                {...register('asset_tag')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="EQ-001"
              />
              {errors.asset_tag && (
                <p className="mt-1 text-sm text-red-600">{errors.asset_tag.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Asset Name *
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Laptop Dell XPS 15"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                id="category_id"
                {...register('category_id')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="location_id" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <select
                id="location_id"
                {...register('location_id')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select a location</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="purchase_price" className="block text-sm font-medium text-gray-700">
                Purchase Price
              </label>
              <input
                type="number"
                id="purchase_price"
                {...register('purchase_price', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="1099.00"
                step="0.01"
              />
            </div>

            <div>
              <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">
                Purchase Date
              </label>
              <input
                type="date"
                id="purchase_date"
                {...register('purchase_date')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="warranty_months" className="block text-sm font-medium text-gray-700">
                Warranty (months)
              </label>
              <input
                type="number"
                id="warranty_months"
                {...register('warranty_months', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="12"
                min="0"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                {...register('status')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="checked_out">Checked Out</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Dell XPS 15 laptop for development work"
            />
          </div>

          <div>
            <label htmlFor="specifications" className="block text-sm font-medium text-gray-700">
              Specifications (JSON format)
            </label>
            <textarea
              id="specifications"
              {...register('specifications')}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder='{"processor": "Intel i7", "ram": "16GB", "storage": "512GB SSD"}'
            />
            {errors.specifications && (
              <p className="mt-1 text-sm text-red-600">{errors.specifications.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/assets')}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};