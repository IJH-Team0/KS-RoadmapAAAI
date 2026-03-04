-- URL naar de app in test en in productie (voor startpagina applicaties)
ALTER TABLE public.apps
  ADD COLUMN IF NOT EXISTS url_test TEXT,
  ADD COLUMN IF NOT EXISTS url_productie TEXT;
