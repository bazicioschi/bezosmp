-- Promote Bazicioschi to Owner role (and remove any admin/moderator role)
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.profiles
  WHERE LOWER(username) = LOWER('Bazicioschi')
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Remove existing admin/moderator roles (Bazicioschi should only be owner)
    DELETE FROM public.user_roles
    WHERE user_id = v_user_id
      AND role IN ('admin', 'moderator');

    -- Grant owner role if not already present
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'owner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;
