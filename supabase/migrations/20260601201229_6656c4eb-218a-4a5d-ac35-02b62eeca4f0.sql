
CREATE TABLE public.user_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  granted_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_verifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_verifications TO authenticated;
GRANT ALL ON public.user_verifications TO service_role;

ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verifications viewable by everyone"
ON public.user_verifications FOR SELECT
USING (true);

CREATE POLICY "Only owner can grant verification"
ON public.user_verifications FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'owner'::app_role) AND auth.uid() = granted_by);

CREATE POLICY "Only owner can remove verification"
ON public.user_verifications FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'owner'::app_role));
