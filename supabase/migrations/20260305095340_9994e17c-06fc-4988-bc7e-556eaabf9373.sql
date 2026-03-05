ALTER TABLE public.posts ADD COLUMN likes_count_override integer DEFAULT NULL;

-- Allow admins to update posts (for setting likes_count_override)
CREATE POLICY "Admins can update any post"
ON public.posts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));