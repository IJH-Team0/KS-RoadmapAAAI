-- Prioriteitsscore-formule configureerbaar: key-value config + reference_options voor zorgimpact bonus.
-- reference_options: keuzelijsten (hier alleen zorgimpact_type) met optionele prioriteit_bonus.

CREATE TABLE IF NOT EXISTS public.prioriteitsscore_config (
  key TEXT PRIMARY KEY,
  value NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reference_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  prioriteit_bonus INTEGER NOT NULL DEFAULT 0,
  UNIQUE (category, value)
);

CREATE INDEX IF NOT EXISTS idx_reference_options_category ON public.reference_options (category);

-- Seed formule-constanten
INSERT INTO public.prioriteitsscore_config (key, value) VALUES
  ('risk_penalty', 15),
  ('bouwinspanning_s', 30),
  ('bouwinspanning_m', 20),
  ('bouwinspanning_l', 10)
ON CONFLICT (key) DO NOTHING;

-- Seed zorgimpact_type (zelfde volgorde/labels als ZORGIMPACT_TYPE_OPTIONS; bonus 10 voor Compliance en Cliëntveiligheid)
INSERT INTO public.reference_options (category, value, label, sort_order, prioriteit_bonus) VALUES
  ('zorgimpact_type', 'Kwaliteit van zorg', 'Kwaliteit van zorg', 0, 0),
  ('zorgimpact_type', 'Werkdruk vermindering', 'Werkdruk vermindering', 1, 0),
  ('zorgimpact_type', 'Compliance / wetgeving', 'Compliance / wetgeving', 2, 10),
  ('zorgimpact_type', 'Cliëntveiligheid', 'Cliëntveiligheid', 3, 10),
  ('zorgimpact_type', 'Cliënttevredenheid', 'Cliënttevredenheid', 4, 0),
  ('zorgimpact_type', 'Medewerkerstevredenheid', 'Medewerkerstevredenheid', 5, 0),
  ('zorgimpact_type', 'Efficiency', 'Efficiency', 6, 0),
  ('zorgimpact_type', 'Overig', 'Overig', 7, 0)
ON CONFLICT (category, value) DO NOTHING;

-- RLS
ALTER TABLE public.prioriteitsscore_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_options ENABLE ROW LEVEL SECURITY;

-- Iedereen ingelogd mag config en opties lezen
DROP POLICY IF EXISTS "Authenticated can read prioriteitsscore_config" ON public.prioriteitsscore_config;
CREATE POLICY "Authenticated can read prioriteitsscore_config"
  ON public.prioriteitsscore_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can read reference_options" ON public.reference_options;
CREATE POLICY "Authenticated can read reference_options"
  ON public.reference_options FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Alleen admins mogen wijzigen
DROP POLICY IF EXISTS "Admins can update prioriteitsscore_config" ON public.prioriteitsscore_config;
CREATE POLICY "Admins can update prioriteitsscore_config"
  ON public.prioriteitsscore_config FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert prioriteitsscore_config" ON public.prioriteitsscore_config;
CREATE POLICY "Admins can insert prioriteitsscore_config"
  ON public.prioriteitsscore_config FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update reference_options" ON public.reference_options;
CREATE POLICY "Admins can update reference_options"
  ON public.reference_options FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert reference_options" ON public.reference_options;
CREATE POLICY "Admins can insert reference_options"
  ON public.reference_options FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete reference_options" ON public.reference_options;
CREATE POLICY "Admins can delete reference_options"
  ON public.reference_options FOR DELETE
  USING (has_role(auth.uid(), 'admin'));
