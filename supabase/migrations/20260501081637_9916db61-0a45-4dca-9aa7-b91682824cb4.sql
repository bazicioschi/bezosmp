-- Post reactions (one emoji per user per post)
CREATE TABLE public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions viewable by everyone" ON public.post_reactions FOR SELECT USING (true);
CREATE POLICY "Users insert own reactions" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reactions" ON public.post_reactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reactions" ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_post_reactions_post ON public.post_reactions(post_id);

-- Collaborators on posts
CREATE TABLE public.post_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
ALTER TABLE public.post_collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Collaborators viewable by everyone" ON public.post_collaborators FOR SELECT USING (true);
CREATE POLICY "Post owner can add collaborators" ON public.post_collaborators FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.user_id = auth.uid())
);
CREATE POLICY "Post owner or self can remove collaborator" ON public.post_collaborators FOR DELETE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.user_id = auth.uid())
);
CREATE INDEX idx_post_collaborators_post ON public.post_collaborators(post_id);

-- Collaboration invites
CREATE TABLE public.collab_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  inviter_id uuid NOT NULL,
  invitee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  UNIQUE (post_id, invitee_id)
);
ALTER TABLE public.collab_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Invitee or inviter can view invite" ON public.collab_invites FOR SELECT USING (
  auth.uid() = invitee_id OR auth.uid() = inviter_id
);
CREATE POLICY "Inviter creates invite" ON public.collab_invites FOR INSERT WITH CHECK (
  auth.uid() = inviter_id AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.user_id = auth.uid())
);
CREATE POLICY "Invitee responds to invite" ON public.collab_invites FOR UPDATE USING (auth.uid() = invitee_id);
CREATE POLICY "Inviter or invitee delete" ON public.collab_invites FOR DELETE USING (
  auth.uid() = inviter_id OR auth.uid() = invitee_id
);

-- Inbox (gmail-like)
CREATE TABLE public.inbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  subject text NOT NULL,
  body text,
  data jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their inbox" ON public.inbox_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone authenticated can send inbox message" ON public.inbox_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update their inbox" ON public.inbox_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete their inbox" ON public.inbox_messages FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_inbox_user_created ON public.inbox_messages(user_id, created_at DESC);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_collaborators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.collab_invites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inbox_messages;