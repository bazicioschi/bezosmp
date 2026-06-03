
CREATE TABLE public.profile_view_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, owner_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_view_requests TO authenticated;
GRANT ALL ON public.profile_view_requests TO service_role;

ALTER TABLE public.profile_view_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own requests (sent or received)"
  ON public.profile_view_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create their own access requests"
  ON public.profile_view_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id AND auth.uid() <> owner_id);

CREATE POLICY "Owner can update the request status"
  ON public.profile_view_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Requester can cancel their request"
  ON public.profile_view_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE TRIGGER update_profile_view_requests_updated_at
  BEFORE UPDATE ON public.profile_view_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_view_requests;
