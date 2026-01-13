ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS categories_select_org ON public.categories;
DROP POLICY IF EXISTS categories_insert_org ON public.categories;
DROP POLICY IF EXISTS categories_update_org ON public.categories;

ALTER TABLE public.categories
  ALTER COLUMN org_id DROP DEFAULT,
  ALTER COLUMN org_id SET DEFAULT (current_setting('request.header.app-org-id', true))::uuid;

CREATE POLICY categories_select_org ON public.categories
  FOR SELECT TO anon
  USING (org_id::text = current_setting('request.header.app-org-id', true));

CREATE POLICY categories_insert_org ON public.categories
  FOR INSERT TO anon
  WITH CHECK (org_id::text = current_setting('request.header.app-org-id', true));

CREATE POLICY categories_update_org ON public.categories
  FOR UPDATE TO anon
  USING (org_id::text = current_setting('request.header.app-org-id', true))
  WITH CHECK (org_id::text = current_setting('request.header.app-org-id', true));

CREATE OR REPLACE FUNCTION public.add_category_by_slug(p_slug text, p_name text)
RETURNS public.categories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_row public.categories%ROWTYPE;
BEGIN
  SELECT id INTO v_org FROM public.organizations WHERE slug = p_slug LIMIT 1;
  IF v_org IS NULL THEN RAISE EXCEPTION 'organization slug not found'; END IF;
  INSERT INTO public.categories(org_id, name)
  VALUES (v_org, p_name)
  RETURNING * INTO v_row;
  RETURN v_row;
END
$$;

GRANT EXECUTE ON FUNCTION public.add_category_by_slug(text, text) TO anon;

CREATE OR REPLACE FUNCTION public.get_categories_by_slug(p_slug text)
RETURNS SETOF public.categories
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.* FROM public.categories c
  JOIN public.organizations o ON o.id = c.org_id
  WHERE o.slug = p_slug
  ORDER BY c.name;
$$;

GRANT EXECUTE ON FUNCTION public.get_categories_by_slug(text) TO anon;

NOTIFY pgrst, 'reload schema';

