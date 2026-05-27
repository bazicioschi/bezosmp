-- 1. Add 'suspended' to restriction_type check constraint
ALTER TABLE public.user_restrictions
  DROP CONSTRAINT IF EXISTS user_restrictions_restriction_type_check;

ALTER TABLE public.user_restrictions
  ADD CONSTRAINT user_restrictions_restriction_type_check
  CHECK (restriction_type IN ('no_posting', 'no_commenting', 'no_messaging', 'banned', 'suspended'));

-- 2. Allow moderators and owners to also manage restrictions (previously admin-only)
DROP POLICY IF EXISTS "Only admins can add restrictions" ON public.user_restrictions;
DROP POLICY IF EXISTS "Only admins can remove restrictions" ON public.user_restrictions;
DROP POLICY IF EXISTS "Mods and admins can add restrictions" ON public.user_restrictions;
DROP POLICY IF EXISTS "Mods and admins can remove restrictions" ON public.user_restrictions;

CREATE POLICY "Mods and admins can add restrictions"
  ON public.user_restrictions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR public.has_role(auth.uid(), 'owner')
  );

CREATE POLICY "Mods and admins can remove restrictions"
  ON public.user_restrictions FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR public.has_role(auth.uid(), 'owner')
  );

-- 3. Public function to check if a user is currently suspended (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_user_suspended(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_restrictions
    WHERE user_id = target_user_id
      AND restriction_type = 'suspended'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Public function to get suspension expiry for display
CREATE OR REPLACE FUNCTION public.get_suspension_expiry(target_user_id uuid)
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT expires_at FROM public.user_restrictions
  WHERE user_id = target_user_id
    AND restriction_type = 'suspended'
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

-- 4. Add 'blocked' column to posts table (moderators can hide posts)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS blocked BOOLEAN NOT NULL DEFAULT false;

-- 5. Allow mods/admins to UPDATE posts (to block them)
CREATE POLICY "Mods can update any post"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR public.has_role(auth.uid(), 'owner')
  );

-- 6. Update posts/comments/messages INSERT policies to also block suspended users
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT public.has_restriction(auth.uid(), 'no_posting')
    AND NOT public.has_restriction(auth.uid(), 'banned')
    AND NOT public.is_user_suspended(auth.uid())
  );

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT public.has_restriction(auth.uid(), 'no_commenting')
    AND NOT public.has_restriction(auth.uid(), 'banned')
    AND NOT public.is_user_suspended(auth.uid())
  );

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND NOT public.has_restriction(auth.uid(), 'no_messaging')
    AND NOT public.has_restriction(auth.uid(), 'banned')
    AND NOT public.is_user_suspended(auth.uid())
  );
