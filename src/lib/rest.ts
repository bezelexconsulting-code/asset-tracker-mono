import { supabaseUrl, supabaseAnonKey, SUPABASE_CONFIGURED } from './supabase';

function baseHeaders(orgId?: string) {
  const h: Record<string, string> = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
  };
  if (orgId) h['app-org-id'] = orgId;
  return h;
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

export async function restRpc<T = any>(fn: string, payload: any, orgId?: string): Promise<T> {
  if (!SUPABASE_CONFIGURED) return null as any;
  const url = `${supabaseUrl}/rest/v1/rpc/${fn}`;
  const res = await fetch(url, { method: 'POST', headers: baseHeaders(orgId), body: JSON.stringify(payload) });
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    console.error(`RPC ${fn} failed ${res.status}:`, errorText);
    throw new Error(`RPC ${fn} failed ${res.status}: ${errorText}`);
  }
  return await res.json();
}
