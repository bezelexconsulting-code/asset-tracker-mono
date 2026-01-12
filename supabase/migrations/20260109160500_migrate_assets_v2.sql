-- Migrate data from assets_v2 (UUID) into canonical assets, then keep unique constraint
DO $$
BEGIN
  -- Ensure canonical table has required columns
  ALTER TABLE public.assets
    ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS asset_tag text,
    ADD COLUMN IF NOT EXISTS name text,
    ADD COLUMN IF NOT EXISTS status text DEFAULT 'available',
    ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS description text,
    ADD COLUMN IF NOT EXISTS image_url text,
    ADD COLUMN IF NOT EXISTS next_service_at date,
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

  -- Copy rows from assets_v2 if it exists; avoid duplicates using (org_id, asset_tag)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='assets_v2') THEN
    INSERT INTO public.assets (id, org_id, asset_tag, name, status, category_id, location_id, description, image_url, next_service_at, created_at)
    SELECT v.id, v.org_id, v.asset_tag, v.name, v.status, v.category_id, v.location_id, v.description, v.image_url, v.next_service_at, v.created_at
    FROM public.assets_v2 v
    WHERE NOT EXISTS (
      SELECT 1 FROM public.assets a WHERE a.org_id = v.org_id AND a.asset_tag = v.asset_tag
    );
  END IF;

  -- Unique constraint on canonical table
  DO $$ BEGIN
    ALTER TABLE public.assets ADD CONSTRAINT assets_org_tag_unique UNIQUE (org_id, asset_tag);
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
EXCEPTION WHEN others THEN NULL;
END $$;

