-- Stel voor alle bestaande apps zonder beveiligingsniveau standaard L0 in.
UPDATE public.apps
SET beveiligingsniveau = 'L0'
WHERE beveiligingsniveau IS NULL;
