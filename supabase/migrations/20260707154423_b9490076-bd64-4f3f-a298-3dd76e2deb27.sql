DROP POLICY "Authenticated users can send scoped inbox notifications" ON public.inbox_messages;
CREATE POLICY "Authenticated users can send scoped inbox notifications" ON public.inbox_messages
FOR INSERT WITH CHECK (
  (auth.uid() IS NOT NULL) AND (user_id IS NOT NULL) AND (
    (user_id = auth.uid()) OR (type = ANY (ARRAY[
      'mail','email','share','post_blocked','like','comment','follow','mention','reply','inbox_reply',
      'collab_invite','collab_accepted','collab_declined','collab_ready','collab_response',
      'message','reaction','support_reply'
    ]))
  )
);