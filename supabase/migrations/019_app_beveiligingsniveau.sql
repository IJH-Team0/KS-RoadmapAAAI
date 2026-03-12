-- Beveiligingsniveau L0–L3 voor applicaties (classificatie voor ontwikkeling/governance).
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS beveiligingsniveau TEXT
  CHECK (beveiligingsniveau IS NULL OR beveiligingsniveau IN ('L0', 'L1', 'L2', 'L3'));

COMMENT ON COLUMN public.apps.beveiligingsniveau IS 'L0 Experimenteel, L1 Intern, L2 Medewerkersdata, L3 Cliëntdata';
