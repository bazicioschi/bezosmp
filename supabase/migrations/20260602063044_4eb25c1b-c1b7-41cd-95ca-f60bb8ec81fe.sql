ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;

ALTER TABLE public.user_restrictions
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS automod_banned_until timestamptz,
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_user_restrictions_expires_at
ON public.user_restrictions(expires_at)
WHERE expires_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.is_user_suspended(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_restrictions
    WHERE user_id = target_user_id
      AND restriction_type = 'suspended'
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

CREATE OR REPLACE FUNCTION public.get_suspension_expiry(target_user_id uuid)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT expires_at
  FROM public.user_restrictions
  WHERE user_id = target_user_id
    AND restriction_type = 'suspended'
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY expires_at NULLS LAST
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.is_user_suspended(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_suspension_expiry(uuid) TO anon, authenticated;