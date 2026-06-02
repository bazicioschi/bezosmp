DROP POLICY IF EXISTS "Only owner can update verification colors" ON public.user_verifications;

CREATE POLICY "Only owner can update verification colors"
ON public.user_verifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role));