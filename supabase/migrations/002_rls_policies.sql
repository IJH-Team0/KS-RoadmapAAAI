-- RLS voor CSV-based schema: alleen user_profiles en apps

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM public.user_profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_role(user_id UUID, required_role user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id AND role = required_role
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- User profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update profiles"
  ON public.user_profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Apps: ingelogde gebruikers mogen alles; anoniem alleen lezen (optioneel: WITH CHECK true voor insert/update)
CREATE POLICY "Everyone can view apps"
  ON public.apps FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert apps"
  ON public.apps FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update apps"
  ON public.apps FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete apps"
  ON public.apps FOR DELETE
  USING (has_role(auth.uid(), 'admin'));
