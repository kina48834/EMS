-- EMS — basic profile fields on users (registration + profile)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_gender_chk;
ALTER TABLE public.users ADD CONSTRAINT users_gender_chk CHECK (
  gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say')
);

COMMENT ON COLUMN public.users.phone IS 'Mobile or landline (PH format, e.g. 09xx).';
COMMENT ON COLUMN public.users.address IS 'Home / street address.';
COMMENT ON COLUMN public.users.date_of_birth IS 'Date of birth.';
COMMENT ON COLUMN public.users.gender IS 'male | female | other | prefer_not_to_say';

-- Expanded profile update (name + basic fields)
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

  RETURN (SELECT u FROM public.users u WHERE id = v_uid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ems_update_own_profile(TEXT, TEXT, TEXT, DATE, TEXT) TO authenticated;

-- Drop old single-argument overload if present
DROP FUNCTION IF EXISTS public.ems_update_own_profile(TEXT);
