-- EMS — store reverse-geocoded place label on incidents (run after 00_all_in_one.sql)
-- Safe to re-run.

ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS location_name TEXT;

COMMENT ON COLUMN public.incidents.location_name IS 'Human-readable place name from map pin (Nominatim reverse geocode).';

UPDATE public.incidents
SET location_name = COALESCE(location_name, title || ' area')
WHERE location_name IS NULL;
