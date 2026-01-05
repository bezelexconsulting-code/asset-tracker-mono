import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getKey(org: string) {
  return `bez-demo-${org}`;
}

export function DataProvider({ org, children }: { org: string; children: React.ReactNode }) {
  const [state, setState] = useState<DataState>({ clients: [], locations: [], assets: [], technicians: [], activities: [], users: [], audit: [], jobs: [], categories: [] });

  useEffect(() => {
    const key = getKey(org);
    const raw = localStorage.getItem(key);
    if (raw) {
      setState(JSON.parse(raw));
      return;
    }
    const initial: DataState = { clients: [], locations: [], assets: [], technicians: [], activities: [], users: [], audit: [], jobs: [], categories: [] };
    localStorage.setItem(key, JSON.stringify(initial));
    setState(initial);
  }, [org]);

  useEffect(() => {
    const key = getKey(org);
    localStorage.setItem(key, JSON.stringify(state));
  }, [org, state]);

  const value = useMemo<DataContextValue>(() => ({
    org,
    state,
    listClients: () => state.clients,
    addClient: (c) => {
      const newClient: Client = { id: genId(), ...c };
      setState((s) => ({
        ...s,
        clients: [newClient, ...s.clients],
        audit: [
          { id: genId(), org_id: org, type: 'create', entity: 'client', entity_id: newClient.id, actor: 'system', created_at: new Date().toISOString(), details: { name: newClient.name } },
          ...s.audit,
        ],
      }));
      return newClient;
    },
    updateClient: (id, patch) => {
      setState((s) => ({
        ...s,
        clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        audit: [
          { id: genId(), org_id: org, type: 'update', entity: 'client', entity_id: id, actor: 'system', created_at: new Date().toISOString(), details: { patch } },
          ...s.audit,
        ],
      }));
    },
    listLocations: (clientId) => state.locations.filter((l) => !clientId || l.client_id === clientId),
    addLocation: (l) => {
      const newLoc: Location = { id: genId(), org_id: org, ...l };
      setState((s) => ({
        ...s,
        locations: [newLoc, ...s.locations],
        audit: [
          { id: genId(), org_id: org, type: 'create', entity: 'location', entity_id: newLoc.id, actor: 'system', created_at: new Date().toISOString(), details: { name: newLoc.name } },
          ...s.audit,
        ],
      }));
      return newLoc;
    },
    listAssets: (clientId) => clientId ? state.assets.filter((a) => a.client_id === clientId) : state.assets,
    addAsset: (a) => {
      const newAsset: Asset = { id: genId(), org_id: org, status: a.status || 'available', description: a.description || '', ...a };
      setState((s) => ({
        ...s,
        assets: [newAsset, ...s.assets],
        audit: [
          { id: genId(), org_id: org, type: 'create', entity: 'asset', entity_id: newAsset.id, actor: 'system', created_at: new Date().toISOString(), details: { name: newAsset.name } },
          ...s.audit,
        ],
      }));
      return newAsset;
    },
    updateAsset: (id, patch) => {
      setState((s) => {
        const before = s.assets.find((a) => a.id === id);
        const nextAssets = s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a));
        return {
          ...s,
          assets: nextAssets,
          audit: [
            { id: genId(), org_id: org, type: 'update', entity: 'asset', entity_id: id, actor: 'system', created_at: new Date().toISOString(), details: { before, patch } },
            ...s.audit,
          ],
        };
      });
    },
    listTechnicians: () => state.technicians,
    addTechnician: (t) => {
      const newTech: Technician = { id: genId(), ...t };
      setState((s) => ({ ...s, technicians: [newTech, ...s.technicians] }));
      return newTech;
    },
    updateTechnician: (id, patch) => {
      setState((s) => ({
        ...s,
        technicians: s.technicians.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        audit: [
          { id: genId(), org_id: org, type: 'update', entity: 'technician', entity_id: id, actor: 'system', created_at: new Date().toISOString(), details: { patch } },
          ...s.audit,
        ],
      }));
    },
    listActivities: () => state.activities,
    addActivity: (a) => {
      const newAct: Activity = { id: genId(), org_id: org, created_at: new Date().toISOString(), ...a } as Activity;
      setState((s) => ({
        ...s,
        activities: [newAct, ...s.activities],
        audit: [
          { id: genId(), org_id: org, type: 'activity', entity: 'activity', entity_id: newAct.id, actor: 'system', created_at: new Date().toISOString(), details: { type: newAct.type, status: newAct.status, asset_id: newAct.asset_id } },
          ...s.audit,
        ],
      }));
      return newAct;
    },
    listJobs: () => state.jobs,
    addJob: (j) => {
      const job: Job = { id: genId(), org_id: org, status: j.status || 'assigned', created_at: new Date().toISOString(), checklist: j.checklist || [], notes: j.notes || '', description: j.description || '', attachments: j.attachments || [], parts: j.parts || [], labor_minutes: j.labor_minutes || 0, next_service_at: j.next_service_at || '', needs_approval: j.needs_approval || false, ...j };
      setState((s) => ({ ...s, jobs: [job, ...s.jobs] }));
      return job;
    },
    updateJob: (id, patch) => setState((s) => ({ ...s, jobs: s.jobs.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    listCategories: () => state.categories,
    addCategory: (c) => {
      const cat: Category = { id: genId(), org_id: org, ...c };
      setState((s) => ({ ...s, categories: [cat, ...s.categories] }));
      return cat;
    },
    listUsers: () => state.users,
    addUser: (u) => {
      const newUser: User = { id: genId(), active: true, ...u };
      setState((s) => ({
        ...s,
        users: [newUser, ...s.users],
        audit: [
          { id: genId(), org_id: org, type: 'create', entity: 'user', entity_id: newUser.id, actor: 'system', created_at: new Date().toISOString(), details: { name: newUser.name, role: newUser.role } },
          ...s.audit,
        ],
      }));
      return newUser;
    },
    updateUser: (id, patch) => {
      setState((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        audit: [
          { id: genId(), org_id: org, type: 'update', entity: 'user', entity_id: id, actor: 'system', created_at: new Date().toISOString(), details: { patch } },
          ...s.audit,
        ],
      }));
    },
    listAudit: () => state.audit,
  }), [org, state]);

  // No demo loader in production

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('DataContext not found');
  return ctx;
}
