-- EMS — helper functions for RLS and app logic

CREATE OR REPLACE FUNCTION public.ems_current_user()
RETURNS public.users
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.*
  FROM public.users u
  WHERE u.auth_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.ems_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role
  FROM public.users u
  WHERE u.auth_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.ems_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.ems_user_barangay_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.barangay_id
  FROM public.users u
  WHERE u.auth_id = auth.uid()
  LIMIT 1;
$$;

-- Creates auth.users + auth.identities + public.users profile (run as postgres in SQL Editor)
-- GoTrue requires token columns to be '' not NULL or signInWithPassword returns "Database error querying schema".
CREATE OR REPLACE FUNCTION public.ems_seed_auth_user(
  p_email TEXT,
  p_password TEXT,
  p_profile_id TEXT,
  p_role public.user_role,
  p_name TEXT,
  p_barangay_id TEXT DEFAULT NULL,
  p_responder_kind public.responder_kind DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email TEXT := lower(trim(p_email));
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;

    UPDATE auth.users SET
      encrypted_password = crypt(p_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, ''),
      raw_app_meta_data = COALESCE(raw_app_meta_data, '{"provider":"email","providers":["email"]}'::jsonb),
      updated_at = NOW()
    WHERE id = v_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(p_password, gen_salt('bf')),
      NOW(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      NOW(),
      NOW()
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user_id AND provider = 'email'
  ) THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email',
      v_user_id::text,
      NOW(),
      NOW(),
      NOW()
    );
  END IF;

  INSERT INTO public.users (id, auth_id, role, name, email, barangay_id, responder_kind)
  VALUES (
    p_profile_id,
    v_user_id,
    p_role,
    p_name,
    v_email,
    CASE WHEN p_role = 'superAdmin' THEN NULL ELSE p_barangay_id END,
    CASE WHEN p_role = 'emergencyResponders' THEN p_responder_kind ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    auth_id = EXCLUDED.auth_id,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    barangay_id = EXCLUDED.barangay_id,
    responder_kind = EXCLUDED.responder_kind;

  RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ems_admin_create_user(
  p_profile_id TEXT,
  p_role public.user_role,
  p_name TEXT,
  p_email TEXT,
  p_password TEXT,
  p_barangay_id TEXT DEFAULT NULL,
  p_responder_kind public.responder_kind DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  IF public.ems_user_role() IS DISTINCT FROM 'superAdmin' THEN
    RAISE EXCEPTION 'Only super admin can create users';
  END IF;

  PERFORM public.ems_seed_auth_user(
    p_email, p_password, p_profile_id, p_role, p_name, p_barangay_id, p_responder_kind
  );

  RETURN (SELECT u FROM public.users u WHERE u.id = p_profile_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.ems_admin_delete_user(p_user_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_auth_id UUID;
BEGIN
  IF public.ems_user_role() IS DISTINCT FROM 'superAdmin' THEN
    RAISE EXCEPTION 'Only super admin can delete users';
  END IF;

  IF p_user_id = public.ems_user_id() THEN
    RAISE EXCEPTION 'System admins cannot delete their own account';
  END IF;

  SELECT auth_id INTO v_auth_id FROM public.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  DELETE FROM public.users WHERE id = p_user_id;
  IF v_auth_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = v_auth_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ems_seed_auth_user TO postgres, service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.ems_admin_create_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.ems_admin_delete_user TO authenticated;
