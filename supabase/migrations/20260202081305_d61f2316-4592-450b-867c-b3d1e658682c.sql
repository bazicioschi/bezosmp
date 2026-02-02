-- Allow users to mark messages as read (update the read status)
CREATE POLICY "Users can mark messages as read" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);