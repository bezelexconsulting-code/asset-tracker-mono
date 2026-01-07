import { supabase, SUPABASE_CONFIGURED } from './supabase';

export async function resolveOrgId(slug?: string): Promise<string | null> {
  if (!SUPABASE_CONFIGURED) return null;

  // 1. If slug is explicitly provided, look it up
  if (slug) {
    const { data } = await supabase.from('organizations').select('id').eq('slug', slug).limit(1);
    if (data?.[0]?.id) return data[0].id;
  }

  // 2. Check environment variable override (Dev / Force)
  const envId = import.meta.env.VITE_DEFAULT_ORG_ID;
  if (envId) return envId;

  // 3. Try to infer slug from subdomain
  // e.g. "tecniqa.vercel.app" -> "tecniqa"
  // e.g. "localhost" -> skip
  let derivedSlug: string | null = null;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && !host.startsWith('127.0.0.1') && !host.startsWith('192.168.')) {
      const parts = host.split('.');
      if (parts.length >= 2) {
        // Exclude 'www' if present? usually yes, but let's keep it simple.
        // If parts[0] is 'www', we might want parts[1] if it's www.slug.domain.com? 
        // Let's assume standard slug.domain.com
        if (parts[0] !== 'www') {
          derivedSlug = parts[0];
        }
      }
    }
  }

  if (derivedSlug) {
    // Avoid re-querying if the derived slug is the same as the explicitly passed one (already checked)
    if (derivedSlug !== slug) {
      const { data } = await supabase.from('organizations').select('id').eq('slug', derivedSlug).limit(1);
      if (data?.[0]?.id) return data[0].id;
    }
  }

  // 4. Fallback: Check environment variable SLUG
  const envSlug = import.meta.env.VITE_DEFAULT_ORG_SLUG;
  if (envSlug) {
    const { data } = await supabase.from('organizations').select('id').eq('slug', envSlug).limit(1);
    return data?.[0]?.id || null;
  }

  return null;
}

export async function ensureOrgExists(slug?: string, defaults?: { name?: string; contact_email?: string }) {
  if (!SUPABASE_CONFIGURED || !slug) return null;
  
  // Try to find it first
  const existingId = await resolveOrgId(slug);
  if (existingId) return existingId;

  // Create if not found
  const { data: created } = await supabase.from('organizations').insert({
    slug,
    name: defaults?.name || slug,
    contact_email: defaults?.contact_email || '',
    active: true
  }).select('id').limit(1);
  return created?.[0]?.id || null;
}
