-- Features en roadmap_items (plan: apps uitbreiden met features op roadmap)
-- Inclusief standaard MVP-feature per app (trigger + backfill bestaande apps)

-- Enum voor feature- en roadmap-itemstatus (zelfde waarden)
CREATE TYPE feature_status AS ENUM (
  'gepland',
  'in_ontwikkeling',
  'gereed'
);

-- Tabel features (per app)
CREATE TABLE public.features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  beschrijving TEXT,
  prioriteit INTEGER,
  status feature_status NOT NULL DEFAULT 'gepland',
  ready_for_stories BOOLEAN NOT NULL DEFAULT false,
  story_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_features_app_id ON public.features(app_id);
CREATE INDEX idx_features_status ON public.features(status);

CREATE TRIGGER update_features_updated_at
  BEFORE UPDATE ON public.features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabel roadmap_items (app_id verplicht, feature_id optioneel)
CREATE TABLE public.roadmap_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES public.features(id) ON DELETE SET NULL,
  titel TEXT NOT NULL,
  beschrijving TEXT,
  geplande_start DATE,
  geplande_eind DATE,
  status feature_status NOT NULL DEFAULT 'gepland',
  volgorde INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: feature_id moet bij dezelfde app horen als app_id (CHECK mag geen subquery)
CREATE OR REPLACE FUNCTION check_roadmap_item_feature_belongs_to_app()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.feature_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.features f
    WHERE f.id = NEW.feature_id AND f.app_id = NEW.app_id
  ) THEN
    RAISE EXCEPTION 'roadmap_items_feature_belongs_to_app: feature_id moet bij dezelfde app horen als app_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER roadmap_items_feature_belongs_to_app
  BEFORE INSERT OR UPDATE OF app_id, feature_id ON public.roadmap_items
  FOR EACH ROW EXECUTE FUNCTION check_roadmap_item_feature_belongs_to_app();

CREATE INDEX idx_roadmap_items_app_id ON public.roadmap_items(app_id);
CREATE INDEX idx_roadmap_items_feature_id ON public.roadmap_items(feature_id);
CREATE INDEX idx_roadmap_items_status ON public.roadmap_items(status);

CREATE TRIGGER update_roadmap_items_updated_at
  BEFORE UPDATE ON public.roadmap_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: bij nieuwe app automatisch een feature "MVP" aanmaken
CREATE OR REPLACE FUNCTION create_mvp_feature_for_new_app()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.features (app_id, naam, beschrijving, status)
  VALUES (NEW.id, 'MVP', 'Beschrijf hier wat minimaal nodig is voor deze app.', 'gepland');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_app_insert_create_mvp
  AFTER INSERT ON public.apps
  FOR EACH ROW EXECUTE FUNCTION create_mvp_feature_for_new_app();

-- Backfill: voor alle bestaande apps zonder feature een MVP-feature aanmaken
INSERT INTO public.features (app_id, naam, beschrijving, status)
SELECT a.id, 'MVP', 'Beschrijf hier wat minimaal nodig is voor deze app.', 'gepland'
FROM public.apps a
WHERE NOT EXISTS (SELECT 1 FROM public.features f WHERE f.app_id = a.id);

-- RLS: iedereen lezen; mutaties door ingelogde gebruikers; delete alleen admin
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view features"
  ON public.features FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert features"
  ON public.features FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update features"
  ON public.features FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete features"
  ON public.features FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view roadmap_items"
  ON public.roadmap_items FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert roadmap_items"
  ON public.roadmap_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update roadmap_items"
  ON public.roadmap_items FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete roadmap_items"
  ON public.roadmap_items FOR DELETE USING (has_role(auth.uid(), 'admin'));
