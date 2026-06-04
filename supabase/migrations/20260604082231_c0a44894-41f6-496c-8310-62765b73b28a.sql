
-- 1. Safety: drop legacy permissive SELECT policy on messages if it exists
DROP POLICY IF EXISTS "Authenticated can read realtime" ON public.messages;

-- 2. Tighten inbox_messages INSERT: require a real relationship to the recipient
DROP POLICY IF EXISTS "Authenticated users can send notification inbox messages" ON public.inbox_messages;

CREATE POLICY "Authenticated users can send scoped inbox notifications"
ON public.inbox_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id IS NOT NULL
  AND (
    -- Self/system notifications targeting the caller
    user_id = auth.uid()
    OR (
      type = ANY (ARRAY['like','comment','follow','mention','reply','collab_invite','collab_accepted','collab_declined','message','reaction','support_reply'])
      AND (
        -- Like: caller liked a post owned by recipient
        (type = 'like' AND EXISTS (
          SELECT 1 FROM public.likes l
          JOIN public.posts p ON p.id = l.post_id
          WHERE l.user_id = auth.uid() AND p.user_id = inbox_messages.user_id
        ))
        -- Follow: caller follows recipient
        OR (type = 'follow' AND EXISTS (
          SELECT 1 FROM public.follows
          WHERE follower_id = auth.uid() AND following_id = inbox_messages.user_id
        ))
        -- Comment / reply / mention / reaction: caller commented or reacted on recipient's post
        OR (type IN ('comment','reply','mention') AND EXISTS (
          SELECT 1 FROM public.comments c
          JOIN public.posts p ON p.id = c.post_id
          WHERE c.user_id = auth.uid() AND p.user_id = inbox_messages.user_id
        ))
        OR (type = 'reaction' AND EXISTS (
          SELECT 1 FROM public.post_reactions r
          JOIN public.posts p ON p.id = r.post_id
          WHERE r.user_id = auth.uid() AND p.user_id = inbox_messages.user_id
        ))
        -- DM: caller has sent a message to recipient
        OR (type = 'message' AND EXISTS (
          SELECT 1 FROM public.messages
          WHERE sender_id = auth.uid() AND receiver_id = inbox_messages.user_id
        ))
        -- Collab: caller is the inviter for an invite involving recipient
        OR (type IN ('collab_invite','collab_accepted','collab_declined') AND (
          EXISTS (
            SELECT 1 FROM public.collab_invites
            WHERE (inviter_id = auth.uid() AND invitee_id = inbox_messages.user_id)
               OR (invitee_id = auth.uid() AND inviter_id = inbox_messages.user_id)
          )
        ))
        -- Support replies: only staff
        OR (type = 'support_reply' AND (
          public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')
        ))
      )
    )
  )
);

-- 3. Tighten post-images upload policy: require own folder
DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;

CREATE POLICY "Users can upload post images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-images'
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. Remove broad public SELECT/listing policies on public buckets.
--    Public URLs via getPublicUrl continue to work (bucket is public);
--    these policies only enabled SDK list/download which the app does not use.
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Post videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public video access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view news images" ON storage.objects;
