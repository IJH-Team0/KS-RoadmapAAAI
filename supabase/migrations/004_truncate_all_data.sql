-- Truncate data; schema blijft. Volgorde: afhankelijkheden eerst (roadmap_items -> features -> apps).

TRUNCATE TABLE public.roadmap_items,
  public.features,
  public.apps,
  public.user_profiles
RESTART IDENTITY
CASCADE;
