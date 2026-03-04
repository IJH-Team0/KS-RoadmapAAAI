-- Planning-werkbord op feature-niveau: elke feature heeft een workflow-status (wensenlijst t/m productie).
-- Zo kan een app (MVP) in productie staan terwijl een nieuwe feature van die app nog in Oppakken staat.

ALTER TABLE public.features
  ADD COLUMN IF NOT EXISTS planning_status app_status NOT NULL DEFAULT 'wensenlijst';

CREATE INDEX IF NOT EXISTS idx_features_planning_status ON public.features(planning_status);

COMMENT ON COLUMN public.features.planning_status IS 'Workflow voor planning-werkbord (wensenlijst → oppakken → … → productie). Onafhankelijk van app.status.';

-- Backfill MVP-features: planning_status = status van de app (behalve afgewezen → wensenlijst)
UPDATE public.features f
SET planning_status = CASE
  WHEN a.status = 'afgewezen' THEN 'wensenlijst'::app_status
  ELSE a.status
END
FROM public.apps a
WHERE f.app_id = a.id AND f.naam = 'MVP';

-- Backfill overige features: map feature.status (gepland/in_ontwikkeling/gereed) naar planning_status
UPDATE public.features f
SET planning_status = CASE f.status
  WHEN 'in_ontwikkeling' THEN 'in_ontwikkeling'::app_status
  WHEN 'gereed' THEN 'in_productie'::app_status
  ELSE 'wensenlijst'::app_status
END
WHERE f.naam IS DISTINCT FROM 'MVP';
