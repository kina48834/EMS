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
