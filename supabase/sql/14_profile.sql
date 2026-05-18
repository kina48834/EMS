-- EMS — profile: own name update + account ID documentation

COMMENT ON COLUMN public.users.id IS 'Public EMS account ID (random, assigned at registration). Shown on profile.';
COMMENT ON COLUMN public.users.auth_id IS 'Supabase Auth user UUID (internal link to auth.users).';

-- Allow signed-in users to update their own display name
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

-- Profile RPC with basic fields — see 15_user_profile_fields.sql for full migration
