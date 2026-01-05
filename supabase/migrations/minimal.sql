create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  contact_email text,
  created_at timestamptz default now()
);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  asset_tag text not null,
  name text not null,
  status text not null default 'available',
  description text,
  image_url text,
  created_at timestamptz default now(),
  unique (org_id, asset_tag)
);

create table if not exists technicians (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  email text,
  is_active boolean default true,
  created_at timestamptz default now()
);

insert into organizations(name, slug) values ('Default Org','default-org') on conflict do nothing;
