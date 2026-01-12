-- Enable RLS with permissive policies to keep the app working.
-- NOTE: For true org-scoped security, switch to JWT-based claims and update USING/with check accordingly.

DO $$
BEGIN
  -- assets
  ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS assets_select_public ON public.assets;
  DROP POLICY IF EXISTS assets_insert_public ON public.assets;
  DROP POLICY IF EXISTS assets_update_public ON public.assets;
  CREATE POLICY assets_select_public ON public.assets FOR SELECT TO anon USING (true);
  CREATE POLICY assets_insert_public ON public.assets FOR INSERT TO anon WITH CHECK (true);
  CREATE POLICY assets_update_public ON public.assets FOR UPDATE TO anon USING (true) WITH CHECK (true);

  -- clients
  ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS clients_select_public ON public.clients;
  DROP POLICY IF EXISTS clients_insert_public ON public.clients;
  DROP POLICY IF EXISTS clients_update_public ON public.clients;
  CREATE POLICY clients_select_public ON public.clients FOR SELECT TO anon USING (true);
  CREATE POLICY clients_insert_public ON public.clients FOR INSERT TO anon WITH CHECK (true);
  CREATE POLICY clients_update_public ON public.clients FOR UPDATE TO anon USING (true) WITH CHECK (true);

  -- locations
  ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS locations_select_public ON public.locations;
  DROP POLICY IF EXISTS locations_insert_public ON public.locations;
  DROP POLICY IF EXISTS locations_update_public ON public.locations;
  CREATE POLICY locations_select_public ON public.locations FOR SELECT TO anon USING (true);
  CREATE POLICY locations_insert_public ON public.locations FOR INSERT TO anon WITH CHECK (true);
  CREATE POLICY locations_update_public ON public.locations FOR UPDATE TO anon USING (true) WITH CHECK (true);

  -- categories
  ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS categories_select_public ON public.categories;
  DROP POLICY IF EXISTS categories_insert_public ON public.categories;
  DROP POLICY IF EXISTS categories_update_public ON public.categories;
  CREATE POLICY categories_select_public ON public.categories FOR SELECT TO anon USING (true);
  CREATE POLICY categories_insert_public ON public.categories FOR INSERT TO anon WITH CHECK (true);
  CREATE POLICY categories_update_public ON public.categories FOR UPDATE TO anon USING (true) WITH CHECK (true);

  -- technicians
  ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS technicians_select_public ON public.technicians;
  DROP POLICY IF EXISTS technicians_insert_public ON public.technicians;
  DROP POLICY IF EXISTS technicians_update_public ON public.technicians;
  CREATE POLICY technicians_select_public ON public.technicians FOR SELECT TO anon USING (true);
  CREATE POLICY technicians_insert_public ON public.technicians FOR INSERT TO anon WITH CHECK (true);
  CREATE POLICY technicians_update_public ON public.technicians FOR UPDATE TO anon USING (true) WITH CHECK (true);

  -- jobs
  ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS jobs_select_public ON public.jobs;
  DROP POLICY IF EXISTS jobs_insert_public ON public.jobs;
  DROP POLICY IF EXISTS jobs_update_public ON public.jobs;
  CREATE POLICY jobs_select_public ON public.jobs FOR SELECT TO anon USING (true);
  CREATE POLICY jobs_insert_public ON public.jobs FOR INSERT TO anon WITH CHECK (true);
  CREATE POLICY jobs_update_public ON public.jobs FOR UPDATE TO anon USING (true) WITH CHECK (true);

  -- activities
  ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS activities_select_public ON public.activities;
  DROP POLICY IF EXISTS activities_insert_public ON public.activities;
  DROP POLICY IF EXISTS activities_update_public ON public.activities;
  CREATE POLICY activities_select_public ON public.activities FOR SELECT TO anon USING (true);
  CREATE POLICY activities_insert_public ON public.activities FOR INSERT TO anon WITH CHECK (true);
  CREATE POLICY activities_update_public ON public.activities FOR UPDATE TO anon USING (true) WITH CHECK (true);

  -- transactions
  ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS transactions_select_public ON public.transactions;
  DROP POLICY IF EXISTS transactions_insert_public ON public.transactions;
  CREATE POLICY transactions_select_public ON public.transactions FOR SELECT TO anon USING (true);
  CREATE POLICY transactions_insert_public ON public.transactions FOR INSERT TO anon WITH CHECK (true);

  -- nfc_tags
  ALTER TABLE public.nfc_tags ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS nfc_tags_select_public ON public.nfc_tags;
  DROP POLICY IF EXISTS nfc_tags_insert_public ON public.nfc_tags;
  DROP POLICY IF EXISTS nfc_tags_update_public ON public.nfc_tags;
  CREATE POLICY nfc_tags_select_public ON public.nfc_tags FOR SELECT TO anon USING (true);
  CREATE POLICY nfc_tags_insert_public ON public.nfc_tags FOR INSERT TO anon WITH CHECK (true);
  CREATE POLICY nfc_tags_update_public ON public.nfc_tags FOR UPDATE TO anon USING (true) WITH CHECK (true);

EXCEPTION WHEN others THEN NULL;
END $$;

-- Reload PostgREST schema
NOTIFY pgrst, 'reload schema';

