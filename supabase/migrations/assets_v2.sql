create table if not exists assets_v2 (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  asset_tag text not null,
  name text not null,
  status text not null default 'available',
  category_id uuid references categories(id) on delete set null,
  location_id uuid references locations(id) on delete set null,
  description text,
  image_url text,
  next_service_at date,
  created_at timestamptz default now(),
  unique (org_id, asset_tag)
);

-- convenience view for unified reads later
create or replace view assets_unified as
select 
  a.id,
  a.org_id,
  a.asset_tag,
  a.name,
  a.status,
  a.category_id,
  a.location_id,
  a.description,
  a.image_url,
  a.next_service_at,
  a.created_at
from assets_v2 a;
