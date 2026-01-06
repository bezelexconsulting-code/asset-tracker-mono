create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  requester_email text,
  subject text,
  message text,
  status text default 'open',
  created_at timestamptz default now()
);
