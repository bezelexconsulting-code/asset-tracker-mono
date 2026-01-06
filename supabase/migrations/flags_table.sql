create table if not exists flags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  key text not null,
  enabled boolean default false,
  created_at timestamptz default now()
);
create unique index if not exists flags_org_key_unique on flags(org_id, key);
