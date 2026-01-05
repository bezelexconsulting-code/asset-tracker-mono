-- Asset Tracker schema (core tables)

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  contact_email text,
  created_at timestamptz default now()
);

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  permissions jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  email text not null,
  full_name text,
  role_id uuid references roles(id) on delete set null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz default now()
);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  asset_tag text not null,
  name text not null,
  status text not null default 'available',
  category_id uuid references categories(id) on delete set null,
  location_id uuid references locations(id) on delete set null,
  description text,
  image_url text,
  next_service_at date,
  created_at timestamptz default now()
);
create unique index if not exists assets_unique_tag_org on assets(org_id, asset_tag);

create table if not exists technicians (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  specialization text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  asset_id uuid references assets(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  technician_id uuid references technicians(id) on delete set null,
  type text not null check (type in ('check_in','check_out')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  actor_id uuid,
  entity text not null,
  entity_id uuid,
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

create table if not exists nfc_tags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  asset_id uuid references assets(id) on delete cascade,
  tag_uid text not null,
  payload jsonb,
  created_at timestamptz default now()
);
create unique index if not exists nfc_tags_unique_uid_org on nfc_tags(org_id, tag_uid);

create table if not exists feature_flags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  flag_key text not null,
  enabled boolean default false,
  created_at timestamptz default now(),
  unique(org_id, flag_key)
);

-- minimal seed: one organization (optional)
insert into organizations(name, slug) values ('Default Org','default-org') on conflict do nothing;
