-- Merge stories_maken into oppakken: bestaande data naar oppakken.
-- Enumwaarde stories_maken blijft bestaan (verwijderen lastig in PostgreSQL).
-- features.planning_status bestaat alleen als migratie 008 is uitgevoerd.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'features' AND column_name = 'planning_status'
  ) THEN
    UPDATE public.features
    SET planning_status = 'oppakken'
    WHERE planning_status = 'stories_maken';
  END IF;
END $$;

UPDATE public.apps
SET status = 'oppakken'
WHERE status = 'stories_maken';
