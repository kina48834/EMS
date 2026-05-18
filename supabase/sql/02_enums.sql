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
