DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins or owner can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins or owner can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));