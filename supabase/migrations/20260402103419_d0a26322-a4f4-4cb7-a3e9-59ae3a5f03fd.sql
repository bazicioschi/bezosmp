CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO public
USING (auth.uid() = user_id);