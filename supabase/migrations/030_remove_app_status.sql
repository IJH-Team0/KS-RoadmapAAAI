-- Status programma wordt afgeleid uit de planning_status van de feature "Basisfunctionaliteit".
-- Geen eigen kolom meer op apps.

DROP INDEX IF EXISTS idx_apps_status;
ALTER TABLE public.apps DROP COLUMN IF EXISTS status;
