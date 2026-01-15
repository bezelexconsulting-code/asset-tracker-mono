CREATE OR REPLACE FUNCTION public.get_transactions_by_slug(
  p_slug text,
  p_limit integer DEFAULT 10
)
RETURNS SETOF public.transactions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.* FROM public.transactions t
  JOIN public.organizations o ON o.id = t.org_id
  WHERE o.slug = p_slug
  ORDER BY t.created_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_transactions_by_slug(text, integer) TO anon;

NOTIFY pgrst, 'reload schema';
