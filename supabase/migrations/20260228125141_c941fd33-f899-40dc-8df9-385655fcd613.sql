
-- Allow moderators to delete posts
CREATE POLICY "Moderators can delete any post"
ON public.posts FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to delete comments
CREATE POLICY "Moderators can delete any comment"
ON public.comments FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to delete news
CREATE POLICY "Moderators can delete any news"
ON public.news FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to update support tickets (respond)
CREATE POLICY "Moderators can update tickets"
ON public.support_tickets FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to view all support tickets
CREATE POLICY "Moderators can view all tickets"
ON public.support_tickets FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'moderator'::app_role));
