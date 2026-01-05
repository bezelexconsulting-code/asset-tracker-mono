create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz default now()
);

alter table assets
  add column if not exists category_id uuid references categories(id) on delete set null,
  add column if not exists location_id uuid references locations(id) on delete set null,
  add column if not exists next_service_at date;

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  permissions jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  full_name text,
  role_id uuid references roles(id) on delete set null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  asset_id uuid not null references assets(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  technician_id uuid references technicians(id) on delete set null,
  type text not null check (type in ('check_in','check_out')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  actor_id uuid,
  entity text not null,
  entity_id uuid,
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

create table if not exists nfc_tags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  asset_id uuid not null references assets(id) on delete cascade,
  tag_uid text not null,
  payload jsonb,
  created_at timestamptz default now(),
  unique(org_id, tag_uid)
);

create table if not exists feature_flags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  flag_key text not null,
  enabled boolean default false,
  created_at timestamptz default now(),
  unique(org_id, flag_key)
);
