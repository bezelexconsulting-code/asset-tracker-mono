CREATE OR REPLACE FUNCTION public.add_client_by_slug(
  p_slug text,
  p_name text,
  p_contact_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_contact_person text DEFAULT NULL,
  p_logo_url text DEFAULT NULL
) RETURNS public.clients
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_row public.clients%ROWTYPE;
BEGIN
  SELECT id INTO v_org FROM public.organizations WHERE slug = p_slug LIMIT 1;
  IF v_org IS NULL THEN RAISE EXCEPTION 'organization slug not found'; END IF;
  INSERT INTO public.clients(org_id, name, contact_email, phone, address, contact_person, logo_url)
  VALUES (v_org, p_name, p_contact_email, p_phone, p_address, p_contact_person, p_logo_url)
  RETURNING * INTO v_row;
  RETURN v_row;
END
$$;

GRANT EXECUTE ON FUNCTION public.add_client_by_slug(text, text, text, text, text, text, text) TO anon;

NOTIFY pgrst, 'reload schema';

