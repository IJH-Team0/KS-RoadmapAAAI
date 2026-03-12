-- Wensenbak: ingediende wensen door gebruikers; product owners kunnen deze op de wensenlijst zetten.

CREATE TYPE wensen_bak_status AS ENUM ('ingediend', 'opgenomen');

CREATE TABLE public.wensen_bak (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status wensen_bak_status NOT NULL DEFAULT 'ingediend',
  naam TEXT NOT NULL,
  probleemomschrijving TEXT,
  domein TEXT,
  proces TEXT,
  frequentie_per_week INTEGER,
  minuten_per_medewerker_per_week INTEGER,
  aantal_medewerkers INTEGER,
  zorgimpact_type TEXT,
  clientgegevens BOOLEAN NOT NULL DEFAULT false,
  medewerkersgegevens BOOLEAN NOT NULL DEFAULT false,
  intern_team BOOLEAN NOT NULL DEFAULT false,
  app_id UUID REFERENCES public.apps(id) ON DELETE SET NULL
);

CREATE TRIGGER update_wensen_bak_updated_at BEFORE UPDATE ON public.wensen_bak
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.wensen_bak ENABLE ROW LEVEL SECURITY;

-- Gebruikers mogen alleen eigen rijen aanmaken (submitted_by = eigen uid).
CREATE POLICY "Users can insert own wens"
  ON public.wensen_bak FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = submitted_by);

-- Alleen admins mogen de bak bekijken en beheren.
CREATE POLICY "Admins can view wensen_bak"
  ON public.wensen_bak FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update wensen_bak"
  ON public.wensen_bak FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete wensen_bak"
  ON public.wensen_bak FOR DELETE
  USING (has_role(auth.uid(), 'admin'));
