-- User stories per app (stap tussen Oppakken en In voorbereiding).
-- Koppeling aan app sluit aan bij Planning-bord; optioneel later feature_id toevoegen.

CREATE TABLE public.user_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  titel TEXT NOT NULL,
  beschrijving TEXT,
  acceptatiecriteria TEXT,
  volgorde INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_stories_app_id ON public.user_stories(app_id);

CREATE TRIGGER update_user_stories_updated_at
  BEFORE UPDATE ON public.user_stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: zelfde patroon als features
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view user_stories"
  ON public.user_stories FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert user_stories"
  ON public.user_stories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update user_stories"
  ON public.user_stories FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete user_stories"
  ON public.user_stories FOR DELETE USING (has_role(auth.uid(), 'admin'));
