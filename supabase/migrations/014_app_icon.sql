-- Icoon per app voor startpagina applicaties (key uit vaste lijst, bijv. globe, file-text)
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS icon_key TEXT;
