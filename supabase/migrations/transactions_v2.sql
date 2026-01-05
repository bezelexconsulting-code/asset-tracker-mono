create table if not exists transactions_v2 (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  asset_id uuid not null references assets_v2(id) on delete cascade,
  type text not null check (type in ('check_in','check_out')),
  from_location_id uuid references locations(id) on delete set null,
  to_location_id uuid references locations(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);
