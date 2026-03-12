-- Verwijder velden Prioriteit, Impact en Doel uit apps en features, en uit reference_options.

ALTER TABLE public.apps
  DROP COLUMN IF EXISTS prioriteit,
  DROP COLUMN IF EXISTS impact,
  DROP COLUMN IF EXISTS doel;

ALTER TABLE public.features
  DROP COLUMN IF EXISTS prioriteit;

DELETE FROM public.reference_options
WHERE category IN ('prioriteit', 'impact', 'doel');
