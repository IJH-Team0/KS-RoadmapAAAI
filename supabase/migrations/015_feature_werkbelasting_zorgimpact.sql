-- Werkbelasting (formule-invoer) en Zorgimpact op feature-niveau voor backlog-beoordeling.
-- urenwinst_per_jaar bestaat al op features (007).

ALTER TABLE public.features
  ADD COLUMN IF NOT EXISTS frequentie_per_week NUMERIC,
  ADD COLUMN IF NOT EXISTS minuten_per_medewerker_per_week NUMERIC,
  ADD COLUMN IF NOT EXISTS aantal_medewerkers INTEGER,
  ADD COLUMN IF NOT EXISTS zorgimpact_type TEXT;

COMMENT ON COLUMN public.features.frequentie_per_week IS 'Werkbelasting: frequentie per week (formule-invoer)';
COMMENT ON COLUMN public.features.minuten_per_medewerker_per_week IS 'Werkbelasting: minuten per medewerker per week (formule-invoer)';
COMMENT ON COLUMN public.features.aantal_medewerkers IS 'Werkbelasting: aantal medewerkers (formule-invoer)';
COMMENT ON COLUMN public.features.zorgimpact_type IS 'Zorgimpact type (bv. Kwaliteit van zorg, Werkdruk vermindering)';
