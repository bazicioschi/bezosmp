CREATE TABLE public.badge_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
 badge_key text NOT NULL DEFAULT 'default' CHECK (badge_key = 'default'),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
 follower_count integer NOT NULL DEFAULT 0,
 reason text,
 reviewed_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 reviewed_at timestamptz
);
GRANT SELECT ON public.badge_requests TO authenticated;
GRANT ALL ON public.badge_requests TO service_role;
ALTER TABLE public.badge_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see own badge requests and founder sees queue" ON public.badge_requests FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR ((SELECT auth.uid()) = '1c2fd2f9-d5d2-4a3b-bd6a-b735200b7200'::uuid AND public.has_role((SELECT auth.uid()),'owner')));
CREATE UNIQUE INDEX badge_requests_one_pending ON public.badge_requests(user_id) WHERE status='pending';
CREATE OR REPLACE FUNCTION public.submit_badge_request() RETURNS public.badge_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE caller uuid := auth.uid(); followers integer; result public.badge_requests;
BEGIN
 IF caller IS NULL THEN RAISE EXCEPTION 'Sign in to request verification'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(caller::text,0));
 IF EXISTS (SELECT 1 FROM public.user_badges WHERE user_id=caller AND badge_key='default') THEN RAISE EXCEPTION 'You already own default verification'; END IF;
 SELECT * INTO result FROM public.badge_requests WHERE user_id=caller AND status='pending';
 IF FOUND THEN RETURN result; END IF;
 SELECT count(*) INTO followers FROM public.follows WHERE following_id=caller;
 INSERT INTO public.badge_requests(user_id,follower_count,status,reason,reviewed_at)
 VALUES(caller,followers,CASE WHEN followers >= 1000 THEN 'pending' ELSE 'rejected' END,CASE WHEN followers < 1000 THEN 'At least 1,000 followers are required.' ELSE NULL END,CASE WHEN followers < 1000 THEN now() ELSE NULL END) RETURNING * INTO result;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.submit_badge_request() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_badge_request() TO authenticated;
CREATE OR REPLACE FUNCTION public.review_badge_request(request_id uuid, approve boolean) RETURNS public.badge_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE caller uuid := auth.uid(); result public.badge_requests; followers integer;
BEGIN
 IF caller IS DISTINCT FROM '1c2fd2f9-d5d2-4a3b-bd6a-b735200b7200'::uuid OR NOT public.has_role(caller,'owner') THEN RAISE EXCEPTION 'Only Bazicioschi can review badge requests'; END IF;
 IF approve IS NULL THEN RAISE EXCEPTION 'Choose approve or reject'; END IF;
 SELECT * INTO result FROM public.badge_requests WHERE id=request_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
 IF result.status <> 'pending' THEN RAISE EXCEPTION 'This request has already been reviewed'; END IF;
 SELECT count(*) INTO followers FROM public.follows WHERE following_id=result.user_id;
 UPDATE public.badge_requests SET status=CASE WHEN approve AND followers >= 1000 THEN 'approved' ELSE 'rejected' END,follower_count=followers,reviewed_by=caller,reviewed_at=now(),reason=CASE WHEN followers < 1000 THEN 'At least 1,000 followers are required.' WHEN NOT approve THEN 'Rejected by Bazicioschi.' ELSE NULL END WHERE id=request_id RETURNING * INTO result;
 IF result.status='approved' THEN
 INSERT INTO public.user_badges(user_id,badge_key,granted_by) VALUES(result.user_id,'default',caller) ON CONFLICT DO NOTHING;
 END IF;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.review_badge_request(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_badge_request(uuid,boolean) TO authenticated;