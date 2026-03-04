-- Kolom Oppakken verdwijnt van het Planning-bord: bestaande oppakken-data naar stories_maken.
-- features.planning_status bestaat alleen als migratie 008 is uitgevoerd.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'features' AND column_name = 'planning_status'
  ) THEN
    UPDATE public.features
    SET planning_status = 'stories_maken'
    WHERE planning_status = 'oppakken';
  END IF;
END $$;

UPDATE public.apps
SET status = 'stories_maken'
WHERE status = 'oppakken';
