import { supabase, SUPABASE_CONFIGURED } from './supabase';

export async function resolveOrgId(slug?: string): Promise<string | null> {
  if (!SUPABASE_CONFIGURED || !slug) return null;
  const { data } = await supabase.from('organizations').select('id').eq('slug', slug).limit(1);
  return data?.[0]?.id || null;
}

export async function ensureOrgExists(slug?: string, defaults?: { name?: string; contact_email?: string }) {
  if (!SUPABASE_CONFIGURED || !slug) return null;
  const { data } = await supabase.from('organizations').select('id').eq('slug', slug).limit(1);
  if (data && data[0]) return data[0].id;
  const { data: created } = await supabase.from('organizations').insert({
    slug,
    name: defaults?.name || slug,
    contact_email: defaults?.contact_email || '',
    active: true
  }).select('id').limit(1);
  return created?.[0]?.id || null;
}
