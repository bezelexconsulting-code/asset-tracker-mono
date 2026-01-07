-- Create clients table
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address text,
  contact_person text,
  logo_url text,
  created_at timestamptz default now()
);

-- Add client_id to locations
alter table locations add column if not exists client_id uuid references clients(id) on delete set null;

-- Create jobs table
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  title text not null,
  client_id uuid references clients(id) on delete set null,
  technician_id uuid references technicians(id) on delete set null,
  location_id uuid references locations(id) on delete set null,
  asset_ids uuid[], -- Array of asset IDs
  status text default 'new',
  checklist jsonb default '[]'::jsonb,
  notes text,
  description text,
  attachments text[], -- Array of URLs
  parts jsonb default '[]'::jsonb,
  labor_minutes integer default 0,
  next_service_at timestamptz,
  needs_approval boolean default false,
  created_at timestamptz default now(),
  due_at timestamptz
);

-- Create activities table
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  technician_id uuid references technicians(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  asset_id uuid references assets(id) on delete set null,
  type text not null,
  status text not null,
  started_at timestamptz,
  ended_at timestamptz,
  notes text,
  gps_lat double precision,
  gps_lng double precision,
  rating integer,
  condition text,
  created_at timestamptz default now()
);

-- Create indexes
create index if not exists jobs_org_id_idx on jobs(org_id);
create index if not exists jobs_client_id_idx on jobs(client_id);
create index if not exists jobs_technician_id_idx on jobs(technician_id);
create index if not exists clients_org_id_idx on clients(org_id);
create index if not exists activities_org_id_idx on activities(org_id);
create index if not exists activities_technician_id_idx on activities(technician_id);
