-- Clients table
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  name text not null,
  email text,
  phone text,
  address text,
  contact_person text,
  created_at timestamp with time zone default now()
);

-- Locations table
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  client_id uuid references public.clients(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamp with time zone default now()
);

-- Assets table
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  asset_tag text not null,
  name text not null,
  status text default 'available',
  image_url text,
  client_id uuid,
  location_id uuid,
  created_at timestamp with time zone default now()
);

-- Unique asset tag within org
create unique index if not exists assets_org_tag_unique on public.assets(org_id, asset_tag);

-- Add FKs if missing
alter table public.assets
  add constraint assets_client_fk foreign key (client_id) references public.clients(id) on delete set null;

alter table public.assets
  add constraint assets_location_fk foreign key (location_id) references public.locations(id) on delete set null;

-- Basic view for technician activities (optional, if table exists)
-- This migration focuses on locations and FKs; additional activity schema can be added later
