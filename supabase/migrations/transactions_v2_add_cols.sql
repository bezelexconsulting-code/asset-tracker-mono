alter table transactions_v2
  add column if not exists user_id text,
  add column if not exists expected_return_date date;

alter table assets_v2
  add column if not exists assigned_user_id text;
