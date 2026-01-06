import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

export interface Organization {
  id: string;
  org_id: string;
  name: string;
  contact_email?: string;
  seats?: number;
  active?: boolean;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_phone?: string;
  logo_url?: string;
  client_credentials?: { username: string; password: string };
}

export interface TechRequest {
  id: string;
  org_id: string;
  requester_email?: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Invoice {
  id: string;
  org_id: string;
  amount_cents: number;
  period: string;
  status: 'draft' | 'open' | 'paid' | 'void';
  created_at: string;
}

export interface Ticket {
  id: string;
  org_id: string;
  requester_email?: string;
  subject: string;
  message: string;
  status: 'open' | 'closed';
  created_at: string;
}

export interface FeatureFlag {
  id: string;
  org_id: string;
  key: string;
  enabled: boolean;
}

interface SuperAdminState {
  orgs: Organization[];
  requests: TechRequest[];
  invoices: Invoice[];
  tickets: Ticket[];
  flags: FeatureFlag[];
  user_changes?: Array<{ id: string; org_id: string; type: 'admin' | 'technician'; user_id?: string; old_username?: string; new_username: string; created_at: string }>;
}

interface SuperAdminContextValue {
  state: SuperAdminState;
  listOrgs: () => Organization[];
  addOrg: (o: Omit<Organization, 'id'>) => Organization;
  updateOrg: (id: string, patch: Partial<Organization>) => void;
  deleteOrg: (id: string) => void;
  listRequests: () => TechRequest[];
  addRequest: (r: Omit<TechRequest, 'id' | 'created_at' | 'status'> & { status?: TechRequest['status'] }) => TechRequest;
  updateRequest: (id: string, patch: Partial<TechRequest>) => void;
  listInvoices: () => Invoice[];
  addInvoice: (i: Omit<Invoice, 'id' | 'created_at' | 'status'> & { status?: Invoice['status'] }) => Invoice;
  updateInvoice: (id: string, patch: Partial<Invoice>) => void;
  listTickets: () => Ticket[];
  addTicket: (t: Omit<Ticket, 'id' | 'created_at' | 'status'> & { status?: Ticket['status'] }) => Ticket;
  updateTicket: (id: string, patch: Partial<Ticket>) => void;
  listFlags: () => FeatureFlag[];
  setFlag: (org_id: string, key: string, enabled: boolean) => void;
  listUserChanges: () => NonNullable<SuperAdminState['user_changes']>;
  addUserChange: (c: { org_id: string; type: 'admin' | 'technician'; user_id?: string; old_username?: string; new_username: string }) => void;
  notify?: string | null;
  clearNotify?: () => void;
}

const SuperAdminContext = createContext<SuperAdminContextValue | null>(null);

function genId() {
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function SuperAdminProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SuperAdminState>({ orgs: [], requests: [], invoices: [], tickets: [], flags: [], user_changes: [] });
  useEffect(() => {
    const raw = localStorage.getItem('bez-superadmin');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SuperAdminState;
        if ((parsed.orgs || []).length === 0) {
          const demo: SuperAdminState = {
            orgs: [
              { id: 'o1', org_id: 'demo-org', name: 'Demo Org', contact_email: 'ops@demo.org', seats: 2, active: true, contact_first_name: 'Alex', contact_last_name: 'Demo', contact_phone: '000-000-0000', client_credentials: { username: 'demo-admin', password: 'demo123' } },
            ],
            requests: [],
            invoices: [
              { id: 'inv1', org_id: 'demo-org', amount_cents: 19900, period: '2025-12', status: 'open', created_at: new Date().toISOString() },
            ],
            tickets: [],
            flags: [
              { id: 'f1', org_id: 'demo-org', key: 'self_add_technician', enabled: false },
            ],
            user_changes: [],
          };
          localStorage.setItem('bez-superadmin', JSON.stringify(demo));
          setState(demo);
        } else {
          setState(parsed);
        }
      } catch {
        const demo: SuperAdminState = {
          orgs: [
            { id: 'o1', org_id: 'demo-org', name: 'Demo Org', contact_email: 'ops@demo.org', seats: 2, active: true, contact_first_name: 'Alex', contact_last_name: 'Demo', contact_phone: '000-000-0000', client_credentials: { username: 'demo-admin', password: 'demo123' } },
          ],
          requests: [],
          invoices: [
            { id: 'inv1', org_id: 'demo-org', amount_cents: 19900, period: '2025-12', status: 'open', created_at: new Date().toISOString() },
          ],
          tickets: [],
          flags: [
            { id: 'f1', org_id: 'demo-org', key: 'self_add_technician', enabled: false },
          ],
          user_changes: [],
        };
        localStorage.setItem('bez-superadmin', JSON.stringify(demo));
        setState(demo);
      }
      return;
    }
    const demo: SuperAdminState = {
      orgs: [
        { id: 'o1', org_id: 'demo-org', name: 'Demo Org', contact_email: 'ops@demo.org', seats: 2, active: true, contact_first_name: 'Alex', contact_last_name: 'Demo', contact_phone: '000-000-0000', client_credentials: { username: 'demo-admin', password: 'demo123' } },
      ],
      requests: [],
      invoices: [
        { id: 'inv1', org_id: 'demo-org', amount_cents: 19900, period: '2025-12', status: 'open', created_at: new Date().toISOString() },
      ],
      tickets: [],
      flags: [
        { id: 'f1', org_id: 'demo-org', key: 'self_add_technician', enabled: false },
      ],
      user_changes: [],
    };
    localStorage.setItem('bez-superadmin', JSON.stringify(demo));
    setState(demo);
  }, []);
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    (async () => {
      const { data: orgs } = await supabase.from('organizations').select('*').order('created_at', { ascending: false });
      setState((s)=> ({ ...s, orgs: (orgs||[]).map((o:any)=> ({ id:o.id, org_id:o.slug, name:o.name, contact_email:o.contact_email, active:o.active })) }));
      const { data: reqs } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
      setState((s)=> ({ ...s, requests: (reqs||[]).map((r:any)=> ({ id:r.id, org_id:r.org_id, requester_email:r.requester_email, note:r.note, status:r.status, created_at:r.created_at, org_slug: r.org_slug })) }));
    })();
    const channel = supabase.channel('super-admin-requests')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, async (payload:any) => {
        const r = payload.new;
        setState((s)=> ({ ...s, requests: [{ id:r.id, org_id:r.org_id, requester_email:r.requester_email, note:r.note, status:r.status, created_at:r.created_at, org_slug: r.org_slug }, ...s.requests], user_changes: s.user_changes }));
        setNotify(`New request received`);
        try {
          const { data: orgs } = await supabase.from('organizations').select('id, name, slug, contact_email, contact_phone').eq('id', r.org_id).limit(1);
          const org = orgs?.[0] || {};
          const to = process.env.VITE_SUPERADMIN_EMAIL || '';
          const portal = (typeof window !== 'undefined' ? window.location.origin : '') + '/super/requests';
          if (to) {
            const html = `
              <h2 style="margin:0 0 8px">New Technician Request</h2>
              <p style="margin:4px 0"><b>Organization:</b> ${org.name || ''} (${org.slug || ''})</p>
              <p style="margin:4px 0"><b>Requester:</b> ${r.requester_email || ''}</p>
              <p style="margin:4px 0"><b>Contact Email:</b> ${org.contact_email || ''}</p>
              <p style="margin:4px 0"><b>Contact Phone:</b> ${org.contact_phone || ''}</p>
              <p style="margin:8px 0"><b>Note:</b> ${r.note || ''}</p>
              <p style="margin:8px 0"><b>Time:</b> ${new Date(r.created_at).toLocaleString()}</p>
              <p style="margin:8px 0"><a href="${portal}" target="_blank">Open Requests in Super Admin</a></p>
            `;
            fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, subject: `New Technician Request — ${org.slug || 'organization'}`, html }) }).catch(()=>{});
          }
        } catch {}
      })
      .subscribe();
    return () => { try { supabase.removeChannel(channel); } catch {} };
  }, []);
  useEffect(() => {
    localStorage.setItem('bez-superadmin', JSON.stringify(state));
  }, [state]);

  const [notify, setNotify] = useState<string | null>(null);
  const value = useMemo<SuperAdminContextValue>(() => ({
    state,
    listOrgs: () => state.orgs,
    addOrg: (o) => {
      if (SUPABASE_CONFIGURED) {
        const created = { id: genId(), ...o } as Organization;
        return created;
      }
      const created = { id: genId(), ...o } as Organization;
      setState((s) => ({ ...s, orgs: [created, ...s.orgs] }));
      return created;
    },
    updateOrg: (id, patch) => setState((s) => ({ ...s, orgs: s.orgs.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    deleteOrg: (id) => setState((s)=> ({ ...s, orgs: s.orgs.filter((x)=> x.id!==id) })),
    listRequests: () => state.requests,
    addRequest: (r) => {
      if (SUPABASE_CONFIGURED) {
        (async()=>{
          await supabase.from('requests').insert({ org_id: r.org_id, requester_email: r.requester_email, note: r.note, status: r.status || 'pending' });
        })();
        const created = { id: genId(), created_at: new Date().toISOString(), status: r.status || 'pending', ...r } as TechRequest;
        setState((s) => ({ ...s, requests: [created, ...s.requests] }));
        return created;
      }
      const created = { id: genId(), created_at: new Date().toISOString(), status: r.status || 'pending', ...r } as TechRequest;
      setState((s) => ({ ...s, requests: [created, ...s.requests] }));
      return created;
    },
    updateRequest: (id, patch) => setState((s) => ({ ...s, requests: s.requests.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    listInvoices: () => state.invoices,
    addInvoice: (i) => {
      const created = { id: genId(), created_at: new Date().toISOString(), status: i.status || 'open', ...i } as Invoice;
      setState((s) => ({ ...s, invoices: [created, ...s.invoices] }));
      return created;
    },
    updateInvoice: (id, patch) => setState((s) => ({ ...s, invoices: s.invoices.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    listTickets: () => state.tickets,
    addTicket: (t) => {
      const created = { id: genId(), created_at: new Date().toISOString(), status: t.status || 'open', ...t } as Ticket;
      setState((s) => ({ ...s, tickets: [created, ...s.tickets] }));
      return created;
    },
    updateTicket: (id, patch) => setState((s) => ({ ...s, tickets: s.tickets.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    listFlags: () => state.flags,
    setFlag: (org_id, key, enabled) => setState((s) => ({
      ...s,
      flags: (() => {
        const existing = s.flags.find((f) => f.org_id === org_id && f.key === key);
        if (existing) return s.flags.map((f) => (f.org_id === org_id && f.key === key ? { ...f, enabled } : f));
        return [{ id: genId(), org_id, key, enabled }, ...s.flags];
      })(),
    })),
    listUserChanges: () => state.user_changes || [],
    addUserChange: (c) => setState((s) => ({ ...s, user_changes: [{ id: genId(), created_at: new Date().toISOString(), ...c }, ...(s.user_changes || [])] })),
    notify,
    clearNotify: () => setNotify(null),
  }), [state, notify]);

  return <SuperAdminContext.Provider value={value}>{children}</SuperAdminContext.Provider>;
}

export function useSuperAdmin() {
  const ctx = useContext(SuperAdminContext);
  if (!ctx) throw new Error('SuperAdminContext not found');
  return ctx;
}
