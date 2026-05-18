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
