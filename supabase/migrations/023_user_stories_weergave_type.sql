-- Keuze per user story: uitgebreide user story of taaklijst (eenvoudige opsomming van taken).

ALTER TABLE public.user_stories
  ADD COLUMN IF NOT EXISTS weergave_type TEXT NOT NULL DEFAULT 'user_story'
  CHECK (weergave_type IN ('user_story', 'taaklijst'));
