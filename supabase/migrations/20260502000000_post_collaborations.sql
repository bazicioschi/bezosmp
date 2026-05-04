-- Create post_collaborations table for tracking collaboration invitations
CREATE TABLE public.post_collaborations (
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

-- Add message_type and collab_invite_id to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'regular';

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS collab_invite_id UUID REFERENCES public.post_collaborations(id) ON DELETE SET NULL;

-- Add co_author_id to posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS co_author_id UUID;

-- Enable realtime for collaborations
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_collaborations;

-- Indexes
CREATE INDEX idx_post_collaborations_invitee ON public.post_collaborations(invitee_id);
CREATE INDEX idx_post_collaborations_inviter ON public.post_collaborations(inviter_id);
CREATE INDEX idx_messages_collab_invite ON public.messages(collab_invite_id) WHERE collab_invite_id IS NOT NULL;
