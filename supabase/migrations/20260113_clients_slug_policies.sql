ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clients_select_org ON public.clients;
DROP POLICY IF EXISTS clients_insert_org ON public.clients;
DROP POLICY IF EXISTS clients_update_org ON public.clients;

ALTER TABLE public.clients
  ALTER COLUMN org_id DROP DEFAULT,
  ALTER COLUMN org_id SET DEFAULT (current_setting('request.header.app-org-id', true))::uuid;

CREATE POLICY clients_select_org ON public.clients
  FOR SELECT TO anon
  USING (org_id::text = current_setting('request.header.app-org-id', true));

CREATE POLICY clients_insert_org ON public.clients
  FOR INSERT TO anon
  WITH CHECK (org_id::text = current_setting('request.header.app-org-id', true));

CREATE POLICY clients_update_org ON public.clients
  FOR UPDATE TO anon
  USING (org_id::text = current_setting('request.header.app-org-id', true))
  WITH CHECK (org_id::text = current_setting('request.header.app-org-id', true));

CREATE OR REPLACE FUNCTION public.get_clients_by_slug(p_slug text)
RETURNS SETOF public.clients
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.* FROM public.clients c
  JOIN public.organizations o ON o.id = c.org_id
  WHERE o.slug = p_slug
  ORDER BY c.created_at DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_clients_by_slug(text) TO anon;

NOTIFY pgrst, 'reload schema';

