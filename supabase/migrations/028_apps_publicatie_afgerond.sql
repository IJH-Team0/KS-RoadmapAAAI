-- Apps in Test of Productie zijn pas zichtbaar voor gebruikers als publicatie is afgerond.
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS publicatie_afgerond BOOLEAN NOT NULL DEFAULT false;
