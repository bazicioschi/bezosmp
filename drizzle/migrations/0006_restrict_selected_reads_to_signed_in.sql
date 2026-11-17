ALTER POLICY "Follows are viewable by everyone" ON public.follows TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
ALTER POLICY "Profiles are viewable by everyone" ON public.profiles TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
ALTER POLICY "Anyone can view roles" ON public.user_roles TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
ALTER POLICY "Collaborators viewable by everyone" ON public.post_collaborators TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
ALTER POLICY "Verifications viewable by everyone" ON public.user_verifications TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);