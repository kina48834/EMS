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
