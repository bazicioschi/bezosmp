
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;
CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'post-images' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'post-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can send scoped inbox notifications" ON public.inbox_messages;
CREATE POLICY "Authenticated users can send scoped inbox notifications"
ON public.inbox_messages FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id IS NOT NULL
  AND (
    user_id = auth.uid()
    OR type IN ('mail','email','share','post_blocked','like','comment','follow','mention','reply','collab_invite','collab_accepted','collab_declined','message','reaction','support_reply')
  )
);

DROP POLICY IF EXISTS "Cato cannot moderate founder posts (delete)" ON public.posts;
CREATE POLICY "Cato cannot moderate founder posts (delete)"
ON public.posts AS RESTRICTIVE FOR DELETE
USING (
  NOT (
    auth.uid() = '3207126e-7b1e-42dd-a635-4ff2f849dbbc'::uuid
    AND user_id = '1c2fd2f9-d5d2-4a3b-bd6a-b735200b7200'::uuid
  )
);

DROP POLICY IF EXISTS "Cato cannot moderate founder posts (update)" ON public.posts;
CREATE POLICY "Cato cannot moderate founder posts (update)"
ON public.posts AS RESTRICTIVE FOR UPDATE
USING (
  NOT (
    auth.uid() = '3207126e-7b1e-42dd-a635-4ff2f849dbbc'::uuid
    AND user_id = '1c2fd2f9-d5d2-4a3b-bd6a-b735200b7200'::uuid
    AND auth.uid() <> user_id
  )
);

DROP POLICY IF EXISTS "Users view own roles or staff view all" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;
CREATE POLICY "Anyone can view roles"
ON public.user_roles FOR SELECT
USING (true);

INSERT INTO public.user_verifications (user_id, granted_by, badge_color)
VALUES (
  '3207126e-7b1e-42dd-a635-4ff2f849dbbc'::uuid,
  '1c2fd2f9-d5d2-4a3b-bd6a-b735200b7200'::uuid,
  'rat'
)
ON CONFLICT (user_id) DO UPDATE SET badge_color = 'rat';
