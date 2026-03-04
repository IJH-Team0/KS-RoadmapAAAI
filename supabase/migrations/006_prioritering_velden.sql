-- Prioritering: intake- en beoordelingsvelden + berekende velden
-- Urenwinst en scores worden in app berekend en opgeslagen voor sortering/rapportage.

ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS probleemomschrijving TEXT,
  ADD COLUMN IF NOT EXISTS afdeling TEXT,
  ADD COLUMN IF NOT EXISTS proces TEXT,
  ADD COLUMN IF NOT EXISTS frequentie_per_week NUMERIC,
  ADD COLUMN IF NOT EXISTS minuten_per_medewerker_per_week NUMERIC,
  ADD COLUMN IF NOT EXISTS aantal_medewerkers INTEGER,
  ADD COLUMN IF NOT EXISTS zorgimpact_type TEXT,
  ADD COLUMN IF NOT EXISTS zorgwaarde SMALLINT,
  ADD COLUMN IF NOT EXISTS bouwinspanning TEXT,
  ADD COLUMN IF NOT EXISTS risico BOOLEAN,
  ADD COLUMN IF NOT EXISTS beoordeling_toelichting TEXT,
  ADD COLUMN IF NOT EXISTS referentie_nummer TEXT,
  ADD COLUMN IF NOT EXISTS concept BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS urenwinst_per_jaar NUMERIC,
  ADD COLUMN IF NOT EXISTS werkbesparing_score NUMERIC,
  ADD COLUMN IF NOT EXISTS prioriteitsscore NUMERIC;

CREATE INDEX IF NOT EXISTS idx_apps_prioriteitsscore ON public.apps(prioriteitsscore DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_apps_afdeling ON public.apps(afdeling);
CREATE UNIQUE INDEX IF NOT EXISTS idx_apps_referentie_nummer ON public.apps(referentie_nummer) WHERE referentie_nummer IS NOT NULL;

COMMENT ON COLUMN public.apps.bouwinspanning IS 'S, M of L';
COMMENT ON COLUMN public.apps.zorgwaarde IS '1-5';
COMMENT ON COLUMN public.apps.concept IS 'true = concept, false = ingediend (status wensenlijst)';
