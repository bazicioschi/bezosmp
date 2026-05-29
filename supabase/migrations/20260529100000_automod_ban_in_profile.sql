-- Add automod ban expiry column to profiles (written by the user themselves, readable by all)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS automod_banned_until TIMESTAMPTZ;
