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
