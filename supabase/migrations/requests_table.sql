create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  requester_email text,
  note text,
  status text default 'pending',
  created_at timestamptz default now()
);
