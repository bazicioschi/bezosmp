-- 1) Restore SELECT on own storage objects (required for upsert uploads: avatar/banner/PFP)
CREATE POLICY "Users can read own files in avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own files in post-images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'post-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own files in post-videos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'post-videos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own files in news-images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'news-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 2) Allow inbox replies
DROP POLICY IF EXISTS "Authenticated users can send scoped inbox notifications" ON public.inbox_messages;
CREATE POLICY "Authenticated users can send scoped inbox notifications"
  ON public.inbox_messages FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id IS NOT NULL
    AND (
      user_id = auth.uid()
      OR type = ANY (ARRAY['mail','email','share','post_blocked','like','comment','follow','mention','reply','inbox_reply','collab_invite','collab_accepted','collab_declined','message','reaction','support_reply']::text[])
    )
  );

-- 3) Anonymous support tickets (banned users can contact support without logging in)
ALTER TABLE public.support_tickets ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS contact_name TEXT;

GRANT INSERT ON public.support_tickets TO anon;

CREATE POLICY "Anonymous users can create tickets"
  ON public.support_tickets FOR INSERT TO anon
  WITH CHECK (user_id IS NULL AND contact_name IS NOT NULL AND length(trim(contact_name)) BETWEEN 1 AND 50 AND length(subject) <= 100 AND length(message) <= 2000);