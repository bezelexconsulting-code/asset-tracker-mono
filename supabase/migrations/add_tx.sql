create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  asset_id text not null references assets(id) on delete cascade,
  technician_id uuid references technicians(id) on delete set null,
  type text not null check (type in ('check_in','check_out')),
  notes text,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  actor text,
  entity text not null,
  entity_id text,
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

create table if not exists nfc_tags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  asset_id text not null references assets(id) on delete cascade,
  tag_uid text not null,
  payload jsonb,
  created_at timestamptz default now(),
  unique(org_id, tag_uid)
);
