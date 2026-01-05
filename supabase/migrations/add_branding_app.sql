alter table organizations
  add column if not exists branding_logo_url text,
  add column if not exists branding_primary_color text,
  add column if not exists app_android_url text,
  add column if not exists app_ios_url text,
  add column if not exists app_web_url text;
