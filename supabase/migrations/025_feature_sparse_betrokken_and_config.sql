-- Sparse betrokken: per feature of Sparse (leverancier) bij de ontwikkeling betrokken is.
-- Alleen relevant vanaf beveiligingsniveau L2. Boete-punten af te trekken van prioriteitsscore, configureerbaar in Beheer.

ALTER TABLE public.features
  ADD COLUMN IF NOT EXISTS sparse_betrokken BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.features.sparse_betrokken IS 'Of Sparse (leverancier) bij deze feature betrokken is; zichtbaar/ invulbaar vanaf beveiligingsniveau L2. Levert boete-punten op prioriteitsscore.';

-- Config: boete-punten voor Sparse-betrokkenheid (standaard 15)
INSERT INTO public.prioriteitsscore_config (key, value) VALUES
  ('sparse_boete_punten', 15)
ON CONFLICT (key) DO NOTHING;
