-- Wensenbak: status afgekeurd toevoegen en kolom reactie voor beoordeling door product owner.

ALTER TYPE wensen_bak_status ADD VALUE 'afgekeurd';

ALTER TABLE public.wensen_bak
  ADD COLUMN IF NOT EXISTS reactie TEXT;

COMMENT ON COLUMN public.wensen_bak.reactie IS 'Reactie van product owner aan de indiener (bij afkeuren of opnemen).';

-- Gebruikers mogen eigen ingediende wensen lezen (voor overzicht "Mijn wensen").
CREATE POLICY "Users can view own wensen"
  ON public.wensen_bak FOR SELECT
  USING (auth.uid() IS NOT NULL AND submitted_by = auth.uid());
