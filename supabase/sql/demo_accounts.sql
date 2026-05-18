-- EMS — demo accounts & sample data
-- =============================================================================
-- RUN ORDER (Supabase Dashboard → SQL Editor):
--   1. supabase/sql/00_all_in_one.sql   (schema + RLS + functions)
--   2. supabase/sql/15_user_profile_fields.sql  (if not in 00_all_in_one yet)
--   3. This file                         (demo logins + sample rows)
--
-- In Auth → Providers → Email: turn OFF "Confirm email" for local dev.
-- =============================================================================

-- Fix auth rows that already exist but cannot sign in ("Database error querying schema")
UPDATE auth.users SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE lower(email) IN (
  'admin@gmail.com',
  'resident@gmail.com',
  'barangayofficial@gmail.com',
  'emergencyresponder@gmail.com'
);

-- Barangays (required before user profiles)
INSERT INTO public.barangays (id, name, city) VALUES
  ('bgy-001', 'Tobias Fornier Barangay 1', 'Tobias Fornier, Antique'),
  ('bgy-002', 'Tobias Fornier Barangay 2', 'Tobias Fornier, Antique'),
  ('bgy-003', 'Tobias Fornier Barangay 3', 'Tobias Fornier, Antique')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, city = EXCLUDED.city;

-- -----------------------------------------------------------------------------
-- Demo logins (match Login page buttons)
-- -----------------------------------------------------------------------------
-- | Role               | Email                          | Password              |
-- |--------------------|--------------------------------|-----------------------|
-- | System Admin       | admin@gmail.com                | admin123              |
-- | Resident           | resident@gmail.com             | resident123           |
-- | Barangay Official  | barangayofficial@gmail.com     | official123           |
-- | Emergency Responder| emergencyresponder@gmail.com   | emergencyresponder123 |
-- -----------------------------------------------------------------------------

SELECT public.ems_seed_auth_user(
  'admin@gmail.com',
  'admin123',
  'usr-superadmin-001',
  'superAdmin',
  'Juan Dela Cruz Admin'
);

SELECT public.ems_seed_auth_user(
  'resident@gmail.com',
  'resident123',
  'usr-resident-001',
  'resident',
  'Maria Santos',
  'bgy-001'
);

SELECT public.ems_seed_auth_user(
  'barangayofficial@gmail.com',
  'official123',
  'usr-official-001',
  'barangayOfficial',
  'Pedro Reyes',
  'bgy-001'
);

SELECT public.ems_seed_auth_user(
  'emergencyresponder@gmail.com',
  'emergencyresponder123',
  'usr-responder-police-001',
  'emergencyResponders',
  'Ana Garcia',
  'bgy-001',
  'police'::public.responder_kind
);

-- Dummy basic profile info (phone, address, DOB, gender)
UPDATE public.users SET
  phone = '09171234567',
  address = 'Purok 3, Rizal Street, Tobias Fornier Barangay 1',
  date_of_birth = '1992-03-14',
  gender = 'female'
WHERE id = 'usr-resident-001';

UPDATE public.users SET
  phone = '09181234567',
  address = 'Barangay Hall, Tobias Fornier Barangay 1',
  date_of_birth = '1985-07-22',
  gender = 'male'
WHERE id = 'usr-official-001';

UPDATE public.users SET
  phone = '09191234567',
  address = 'Municipal Police Station, Tobias Fornier',
  date_of_birth = '1988-11-05',
  gender = 'female'
WHERE id = 'usr-responder-police-001';

UPDATE public.users SET
  phone = '09201234567',
  address = 'Provincial Capitol Complex, San Jose, Antique',
  date_of_birth = '1980-01-30',
  gender = 'male'
WHERE id = 'usr-superadmin-001';

-- Sample incidents
INSERT INTO public.incidents (
  id, reporter_id, barangay_id, type, title, description,
  photo_data_urls, location_lat, location_lng, location_name, status
) VALUES
  (
    'inc-001',
    'usr-resident-001',
    'bgy-001',
    'crime',
    'Sample Crime Incident',
    'Sample description',
    '[]'::jsonb,
    8.446097,
    124.619164,
    'Masterson Avenue area, Cagayan de Oro',
    'pending'
  ),
  (
    'inc-002',
    'usr-resident-001',
    'bgy-001',
    'accident',
    'Sample Accident Incident',
    'Another sample description',
    '[]'::jsonb,
    8.4465,
    124.6201,
    'Enchanted Kingdom Road, Balulang, Cagayan de Oro',
    'approved'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  location_name = EXCLUDED.location_name,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Sample response
INSERT INTO public.responses (
  id, responder_id, responder_kind, incident_id, status, notes
) VALUES (
  'res-001',
  'usr-responder-police-001',
  'police',
  'inc-002',
  'enRoute',
  'Initial note'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- Sample alert
INSERT INTO public.alerts (id, barangay_id, incident_id, message, channel)
VALUES ('al-001', 'bgy-001', 'inc-001', 'Sample alert message', 'internet')
ON CONFLICT (id) DO UPDATE SET message = EXCLUDED.message;

-- Attendance domain sample
INSERT INTO public.events (id, title, start_at)
VALUES ('evt-001', 'Sample Event', NOW())
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

INSERT INTO public.event_registrations (id, user_id, event_id)
VALUES ('reg-001', 'usr-resident-001', 'evt-001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.attendance (id, event_registration_id, check_in_at, check_out_at)
VALUES ('att-001', 'reg-001', NOW(), NULL)
ON CONFLICT (id) DO NOTHING;
