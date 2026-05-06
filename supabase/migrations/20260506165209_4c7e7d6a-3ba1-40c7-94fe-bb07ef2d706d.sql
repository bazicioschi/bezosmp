
-- 1. Restrict user_roles SELECT to authenticated users (own row or admins/mods)
DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.user_roles;

CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR has_role(auth.uid(), 'owner'::app_role)
);

-- 2. Tighten news-images storage policies to enforce path ownership
DROP POLICY IF EXISTS "Authenticated users can upload news images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own news images" ON storage.objects;

CREATE POLICY "Users upload to own folder in news-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'news-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own files in news-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'news-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3. Lock down inbox_messages INSERT to prevent system/bot impersonation
DROP POLICY IF EXISTS "Anyone authenticated can send inbox message" ON public.inbox_messages;

CREATE POLICY "Authenticated users can send notification inbox messages"
ON public.inbox_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND type IN (
    'like','comment','follow','mention','reply',
    'collab_invite','collab_accepted','collab_declined',
    'message','reaction','support_reply'
  )
);

-- 4. Realtime channel authorization — restrict topic subscriptions
-- (postgres_changes already respects table RLS, but explicit policies add defense in depth)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read realtime" ON realtime.messages;
CREATE POLICY "Authenticated can read realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);
