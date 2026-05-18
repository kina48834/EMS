-- EMS — barangays (reference data)

CREATE TABLE IF NOT EXISTS public.barangays (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT
);

CREATE INDEX IF NOT EXISTS idx_barangays_name ON public.barangays (name);
