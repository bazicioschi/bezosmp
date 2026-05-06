
DROP POLICY IF EXISTS "Authenticated users can send notification inbox messages" ON public.inbox_messages;

CREATE POLICY "Authenticated users can send notification inbox messages"
ON public.inbox_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    type IN (
      'like','comment','follow','mention','reply',
      'collab_invite','collab_accepted','collab_declined',
      'message','reaction','support_reply'
    )
    OR (type = 'bot_ban' AND user_id = auth.uid())
  )
);
