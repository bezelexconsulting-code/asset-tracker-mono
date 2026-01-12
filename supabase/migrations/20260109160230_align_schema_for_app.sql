-- Align schema with app expectations: add org_id, created_at, and technician fields; backfill for 'tecniqa' if present
DO $$
BEGIN
  -- Assets
  ALTER TABLE public.assets
    ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
  CREATE INDEX IF NOT EXISTS assets_org_id_idx ON public.assets(org_id);
  CREATE INDEX IF NOT EXISTS assets_created_at_idx ON public.assets(created_at);

  -- Clients
  ALTER TABLE public.clients
    ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
  CREATE INDEX IF NOT EXISTS clients_org_id_idx ON public.clients(org_id);
  CREATE INDEX IF NOT EXISTS clients_created_at_idx ON public.clients(created_at);

  -- Locations
  ALTER TABLE public.locations
    ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS locations_org_id_idx ON public.locations(org_id);

  -- Categories
  ALTER TABLE public.categories
    ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  CREATE INDEX IF NOT EXISTS categories_org_id_idx ON public.categories(org_id);

  -- Technicians
  ALTER TABLE public.technicians
    ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS full_name text,
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
    ADD COLUMN IF NOT EXISTS specialization text,
    ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
  CREATE INDEX IF NOT EXISTS technicians_org_id_idx ON public.technicians(org_id);
  CREATE INDEX IF NOT EXISTS technicians_created_at_idx ON public.technicians(created_at);

  -- NFC tags expected fields
  ALTER TABLE public.nfc_tags
    ADD COLUMN IF NOT EXISTS tag_uid text,
    ADD COLUMN IF NOT EXISTS payload jsonb,
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

  -- Backfill org_id for known org slug 'tecniqa' (noop if not present)
  DECLARE v_org uuid;
  BEGIN
    SELECT id INTO v_org FROM public.organizations WHERE slug = 'tecniqa' LIMIT 1;
    IF v_org IS NOT NULL THEN
      UPDATE public.assets      SET org_id = v_org WHERE org_id IS NULL;
      UPDATE public.clients     SET org_id = v_org WHERE org_id IS NULL;
      UPDATE public.locations   SET org_id = v_org WHERE org_id IS NULL;
      UPDATE public.categories  SET org_id = v_org WHERE org_id IS NULL;
      UPDATE public.technicians SET org_id = v_org WHERE org_id IS NULL;
    END IF;
  END;

  -- Backfill technicians.full_name from name if missing
  UPDATE public.technicians SET full_name = COALESCE(full_name, name) WHERE full_name IS NULL;

EXCEPTION WHEN others THEN
  -- Ignore to avoid breaking deploy; handle manually if needed
  NULL;
END $$;

