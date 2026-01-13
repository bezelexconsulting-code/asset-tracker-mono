import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const DEFAULT_ORG_ID = import.meta.env.VITE_DEFAULT_ORG_ID || '';

export const SUPABASE_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = SUPABASE_CONFIGURED ? createClient(supabaseUrl, supabaseAnonKey) : (null as any);

export function createOrgClient(orgId: string) {
  if (!SUPABASE_CONFIGURED) return supabase;
  const oid = orgId || DEFAULT_ORG_ID;
  return createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { 'app-org-id': oid } } });
}
