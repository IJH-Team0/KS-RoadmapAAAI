-- Drop alle tabellen en types (CSV-based schema).
-- Daarna opnieuw opbouwen met: migrations 001, 002, 003, 004.

DROP TABLE IF EXISTS public.apps, public.user_profiles CASCADE;

DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.get_user_role(UUID);
DROP FUNCTION IF EXISTS public.has_role(UUID, public.user_role);

DROP TYPE IF EXISTS public.app_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
