-- Enable strict RLS and slug-aware RPCs for assets and locations

-- Assets RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS assets_select_org ON public.assets;
DROP POLICY IF EXISTS assets_insert_org ON public.assets;
DROP POLICY IF EXISTS assets_update_org ON public.assets;

ALTER TABLE public.assets
  ALTER COLUMN org_id DROP DEFAULT,
  ALTER COLUMN org_id SET DEFAULT (current_setting('request.header.app-org-id', true))::uuid;

CREATE POLICY assets_select_org ON public.assets
  FOR SELECT TO anon
  USING (org_id::text = current_setting('request.header.app-org-id', true));

CREATE POLICY assets_insert_org ON public.assets
  FOR INSERT TO anon
  WITH CHECK (org_id::text = current_setting('request.header.app-org-id', true));

CREATE POLICY assets_update_org ON public.assets
  FOR UPDATE TO anon
  USING (org_id::text = current_setting('request.header.app-org-id', true))
  WITH CHECK (org_id::text = current_setting('request.header.app-org-id', true));

-- Locations RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS locations_select_org ON public.locations;
DROP POLICY IF EXISTS locations_insert_org ON public.locations;
DROP POLICY IF EXISTS locations_update_org ON public.locations;

ALTER TABLE public.locations
  ALTER COLUMN org_id DROP DEFAULT,
  ALTER COLUMN org_id SET DEFAULT (current_setting('request.header.app-org-id', true))::uuid;

CREATE POLICY locations_select_org ON public.locations
  FOR SELECT TO anon
  USING (org_id::text = current_setting('request.header.app-org-id', true));

CREATE POLICY locations_insert_org ON public.locations
  FOR INSERT TO anon
  WITH CHECK (org_id::text = current_setting('request.header.app-org-id', true));

CREATE POLICY locations_update_org ON public.locations
  FOR UPDATE TO anon
  USING (org_id::text = current_setting('request.header.app-org-id', true))
  WITH CHECK (org_id::text = current_setting('request.header.app-org-id', true));

-- Slug-aware RPCs for assets
CREATE OR REPLACE FUNCTION public.add_asset_by_slug(
  p_slug text,
  p_asset_tag text,
  p_name text,
  p_status text DEFAULT 'available',
  p_client_id uuid DEFAULT NULL,
  p_location_id uuid DEFAULT NULL,
  p_description text DEFAULT '',
  p_image_url text DEFAULT NULL
) RETURNS public.assets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_row public.assets%ROWTYPE;
BEGIN
  SELECT id INTO v_org FROM public.organizations WHERE slug = p_slug LIMIT 1;
  IF v_org IS NULL THEN RAISE EXCEPTION 'organization slug not found'; END IF;
  INSERT INTO public.assets(org_id, asset_tag, name, status, client_id, location_id, description, image_url)
  VALUES (v_org, p_asset_tag, p_name, COALESCE(p_status,'available'), p_client_id, p_location_id, COALESCE(p_description,''), p_image_url)
  RETURNING * INTO v_row;
  RETURN v_row;
END
$$;

GRANT EXECUTE ON FUNCTION public.add_asset_by_slug(text, text, text, text, uuid, uuid, text, text) TO anon;

CREATE OR REPLACE FUNCTION public.get_assets_by_slug(p_slug text)
RETURNS SETOF public.assets
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.* FROM public.assets a
  JOIN public.organizations o ON o.id = a.org_id
  WHERE o.slug = p_slug
  ORDER BY a.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_assets_by_slug(text) TO anon;

-- Slug-aware RPCs for locations
CREATE OR REPLACE FUNCTION public.add_location_by_slug(
  p_slug text,
  p_name text,
  p_address text DEFAULT '',
  p_client_id uuid DEFAULT NULL
) RETURNS public.locations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_row public.locations%ROWTYPE;
BEGIN
  SELECT id INTO v_org FROM public.organizations WHERE slug = p_slug LIMIT 1;
  IF v_org IS NULL THEN RAISE EXCEPTION 'organization slug not found'; END IF;
  INSERT INTO public.locations(org_id, name, address, client_id)
  VALUES (v_org, p_name, COALESCE(p_address,''), p_client_id)
  RETURNING * INTO v_row;
  RETURN v_row;
END
$$;

GRANT EXECUTE ON FUNCTION public.add_location_by_slug(text, text, text, uuid) TO anon;

CREATE OR REPLACE FUNCTION public.get_locations_by_slug(p_slug text)
RETURNS SETOF public.locations
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.* FROM public.locations l
  JOIN public.organizations o ON o.id = l.org_id
  WHERE o.slug = p_slug
  ORDER BY l.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_locations_by_slug(text) TO anon;

NOTIFY pgrst, 'reload schema';

