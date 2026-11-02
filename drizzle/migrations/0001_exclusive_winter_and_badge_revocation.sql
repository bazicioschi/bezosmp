ALTER TABLE public.user_badges ADD CONSTRAINT winter_exclusive_recipients CHECK (badge_key <> 'winter' OR user_id IN ('4c6f9f37-7af7-42f4-9f66-102306f47609'::uuid,'da6d228d-9e1f-486a-8cb5-c31176989fa6'::uuid,'88be6d44-e200-433e-a6bd-f9b3af59e4b7'::uuid)) NOT VALID;
ALTER TABLE public.user_verifications ADD CONSTRAINT legacy_winter_exclusive CHECK (badge_color IS DISTINCT FROM 'winter' OR user_id IN ('4c6f9f37-7af7-42f4-9f66-102306f47609'::uuid,'da6d228d-9e1f-486a-8cb5-c31176989fa6'::uuid,'88be6d44-e200-433e-a6bd-f9b3af59e4b7'::uuid)) NOT VALID;
CREATE OR REPLACE FUNCTION public.revoke_user_badge(target_user_id uuid, target_badge text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS DISTINCT FROM '1c2fd2f9-d5d2-4a3b-bd6a-b735200b7200'::uuid OR NOT public.has_role(auth.uid(),'owner') THEN RAISE EXCEPTION 'Only Bazicioschi can remove badges'; END IF;
 DELETE FROM public.user_verifications WHERE user_id=target_user_id AND COALESCE(badge_color,'default')=target_badge;
 DELETE FROM public.user_badges WHERE user_id=target_user_id AND badge_key=target_badge;
END; $$;
REVOKE ALL ON FUNCTION public.revoke_user_badge(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_user_badge(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.collect_legacy_verification_badge() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='DELETE' THEN
  DELETE FROM public.user_badges WHERE user_id=OLD.user_id AND badge_key=COALESCE(OLD.badge_color,'default');
  RETURN OLD;
 END IF;
 INSERT INTO public.user_badges(user_id,badge_key,granted_by) VALUES(NEW.user_id,COALESCE(NEW.badge_color,'default'),NEW.granted_by) ON CONFLICT DO NOTHING;
 RETURN NEW;
END; $$;