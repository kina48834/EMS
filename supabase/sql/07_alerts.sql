-- EMS — barangay alerts

CREATE TABLE IF NOT EXISTS public.alerts (
  id TEXT PRIMARY KEY,
  barangay_id TEXT NOT NULL REFERENCES public.barangays (id) ON DELETE CASCADE,
  incident_id TEXT REFERENCES public.incidents (id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  channel public.alert_channel NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_barangay_id ON public.alerts (barangay_id);
CREATE INDEX IF NOT EXISTS idx_alerts_incident_id ON public.alerts (incident_id);
