-- Enforce unique slug and cascade deletes
ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_slug_unique UNIQUE (slug);

-- Technicians FK cascade
DO $$ BEGIN
  ALTER TABLE public.technicians DROP CONSTRAINT IF EXISTS technicians_org_id_fkey;
  ALTER TABLE public.technicians
    ADD CONSTRAINT technicians_org_id_fkey FOREIGN KEY (org_id)
    REFERENCES public.organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

-- Assets FK cascade
DO $$ BEGIN
  ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_org_id_fkey;
  ALTER TABLE public.assets
    ADD CONSTRAINT assets_org_id_fkey FOREIGN KEY (org_id)
    REFERENCES public.organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

-- Clients FK cascade
DO $$ BEGIN
  ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_org_id_fkey;
  ALTER TABLE public.clients
    ADD CONSTRAINT clients_org_id_fkey FOREIGN KEY (org_id)
    REFERENCES public.organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

-- Locations FK cascade
DO $$ BEGIN
  ALTER TABLE public.locations DROP CONSTRAINT IF EXISTS locations_org_id_fkey;
  ALTER TABLE public.locations
    ADD CONSTRAINT locations_org_id_fkey FOREIGN KEY (org_id)
    REFERENCES public.organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

-- Jobs FK cascade
DO $$ BEGIN
  ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_org_id_fkey;
  ALTER TABLE public.jobs
    ADD CONSTRAINT jobs_org_id_fkey FOREIGN KEY (org_id)
    REFERENCES public.organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

-- Activities FK cascade
DO $$ BEGIN
  ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_org_id_fkey;
  ALTER TABLE public.activities
    ADD CONSTRAINT activities_org_id_fkey FOREIGN KEY (org_id)
    REFERENCES public.organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

-- NFC tags FK cascade
DO $$ BEGIN
  ALTER TABLE public.nfc_tags DROP CONSTRAINT IF EXISTS nfc_tags_org_id_fkey;
  ALTER TABLE public.nfc_tags
    ADD CONSTRAINT nfc_tags_org_id_fkey FOREIGN KEY (org_id)
    REFERENCES public.organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

-- Slug-aware RPCs
CREATE OR REPLACE FUNCTION public.add_technician_by_slug(
  p_slug text,
  p_full_name text,
  p_email text,
  p_username text,
  p_specialization text,
  p_temp_password text
) RETURNS public.technicians
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_hash text;
  v_row public.technicians%ROWTYPE;
BEGIN
  SELECT id INTO v_org FROM public.organizations WHERE slug = p_slug LIMIT 1;
  IF v_org IS NULL THEN RAISE EXCEPTION 'organization slug not found'; END IF;
  IF COALESCE(p_temp_password,'') <> '' THEN
    v_hash := extensions.crypt(p_temp_password, extensions.gen_salt('bf'::text));
  ELSE
    v_hash := NULL;
  END IF;
  INSERT INTO public.technicians(org_id, full_name, email, username, specialization, is_active, password, hashed_password, must_reset_password)
  VALUES (v_org, p_full_name, p_email, p_username, p_specialization, TRUE, '', v_hash, v_hash IS NOT NULL)
  RETURNING * INTO v_row;
  RETURN v_row;
END
$$;

GRANT EXECUTE ON FUNCTION public.add_technician_by_slug(text, text, text, text, text, text) TO anon;

CREATE OR REPLACE FUNCTION public.get_technicians_by_slug(p_slug text)
RETURNS SETOF public.technicians
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.* FROM public.technicians t
  JOIN public.organizations o ON o.id = t.org_id
  WHERE o.slug = p_slug
  ORDER BY t.full_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_technicians_by_slug(text) TO anon;

NOTIFY pgrst, 'reload schema';

