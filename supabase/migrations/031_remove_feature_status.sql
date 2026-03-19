-- feature.status wordt afgeleid uit planning_status in de applicatielaag (gepland/in_ontwikkeling/gereed).

-- 1. Trigger: nieuwe app krijgt feature Basisfunctionaliteit met planning_status (geen status meer)
CREATE OR REPLACE FUNCTION create_mvp_feature_for_new_app()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.features (app_id, naam, beschrijving, planning_status)
  VALUES (NEW.id, 'Basisfunctionaliteit', 'Beschrijf hier wat minimaal nodig is voor deze app.', 'wensenlijst');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Verwijder kolom en index
DROP INDEX IF EXISTS idx_features_status;
ALTER TABLE public.features DROP COLUMN IF EXISTS status;
