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
