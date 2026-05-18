-- EMS Supabase — ALL-IN-ONE (schema + RLS, no demo data)
-- Run in Supabase SQL Editor. For demo logins, run demo_accounts.sql after this.

-- ========== 01_extensions.sql ==========
-- EMS on Supabase — extensions
-- Run in Supabase SQL Editor (or as part of 00_all_in_one.sql)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========== 02_enums.sql ==========
-- EMS — PostgreSQL enum types (replaces MySQL ENUM columns)

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'resident',
    'barangayOfficial',
    'emergencyResponders',
    'superAdmin'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.responder_kind AS ENUM ('police', 'fire', 'ems');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.incident_type AS ENUM ('crime', 'fire', 'accident', 'disaster');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.incident_status AS ENUM ('pending', 'approved', 'rejected', 'resolved');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.response_status AS ENUM ('enRoute', 'onSite', 'resolved');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_channel AS ENUM ('internet', 'sms');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ========== 03_barangays.sql ==========
-- EMS — barangays (reference data)

CREATE TABLE IF NOT EXISTS public.barangays (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT
);

CREATE INDEX IF NOT EXISTS idx_barangays_name ON public.barangays (name);

-- ========== 04_users.sql ==========
-- EMS — user profiles (linked to Supabase Auth via auth_id)

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  auth_id UUID UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  barangay_id TEXT REFERENCES public.barangays (id) ON DELETE SET NULL,
  responder_kind public.responder_kind,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_gender_chk CHECK (
    gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say')
  ),
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_responder_kind_chk CHECK (
    (role = 'emergencyResponders' AND responder_kind IS NOT NULL)
    OR (role <> 'emergencyResponders' AND responder_kind IS NULL)
  ),
  CONSTRAINT users_super_admin_barangay_chk CHECK (
    (role = 'superAdmin' AND barangay_id IS NULL)
    OR (role <> 'superAdmin')
  )
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_barangay_id ON public.users (barangay_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users (auth_id);

-- ========== 05_incidents.sql ==========
-- EMS — incidents (resident reports / barangay workflow)

CREATE TABLE IF NOT EXISTS public.incidents (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  barangay_id TEXT NOT NULL REFERENCES public.barangays (id) ON DELETE CASCADE,
  type public.incident_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  photo_data_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  location_lat NUMERIC(10, 7) NOT NULL,
  location_lng NUMERIC(10, 7) NOT NULL,
  location_name TEXT,
  status public.incident_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_barangay_id ON public.incidents (barangay_id);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter_id ON public.incidents (reporter_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents (created_at DESC);

CREATE OR REPLACE FUNCTION public.set_incidents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_incidents_updated_at ON public.incidents;
CREATE TRIGGER trg_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_incidents_updated_at();

-- ========== 06_responses.sql ==========
-- EMS — emergency responder responses

CREATE TABLE IF NOT EXISTS public.responses (
  id TEXT PRIMARY KEY,
  responder_id TEXT NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  responder_kind public.responder_kind NOT NULL,
  incident_id TEXT NOT NULL REFERENCES public.incidents (id) ON DELETE CASCADE,
  status public.response_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT responses_responder_incident_unique UNIQUE (responder_id, incident_id)
);

CREATE INDEX IF NOT EXISTS idx_responses_incident_id ON public.responses (incident_id);

CREATE OR REPLACE FUNCTION public.set_responses_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_responses_updated_at ON public.responses;
CREATE TRIGGER trg_responses_updated_at
  BEFORE UPDATE ON public.responses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_responses_updated_at();

-- ========== 07_alerts.sql ==========
-- EMS — barangay alerts

CREATE TABLE IF NOT EXISTS public.alerts (
  id TEXT PRIMARY KEY,
  barangay_id TEXT NOT NULL REFERENCES public.barangays (id) ON DELETE CASCADE,
  incident_id TEXT REFERENCES public.incidents (id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  channel public.alert_channel NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_barangay_id ON public.alerts (barangay_id);
CREATE INDEX IF NOT EXISTS idx_alerts_incident_id ON public.alerts (incident_id);

-- ========== 08_events_attendance.sql ==========
-- EMS — events / registrations / attendance (optional domain; not used by main UI yet)

CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT event_registrations_user_event_unique UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations (event_id);

CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY,
  event_registration_id TEXT NOT NULL REFERENCES public.event_registrations (id) ON DELETE CASCADE,
  check_in_at TIMESTAMPTZ NOT NULL,
  check_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT attendance_registration_unique UNIQUE (event_registration_id)
);

-- ========== 09_functions.sql ==========
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

-- ========== 10_rls_enable.sql ==========
-- EMS — enable Row Level Security on all public tables

ALTER TABLE public.barangays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ========== 11_rls_policies.sql ==========
-- EMS — Row Level Security policies

-- barangays: public read (registration + maps)
DROP POLICY IF EXISTS barangays_select_all ON public.barangays;
CREATE POLICY barangays_select_all ON public.barangays
  FOR SELECT
  USING (true);

-- users
DROP POLICY IF EXISTS users_select_authenticated ON public.users;
CREATE POLICY users_select_authenticated ON public.users
  FOR SELECT
  TO authenticated
  USING (
    public.ems_user_role() = 'superAdmin'
    OR id = public.ems_user_id()
    OR (
      public.ems_user_role() IN ('barangayOfficial', 'emergencyResponders')
      AND barangay_id IS NOT NULL
      AND barangay_id = public.ems_user_barangay_id()
      AND role IN ('resident', 'barangayOfficial', 'emergencyResponders')
    )
  );

DROP POLICY IF EXISTS users_insert_self ON public.users;
CREATE POLICY users_insert_self ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth_id = auth.uid()
    AND role = 'resident'
  );

DROP POLICY IF EXISTS users_insert_super_admin ON public.users;
CREATE POLICY users_insert_super_admin ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (public.ems_user_role() = 'superAdmin');

DROP POLICY IF EXISTS users_update_super_admin ON public.users;
CREATE POLICY users_update_super_admin ON public.users
  FOR UPDATE
  TO authenticated
  USING (public.ems_user_role() = 'superAdmin')
  WITH CHECK (public.ems_user_role() = 'superAdmin');

DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = public.ems_user_id())
  WITH CHECK (
    id = public.ems_user_id()
    AND role = (SELECT u.role FROM public.users u WHERE u.id = public.ems_user_id())
    AND email = (SELECT u.email FROM public.users u WHERE u.id = public.ems_user_id())
    AND barangay_id IS NOT DISTINCT FROM (SELECT u.barangay_id FROM public.users u WHERE u.id = public.ems_user_id())
    AND responder_kind IS NOT DISTINCT FROM (SELECT u.responder_kind FROM public.users u WHERE u.id = public.ems_user_id())
  );

DROP POLICY IF EXISTS users_delete_super_admin ON public.users;
CREATE POLICY users_delete_super_admin ON public.users
  FOR DELETE
  TO authenticated
  USING (
    public.ems_user_role() = 'superAdmin'
    AND id <> public.ems_user_id()
  );

-- incidents
DROP POLICY IF EXISTS incidents_select ON public.incidents;
CREATE POLICY incidents_select ON public.incidents
  FOR SELECT
  TO authenticated
  USING (
    public.ems_user_role() = 'superAdmin'
    OR reporter_id = public.ems_user_id()
    OR (
      barangay_id = public.ems_user_barangay_id()
      AND public.ems_user_role() IN ('barangayOfficial', 'emergencyResponders')
    )
  );

DROP POLICY IF EXISTS incidents_insert_resident ON public.incidents;
CREATE POLICY incidents_insert_resident ON public.incidents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.ems_user_role() = 'resident'
    AND reporter_id = public.ems_user_id()
    AND barangay_id = public.ems_user_barangay_id()
    AND status = 'pending'
  );

DROP POLICY IF EXISTS incidents_update ON public.incidents;
CREATE POLICY incidents_update ON public.incidents
  FOR UPDATE
  TO authenticated
  USING (
    public.ems_user_role() = 'superAdmin'
    OR (
      public.ems_user_role() = 'resident'
      AND reporter_id = public.ems_user_id()
      AND status IN ('pending', 'rejected')
    )
    OR (
      public.ems_user_role() = 'barangayOfficial'
      AND barangay_id = public.ems_user_barangay_id()
    )
    OR (
      public.ems_user_role() = 'emergencyResponders'
      AND barangay_id = public.ems_user_barangay_id()
    )
  )
  WITH CHECK (
    public.ems_user_role() = 'superAdmin'
    OR (
      public.ems_user_role() = 'resident'
      AND reporter_id = public.ems_user_id()
      AND status IN ('pending', 'rejected')
    )
    OR (
      public.ems_user_role() = 'barangayOfficial'
      AND barangay_id = public.ems_user_barangay_id()
    )
    OR (
      public.ems_user_role() = 'emergencyResponders'
      AND barangay_id = public.ems_user_barangay_id()
    )
  );

DROP POLICY IF EXISTS incidents_delete ON public.incidents;
CREATE POLICY incidents_delete ON public.incidents
  FOR DELETE
  TO authenticated
  USING (
    public.ems_user_role() = 'superAdmin'
    OR (
      public.ems_user_role() = 'resident'
      AND reporter_id = public.ems_user_id()
      AND status IN ('pending', 'rejected')
    )
  );

-- responses
DROP POLICY IF EXISTS responses_select ON public.responses;
CREATE POLICY responses_select ON public.responses
  FOR SELECT
  TO authenticated
  USING (
    public.ems_user_role() = 'superAdmin'
    OR EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_id
        AND (
          i.reporter_id = public.ems_user_id()
          OR i.barangay_id = public.ems_user_barangay_id()
        )
    )
  );

DROP POLICY IF EXISTS responses_insert ON public.responses;
CREATE POLICY responses_insert ON public.responses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.ems_user_role() = 'emergencyResponders'
    AND responder_id = public.ems_user_id()
  );

DROP POLICY IF EXISTS responses_update ON public.responses;
CREATE POLICY responses_update ON public.responses
  FOR UPDATE
  TO authenticated
  USING (
    public.ems_user_role() = 'emergencyResponders'
    AND responder_id = public.ems_user_id()
  )
  WITH CHECK (
    public.ems_user_role() = 'emergencyResponders'
    AND responder_id = public.ems_user_id()
  );

-- alerts
DROP POLICY IF EXISTS alerts_select ON public.alerts;
CREATE POLICY alerts_select ON public.alerts
  FOR SELECT
  TO authenticated
  USING (
    public.ems_user_role() = 'superAdmin'
    OR barangay_id = public.ems_user_barangay_id()
    OR EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_id AND i.reporter_id = public.ems_user_id()
    )
  );

DROP POLICY IF EXISTS alerts_insert ON public.alerts;
CREATE POLICY alerts_insert ON public.alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.ems_user_role() = 'superAdmin'
    OR (
      public.ems_user_role() = 'barangayOfficial'
      AND barangay_id = public.ems_user_barangay_id()
    )
  );

-- events / attendance (super admin + authenticated read for now)
DROP POLICY IF EXISTS events_select ON public.events;
CREATE POLICY events_select ON public.events
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS event_registrations_select ON public.event_registrations;
CREATE POLICY event_registrations_select ON public.event_registrations
  FOR SELECT
  TO authenticated
  USING (
    public.ems_user_role() = 'superAdmin'
    OR user_id = public.ems_user_id()
  );

DROP POLICY IF EXISTS attendance_select ON public.attendance;
CREATE POLICY attendance_select ON public.attendance
  FOR SELECT
  TO authenticated
  USING (true);

-- ========== 14_profile.sql ==========
COMMENT ON COLUMN public.users.id IS 'Public EMS account ID (random, assigned at registration). Shown on profile.';
COMMENT ON COLUMN public.users.auth_id IS 'Supabase Auth user UUID (internal link to auth.users).';

DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = public.ems_user_id())
  WITH CHECK (
    id = public.ems_user_id()
    AND role = (SELECT u.role FROM public.users u WHERE u.id = public.ems_user_id())
    AND email = (SELECT u.email FROM public.users u WHERE u.id = public.ems_user_id())
    AND barangay_id IS NOT DISTINCT FROM (SELECT u.barangay_id FROM public.users u WHERE u.id = public.ems_user_id())
    AND responder_kind IS NOT DISTINCT FROM (SELECT u.responder_kind FROM public.users u WHERE u.id = public.ems_user_id())
  );

CREATE OR REPLACE FUNCTION public.ems_update_own_profile(
  p_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_gender TEXT DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid TEXT;
  v_name TEXT;
BEGIN
  v_uid := public.ems_user_id();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  v_name := trim(p_name);
  IF length(v_name) < 2 THEN
    RAISE EXCEPTION 'Name must be at least 2 characters';
  END IF;
  IF p_gender IS NOT NULL AND p_gender NOT IN ('male', 'female', 'other', 'prefer_not_to_say') THEN
    RAISE EXCEPTION 'Invalid gender value';
  END IF;
  UPDATE public.users SET
    name = v_name,
    phone = NULLIF(trim(p_phone), ''),
    address = NULLIF(trim(p_address), ''),
    date_of_birth = p_date_of_birth,
    gender = p_gender
  WHERE id = v_uid;
  RETURN (SELECT u FROM public.users u WHERE u.id = v_uid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ems_update_own_profile(TEXT, TEXT, TEXT, DATE, TEXT) TO authenticated;

