CREATE TABLE IF NOT EXISTS public.profile_allowed_viewers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allowed_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(owner_user_id, allowed_user_id)
);

ALTER TABLE public.profile_allowed_viewers ENABLE ROW LEVEL SECURITY;

-- Owner has full control over their own allowlist
CREATE POLICY "Owner manages allowlist"
  ON public.profile_allowed_viewers
  FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Any authenticated user can read rows to check if they're allowed
CREATE POLICY "Anyone can check allowlist"
  ON public.profile_allowed_viewers
  FOR SELECT
  USING (auth.role() = 'authenticated');
