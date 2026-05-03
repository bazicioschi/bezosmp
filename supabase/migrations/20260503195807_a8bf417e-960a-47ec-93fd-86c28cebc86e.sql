CREATE TABLE IF NOT EXISTS public.post_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL,
  invitee_id UUID NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_collab_status CHECK (status IN ('pending', 'accepted', 'denied'))
);

ALTER TABLE public.post_collaborations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collab invites viewable by participants"
ON public.post_collaborations FOR SELECT
USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can create collab invites"
ON public.post_collaborations FOR INSERT
WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Participants can update collab"
ON public.post_collaborations FOR UPDATE
USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS co_author_id UUID;