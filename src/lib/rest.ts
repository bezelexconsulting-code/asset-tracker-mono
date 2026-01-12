import { supabaseUrl, supabaseAnonKey, SUPABASE_CONFIGURED } from './supabase';

function baseHeaders(orgId: string) {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    'app-org-id': orgId,
    'Content-Type': 'application/json',
  } as Record<string, string>;
}

function restUrl(table: string, qs = '') {
  const url = `${supabaseUrl}/rest/v1/${table}`;
  return qs ? `${url}${qs}` : url;
}

export async function restGet<T = any>(table: string, orgId: string, qs: string = '?select=*'): Promise<T[]> {
  if (!SUPABASE_CONFIGURED) return [] as any;
  const res = await fetch(restUrl(table, qs), { headers: baseHeaders(orgId) });
  if (!res.ok) throw new Error(`GET ${table} failed ${res.status}`);
  return await res.json();
}

export async function restPost<T = any>(table: string, orgId: string, body: any): Promise<T[]> {
  if (!SUPABASE_CONFIGURED) return [] as any;
  const res = await fetch(restUrl(table), {
    method: 'POST',
    headers: { ...baseHeaders(orgId), Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${table} failed ${res.status}`);
  return await res.json();
}

export async function restPatch<T = any>(table: string, orgId: string, qsFilter: string, body: any): Promise<T[]> {
  if (!SUPABASE_CONFIGURED) return [] as any;
  const res = await fetch(restUrl(table, qsFilter), {
    method: 'PATCH',
    headers: { ...baseHeaders(orgId), Prefer: 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${table} failed ${res.status}`);
  return await res.json();
}

