CREATE OR REPLACE FUNCTION public.get_dashboard_counts_by_slug(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_assets integer := 0;
  v_checked integer := 0;
  v_clients integer := 0;
  v_techs integer := 0;
BEGIN
  SELECT id INTO v_org FROM public.organizations WHERE slug = p_slug LIMIT 1;
  IF v_org IS NULL THEN
    RETURN jsonb_build_object('assets',0,'checked',0,'clients',0,'technicians',0);
  END IF;
  SELECT COUNT(*) INTO v_assets FROM public.assets WHERE org_id = v_org;
  SELECT COUNT(*) INTO v_checked FROM public.assets WHERE org_id = v_org AND status = 'checked_out';
  SELECT COUNT(*) INTO v_clients FROM public.clients WHERE org_id = v_org;
  SELECT COUNT(*) INTO v_techs FROM public.technicians WHERE org_id = v_org;
  RETURN jsonb_build_object('assets',v_assets,'checked',v_checked,'clients',v_clients,'technicians',v_techs);
END
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_counts_by_slug(text) TO anon;

NOTIFY pgrst, 'reload schema';

