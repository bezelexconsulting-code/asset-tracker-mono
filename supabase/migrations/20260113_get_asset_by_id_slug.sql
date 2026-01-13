CREATE OR REPLACE FUNCTION public.get_asset_by_id_slug(p_slug text, p_id text)
RETURNS public.assets
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.* FROM public.assets a
  JOIN public.organizations o ON o.id = a.org_id
  WHERE o.slug = p_slug AND a.id = p_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_asset_by_id_slug(text, text) TO anon;

NOTIFY pgrst, 'reload schema';
