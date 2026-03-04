-- Prioritering/beoordeling op feature-niveau (niet op app)
-- Zo kunnen MVP en extra features naast elkaar op de backlog en elk dezelfde beoordeling krijgen.

ALTER TABLE public.features
  ADD COLUMN IF NOT EXISTS zorgwaarde SMALLINT,
  ADD COLUMN IF NOT EXISTS bouwinspanning TEXT,
  ADD COLUMN IF NOT EXISTS risico BOOLEAN,
  ADD COLUMN IF NOT EXISTS beoordeling_toelichting TEXT,
  ADD COLUMN IF NOT EXISTS urenwinst_per_jaar NUMERIC,
  ADD COLUMN IF NOT EXISTS werkbesparing_score NUMERIC,
  ADD COLUMN IF NOT EXISTS prioriteitsscore NUMERIC;

CREATE INDEX IF NOT EXISTS idx_features_prioriteitsscore ON public.features(prioriteitsscore DESC NULLS LAST);

COMMENT ON COLUMN public.features.zorgwaarde IS '1-5, voor beoordeling';
COMMENT ON COLUMN public.features.bouwinspanning IS 'S, M of L';
COMMENT ON COLUMN public.features.prioriteitsscore IS 'Berekend uit zorgwaarde, urenwinst, bouwinspanning, risico';

-- Backfill: MVP-features krijgen waarden van de app (bestaand gedrag)
UPDATE public.features f
SET
  zorgwaarde = a.zorgwaarde,
  bouwinspanning = a.bouwinspanning,
  risico = a.risico,
  beoordeling_toelichting = a.beoordeling_toelichting,
  urenwinst_per_jaar = a.urenwinst_per_jaar,
  werkbesparing_score = a.werkbesparing_score,
  prioriteitsscore = a.prioriteitsscore
FROM public.apps a
WHERE f.app_id = a.id AND f.naam = 'MVP'
  AND (f.zorgwaarde IS NULL AND f.bouwinspanning IS NULL);
