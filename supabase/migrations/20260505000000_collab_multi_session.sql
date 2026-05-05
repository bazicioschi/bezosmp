-- Add session_id to group multiple invites for the same collaborative post
ALTER TABLE public.post_collaborations
  ADD COLUMN IF NOT EXISTS session_id UUID;

-- Existing single-invitee rows get session_id = their own id (backward compat)
UPDATE public.post_collaborations
  SET session_id = id
  WHERE session_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_post_collaborations_session
  ON public.post_collaborations(session_id);
