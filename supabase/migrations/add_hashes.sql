-- Add hashed password columns for safer authentication (PoC; consider Supabase Auth)
alter table organizations
  add column if not exists client_hashed_password text;

alter table technicians
  add column if not exists hashed_password text;
