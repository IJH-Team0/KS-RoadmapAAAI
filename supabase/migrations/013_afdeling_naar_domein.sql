-- Afdeling vervangen door domein (3 vaste opties: Bedrijfsvoering en Vastgoed, Wonen en Leven, Thuis en Herstel)
-- Kolom domein bestaat al (001); we nemen afdeling-data over en verwijderen afdeling.

UPDATE public.apps SET domein = afdeling WHERE afdeling IS NOT NULL;

ALTER TABLE public.apps DROP COLUMN afdeling;

DROP INDEX IF EXISTS idx_apps_afdeling;
CREATE INDEX IF NOT EXISTS idx_apps_domein ON public.apps(domein);

COMMENT ON COLUMN public.apps.domein IS 'Domein: Bedrijfsvoering en Vastgoed | Wonen en Leven | Thuis en Herstel';
