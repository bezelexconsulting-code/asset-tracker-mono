alter table technicians
  add column if not exists username text,
  add column if not exists password text,
  add column if not exists must_reset_password boolean default true;

alter table organizations
  add column if not exists client_username text,
  add column if not exists client_password text,
  add column if not exists client_force_reset boolean default true,
  add column if not exists active boolean default true;
