ALTER TABLE public.posts ADD COLUMN pinned boolean NOT NULL DEFAULT false;
CREATE OR REPLACE FUNCTION public.guard_post_pin_changes() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.pinned) OR (TG_OP = 'UPDATE' AND NEW.pinned IS DISTINCT FROM OLD.pinned) THEN
    IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM NEW.user_id OR (TG_OP = 'UPDATE' AND auth.uid() IS DISTINCT FROM OLD.user_id) THEN
      RAISE EXCEPTION 'Only the original author can pin or unpin a post' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER guard_post_pin_changes BEFORE INSERT OR UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.guard_post_pin_changes();