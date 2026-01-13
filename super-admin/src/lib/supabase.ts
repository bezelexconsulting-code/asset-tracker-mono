import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const SUPABASE_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = SUPABASE_CONFIGURED ? createClient(supabaseUrl, supabaseAnonKey) : (null as any);

export function createOrgClient(orgId: string) {
  if (!SUPABASE_CONFIGURED) return supabase;
  return createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { 'app-org-id': orgId } } });
}
