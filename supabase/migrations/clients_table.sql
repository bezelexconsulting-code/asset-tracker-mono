create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  contact_email text,
  phone text,
  logo_url text,
  created_at timestamptz default now()
);
