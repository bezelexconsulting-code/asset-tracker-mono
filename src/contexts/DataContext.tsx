import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SUPABASE_CONFIGURED, supabase } from '../lib/supabase';
import { resolveOrgId } from '../lib/org';
import { restGet, restPost, restPatch } from '../lib/rest';

type ID = string;

export interface Client {
  id: ID;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  logo_url?: string;
}

export interface Location {
  id: ID;
  org_id: string;
  client_id?: ID;
  name: string;
  address?: string;
}

export interface Asset {
  id: ID;
  org_id: string;
  asset_tag: string;
  name: string;
  status: string;
  image_url?: string;
  client_id?: ID;
  location_id?: ID;
  category_id?: ID;
  description?: string;
  next_service_at?: string;
}

export interface Category {
  id: ID;
  org_id: string;
  name: string;
}

export interface Technician {
  id: ID;
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  status?: 'active' | 'inactive';
  username?: string;
  password?: string;
  must_reset_password?: boolean;
}

export interface Activity {
  id: ID;
  org_id: string;
  technician_id: ID;
  client_id?: ID;
  asset_id?: ID;
  type: string;
  status: string;
  started_at?: string;
  ended_at?: string;
  notes?: string;
  created_at?: string;
  gps_lat?: number;
  gps_lng?: number;
  rating?: number;
  condition?: 'good' | 'fair' | 'poor';
}

export interface Job {
  id: ID;
  org_id: string;
  title: string;
  client_id?: ID;
  technician_id?: ID;
  location_id?: ID;
  asset_ids?: ID[];
  status: 'new' | 'assigned' | 'in_progress' | 'completed';
  due_at?: string;
  created_at: string;
  checklist?: Array<{ id: string; label: string; done: boolean }>;
  notes?: string;
  attachments?: string[];
  description?: string;
  parts?: Array<{ name: string; qty: number; unit_cost?: number }>;
  labor_minutes?: number;
  next_service_at?: string;
  needs_approval?: boolean;
}

export interface User {
  id: ID;
  name: string;
  email?: string;
  role: 'owner' | 'admin' | 'manager' | 'technician' | 'auditor';
  active?: boolean;
}

export interface AuditEvent {
  id: ID;
  org_id: string;
  type: string;
  entity: string;
  entity_id?: ID;
  actor?: string;
  created_at: string;
  details?: Record<string, any>;
}

interface DataState {
  clients: Client[];
  locations: Location[];
  assets: Asset[];
  technicians: Technician[];
  activities: Activity[];
  users: User[];
  audit: AuditEvent[];
  jobs: Job[];
  categories: Category[];
}

interface DataContextValue {
  org: string;
  state: DataState;
  listClients: () => Client[];
  addClient: (c: Omit<Client, 'id'>) => Client;
  updateClient: (id: ID, patch: Partial<Client>) => void;
  listLocations: (clientId?: ID) => Location[];
  addLocation: (l: Omit<Location, 'id' | 'org_id'>) => Location;
  listAssets: (clientId?: ID) => Asset[];
  addAsset: (a: Omit<Asset, 'id' | 'org_id' | 'status'> & { status?: string }) => Asset;
  updateAsset: (id: ID, patch: Partial<Asset>) => void;
  listTechnicians: () => Technician[];
  addTechnician: (t: Omit<Technician, 'id'>) => Technician;
  updateTechnician: (id: ID, patch: Partial<Technician>) => void;
  listActivities: () => Activity[];
  addActivity: (a: Omit<Activity, 'id' | 'org_id' | 'created_at'>) => Activity;
  listJobs: () => Job[];
  addJob: (j: Omit<Job, 'id' | 'org_id' | 'created_at' | 'status'> & { status?: Job['status'] }) => Job;
  updateJob: (id: ID, patch: Partial<Job>) => void;
  listUsers: () => User[];
  addUser: (u: Omit<User, 'id'>) => User;
  updateUser: (id: ID, patch: Partial<User>) => void;
  listAudit: () => AuditEvent[];
  listCategories: () => Category[];
  addCategory: (c: Omit<Category, 'id' | 'org_id'>) => Category;
}

const DataContext = createContext<DataContextValue | null>(null);

function genId() {
  return crypto.randomUUID();
}

function getKey(org: string) {
  return `bez-demo-${org}`;
}

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ org, children }: { org: string; children: React.ReactNode }) {
  const [state, setState] = useState<DataState>({ clients: [], locations: [], assets: [], technicians: [], activities: [], users: [], audit: [], jobs: [], categories: [] });
  const [orgId, setOrgId] = useState<string | null>(null);

  // Load from Supabase or LocalStorage
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (SUPABASE_CONFIGURED) {
        const oid = await resolveOrgId(org);
        if (!mounted) return;
        setOrgId(oid);
        if (oid) {
          // Fetch all data in parallel
          const [clients, locations, assets, technicians, jobs, activities] = await Promise.all([
            restGet('clients', oid),
            restGet('locations', oid),
            restGet('assets', oid),
            restGet('technicians', oid, '?select=*'),
            restGet('jobs', oid),
            restGet('activities', oid),
          ]);
          
          if (mounted) {
            setState(prev => ({
              ...prev,
              clients: clients as Client[],
              locations: locations as Location[],
              assets: assets as Asset[],
              technicians: (technicians as any[]).map((t: any) => ({ id: t.id, name: t.full_name || t.name, email: t.email, phone: t.phone, specialization: t.specialization, status: t.is_active ? 'active' : (t.status || 'active'), username: t.username, password: t.password, must_reset_password: t.must_reset_password })),
              jobs: jobs as Job[],
              activities: activities as Activity[],
            }));
          }

          // Subscribe to realtime changes
          const ch = supabase.channel(`org_${oid}`)
            .on('postgres_changes', { event: '*', schema: 'public', filter: `org_id=eq.${oid}` }, (payload) => {
              // Simple reload for now, or handle specific table updates
              // Implementing full realtime sync is complex, for now we rely on optimistic updates and occasional reloads
              // Or we can manually patch the state based on payload.table
            })
            .subscribe();
            
          return () => { supabase.removeChannel(ch); };
        }
      } else {
        // Local storage fallback
        const key = getKey(org);
        const raw = localStorage.getItem(key);
        if (raw) {
          setState(JSON.parse(raw));
        } else {
          const initial: DataState = { clients: [], locations: [], assets: [], technicians: [], activities: [], users: [], audit: [], jobs: [], categories: [] };
          localStorage.setItem(key, JSON.stringify(initial));
          setState(initial);
        }
      }
    })();
    return () => { mounted = false; };
  }, [org]);

  // Persist to LocalStorage (only if not using Supabase, or as backup?)
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      const key = getKey(org);
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [org, state]);

  const value = useMemo<DataContextValue>(() => ({
    org,
    state,
    listClients: () => state.clients,
    addClient: (c) => {
      const newClient: Client = { id: genId(), ...c };
      setState((s) => ({ ...s, clients: [newClient, ...s.clients] }));
      if (SUPABASE_CONFIGURED && orgId) { restPost('clients', orgId, { ...newClient, org_id: orgId }).then().catch(()=>{}); }
      return newClient;
    },
    updateClient: (id, patch) => {
      setState((s) => ({ ...s, clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
      if (SUPABASE_CONFIGURED && orgId) { restPatch('clients', orgId, `?id=eq.${id}`, patch).then().catch(()=>{}); }
    },
    listLocations: (clientId) => state.locations.filter((l) => !clientId || l.client_id === clientId),
    addLocation: (l) => {
      const newLoc: Location = { id: genId(), org_id: org, ...l }; // org_id in local obj is slug, but DB needs uuid
      const dbLoc = { ...newLoc, org_id: orgId || undefined };
      setState((s) => ({ ...s, locations: [newLoc, ...s.locations] }));
      if (SUPABASE_CONFIGURED && orgId) { restPost('locations', orgId, { ...newLoc, org_id: orgId }).then().catch(()=>{}); }
      return newLoc;
    },
    listAssets: (clientId) => clientId ? state.assets.filter((a) => a.client_id === clientId) : state.assets,
    addAsset: (a) => {
      const newAsset: Asset = { id: genId(), org_id: org, status: a.status || 'available', description: a.description || '', ...a };
      setState((s) => ({ ...s, assets: [newAsset, ...s.assets] }));
      if (SUPABASE_CONFIGURED && orgId) { restPost('assets', orgId, { ...newAsset, org_id: orgId }).then().catch(()=>{}); }
      return newAsset;
    },
    updateAsset: (id, patch) => {
      setState((s) => ({ ...s, assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
      if (SUPABASE_CONFIGURED && orgId) { restPatch('assets', orgId, `?id=eq.${id}`, patch).then().catch(()=>{}); }
    },
    listTechnicians: () => state.technicians,
    addTechnician: (t) => {
      const newTech: Technician = { id: genId(), ...t };
      setState((s) => ({ ...s, technicians: [newTech, ...s.technicians] }));
      if (SUPABASE_CONFIGURED && orgId) { restPost('technicians', orgId, { id: newTech.id, org_id: orgId, full_name: newTech.name, email: newTech.email, phone: newTech.phone, specialization: newTech.specialization, is_active: newTech.status === 'active' }).then().catch(()=>{}); }
      return newTech;
    },
    updateTechnician: (id, patch) => {
      setState((s) => ({ ...s, technicians: s.technicians.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
      if (SUPABASE_CONFIGURED && orgId) {
        const dbPatch: any = {};
        if (patch.name) dbPatch.full_name = patch.name;
        if (patch.email !== undefined) dbPatch.email = patch.email;
        if (patch.phone !== undefined) dbPatch.phone = patch.phone;
        if (patch.specialization !== undefined) dbPatch.specialization = patch.specialization;
        if (patch.status) dbPatch.is_active = patch.status === 'active';
        if (patch.username !== undefined) dbPatch.username = patch.username;
        if (patch.password !== undefined) dbPatch.password = patch.password;
        if (Object.keys(dbPatch).length > 0) { restPatch('technicians', orgId, `?id=eq.${id}`, dbPatch).then().catch(()=>{}); }
      }
    },
    listActivities: () => state.activities,
    addActivity: (a) => {
      const newAct: Activity = { id: genId(), org_id: org, created_at: new Date().toISOString(), ...a };
      setState((s) => ({ ...s, activities: [newAct, ...s.activities] }));
      if (SUPABASE_CONFIGURED && orgId) { restPost('activities', orgId, { ...newAct, org_id: orgId }).then().catch(()=>{}); }
      return newAct;
    },
    listJobs: () => state.jobs,
    addJob: (j) => {
      const job: Job = { 
        id: genId(), 
        org_id: org, 
        status: j.status || 'assigned', 
        created_at: new Date().toISOString(), 
        checklist: j.checklist || [], 
        notes: j.notes || '', 
        description: j.description || '', 
        attachments: j.attachments || [], 
        parts: j.parts || [], 
        labor_minutes: j.labor_minutes || 0, 
        next_service_at: j.next_service_at || '', 
        needs_approval: j.needs_approval || false, 
        ...j 
      };
      setState((s) => ({ ...s, jobs: [job, ...s.jobs] }));
      if (SUPABASE_CONFIGURED && orgId) { restPost('jobs', orgId, { ...job, org_id: orgId }).then().catch(()=>{}); }
      return job;
    },
    updateJob: (id, patch) => {
      setState((s) => ({ ...s, jobs: s.jobs.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
      if (SUPABASE_CONFIGURED && orgId) { restPatch('jobs', orgId, `?id=eq.${id}`, patch).then().catch(()=>{}); }
    },
    listCategories: () => state.categories,
    addCategory: (c) => {
      const cat: Category = { id: genId(), org_id: org, ...c };
      setState((s) => ({ ...s, categories: [cat, ...s.categories] }));
      // Categories table not yet in Supabase migration, maybe add later?
      return cat;
    },
    listUsers: () => state.users,
    addUser: (u) => {
      const newUser: User = { id: genId(), active: true, ...u };
      setState((s) => ({ ...s, users: [newUser, ...s.users] }));
      // Users table logic matches Supabase users table?
      return newUser;
    },
    updateUser: (id, patch) => {
      setState((s) => ({ ...s, users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
    },
    listAudit: () => state.audit,
  }), [state, org, orgId]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
