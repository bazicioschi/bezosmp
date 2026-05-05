
-- 1. Add session_id to post_collaborations (referenced in code but missing in DB)
ALTER TABLE public.post_collaborations
  ADD COLUMN IF NOT EXISTS session_id UUID;

UPDATE public.post_collaborations
  SET session_id = id
  WHERE session_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_post_collaborations_session_id
  ON public.post_collaborations(session_id);

-- 2. Formalize video_url column on posts (already in DB; idempotent)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 3. Storage policies for post-videos bucket
CREATE POLICY "Post videos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-videos');

CREATE POLICY "Users can upload their own post videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-videos'
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own post videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Restrict user_restrictions visibility (was public to everyone)
DROP POLICY IF EXISTS "Restrictions viewable by everyone" ON public.user_restrictions;

CREATE POLICY "Users view own restrictions or moderators view all"
  ON public.user_restrictions FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR public.has_role(auth.uid(), 'owner')
  );

-- 5. Server-side enforcement of restrictions on posts/comments/messages
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT public.has_restriction(auth.uid(), 'no_posting')
    AND NOT public.has_restriction(auth.uid(), 'banned')
  );

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT public.has_restriction(auth.uid(), 'no_commenting')
    AND NOT public.has_restriction(auth.uid(), 'banned')
  );

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND NOT public.has_restriction(auth.uid(), 'no_messaging')
    AND NOT public.has_restriction(auth.uid(), 'banned')
  );

-- 6. Server-side length constraints for data integrity
ALTER TABLE public.posts
  ADD CONSTRAINT posts_content_length CHECK (length(content) <= 5000);
ALTER TABLE public.comments
  ADD CONSTRAINT comments_content_length CHECK (length(content) <= 2000);
ALTER TABLE public.messages
  ADD CONSTRAINT messages_content_length CHECK (length(content) <= 5000);
ALTER TABLE public.news
  ADD CONSTRAINT news_title_length CHECK (length(title) <= 200);
ALTER TABLE public.news
  ADD CONSTRAINT news_content_length CHECK (length(content) <= 10000);
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR length(bio) <= 1000);
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_length CHECK (length(username) BETWEEN 1 AND 50);

-- 7. Harden handle_new_user with username validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_username TEXT;
BEGIN
  new_username := COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8));
  IF new_username !~ '^[a-zA-Z0-9_]{3,30}$' THEN
    new_username := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, new_username);
  RETURN NEW;
END;
$$;
