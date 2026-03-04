-- Schema gebaseerd op CSV Applicaties (Status app, Applicatie, Doel app, Eigenaar,
-- Aanspreekpunten, Platform, Documentatie, Sparse, Datum oplevering, Handleiding aanwezig,
-- Prioriteit, Complexiteit, Domein, Impact, Doel). Geen functioneel ontwerp-modules.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Alleen enums die de CSV en auth nodig heeft
CREATE TYPE user_role AS ENUM (
  'gebruiker',
  'admin'
);

CREATE TYPE app_status AS ENUM (
  'wensenlijst',
  'oppakken',
  'in_voorbereiding',
  'in_ontwikkeling',
  'in_testfase',
  'in_productie',
  'afgewezen'
);

-- User profiles voor inloggen (Supabase Auth)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'gebruiker',
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Apps: alleen velden uit de CSV
CREATE TABLE public.apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  naam TEXT NOT NULL,
  status app_status NOT NULL DEFAULT 'wensenlijst',
  doel_app TEXT,
  eigenaar TEXT,
  aanspreekpunt_proces TEXT,
  aanspreekpunt_intern TEXT,
  ontwikkeld_door TEXT,
  datum_oplevering DATE,
  platform TEXT,
  documentatie_url TEXT,
  handleiding_aanwezig BOOLEAN DEFAULT false,
  sparse BOOLEAN DEFAULT false,
  prioriteit TEXT,
  complexiteit TEXT,
  domein TEXT,
  impact TEXT,
  doel TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apps_status ON public.apps(status);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apps_updated_at BEFORE UPDATE ON public.apps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
