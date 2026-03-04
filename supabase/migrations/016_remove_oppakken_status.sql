-- Status oppakken volledig weghalen: bestaande data naar stories_maken (vervangen door user stories maken / sprintbaar).
-- Na deze migratie wordt oppakken niet meer gebruikt in de applicatie.

UPDATE public.features
SET planning_status = 'stories_maken'
WHERE planning_status = 'oppakken';

UPDATE public.apps
SET status = 'stories_maken'
WHERE status = 'oppakken';
