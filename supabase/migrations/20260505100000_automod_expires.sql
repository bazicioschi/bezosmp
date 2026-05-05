-- Allow bot/system to ban without a real auth user (created_by nullable)
ALTER TABLE public.user_restrictions
  ALTER COLUMN created_by DROP NOT NULL;

-- Allow timed bans (NULL = permanent)
ALTER TABLE public.user_restrictions
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Allow reason to store more text for automod
ALTER TABLE public.user_restrictions
  ALTER COLUMN reason TYPE TEXT;

-- Index for expiry lookups
CREATE INDEX IF NOT EXISTS idx_user_restrictions_expires
  ON public.user_restrictions(expires_at)
  WHERE expires_at IS NOT NULL;
