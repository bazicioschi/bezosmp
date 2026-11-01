CREATE TABLE public.user_badges (
  user_id uuid NOT NULL,
  badge_key text NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_key),
  CONSTRAINT valid_collectible_badge CHECK (badge_key IN ('party','winter','default','red','blue','green','gold','purple','pink','cyan','orange','lime','teal','indigo','rose','amber','emerald','sky','fuchsia','violet','slate','white','black','magenta','crimson','mint','coral','lavender','neon','bronze','rainbow','ladybug','rat'))
);
GRANT SELECT ON public.user_badges TO anon, authenticated;
GRANT INSERT ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badge collections are public" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Bazicioschi can award collectible badges" ON public.user_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = '1c2fd2f9-d5d2-4a3b-bd6a-b735200b7200'::uuid AND public.has_role(auth.uid(), 'owner') AND granted_by = auth.uid());

CREATE TABLE public.user_badge_selections (
  user_id uuid PRIMARY KEY,
  badge_key text NOT NULL,
  FOREIGN KEY (user_id, badge_key) REFERENCES public.user_badges(user_id, badge_key) ON DELETE CASCADE
);
GRANT SELECT ON public.user_badge_selections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_badge_selections TO authenticated;
GRANT ALL ON public.user_badge_selections TO service_role;
ALTER TABLE public.user_badge_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active badges are public" ON public.user_badge_selections FOR SELECT USING (true);
CREATE POLICY "Users choose only their own badges" ON public.user_badge_selections FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update only their own badge choice" ON public.user_badge_selections FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users reset only their own badge choice" ON public.user_badge_selections FOR DELETE TO authenticated USING (user_id = auth.uid());

INSERT INTO public.user_badges (user_id, badge_key) SELECT id, 'party' FROM auth.users ON CONFLICT DO NOTHING;
INSERT INTO public.user_badges (user_id, badge_key, granted_by) SELECT user_id, COALESCE(badge_color, 'default'), granted_by FROM public.user_verifications ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.award_anniversary_badge_on_signup() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_badges (user_id, badge_key) VALUES (NEW.id, 'party') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.award_anniversary_badge_on_signup() FROM PUBLIC;
CREATE TRIGGER award_anniversary_badge AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.award_anniversary_badge_on_signup();

CREATE OR REPLACE FUNCTION public.collect_legacy_verification_badge() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.user_badges WHERE user_id = OLD.user_id AND badge_key NOT IN ('party', 'winter');
    RETURN OLD;
  END IF;
  INSERT INTO public.user_badges (user_id, badge_key, granted_by) VALUES (NEW.user_id, COALESCE(NEW.badge_color, 'default'), NEW.granted_by) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.collect_legacy_verification_badge() FROM PUBLIC;
CREATE TRIGGER collect_legacy_verification AFTER INSERT OR UPDATE OR DELETE ON public.user_verifications FOR EACH ROW EXECUTE FUNCTION public.collect_legacy_verification_badge();