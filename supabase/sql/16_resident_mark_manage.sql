-- Residents: edit or delete own map marks (incidents) while pending or rejected.
-- Web + Expo call updateIncident / deleteIncident via shared EMS client (direct table + RLS).
-- Run after 11_rls_policies.sql (or use 00_all_in_one.sql which includes this policy).

-- Tighten resident UPDATE so row cannot be saved as approved/resolved after edit.
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

-- DELETE: resident own marks, pending or rejected (unchanged; documented for Expo/web)
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
