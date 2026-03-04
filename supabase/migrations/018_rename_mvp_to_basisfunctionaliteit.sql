-- Rename feature name MVP to Basisfunctionaliteit everywhere.

-- 1. Update existing features
UPDATE public.features
SET naam = 'Basisfunctionaliteit'
WHERE naam = 'MVP';

-- 2. Trigger: new apps get a feature "Basisfunctionaliteit" (function name unchanged for trigger)
CREATE OR REPLACE FUNCTION create_mvp_feature_for_new_app()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.features (app_id, naam, beschrijving, status)
  VALUES (NEW.id, 'Basisfunctionaliteit', 'Beschrijf hier wat minimaal nodig is voor deze app.', 'gepland');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
