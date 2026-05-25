-- Re-grant the admin role to Bazicioschi (in addition to any existing owner role)
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.profiles
  WHERE LOWER(username) = LOWER('Bazicioschi')
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- Set the account email for the "puei oficial" user to pueioficial@outlook.com
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.profiles
  WHERE LOWER(REPLACE(username, ' ', '')) = 'pueioficial'
     OR LOWER(username) = 'puei oficial'
     OR LOWER(username) = 'puei_oficial'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET email = 'pueioficial@outlook.com',
        email_confirmed_at = COALESCE(email_confirmed_at, now())
    WHERE id = v_user_id;
  END IF;
END $$;
