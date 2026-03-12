-- Seed reference_options voor alle overige categorieën (zorgimpact_type al in 021).
-- ON CONFLICT DO NOTHING zodat migratie herbruikbaar is.

INSERT INTO public.reference_options (category, value, label, sort_order, prioriteit_bonus)
VALUES
  -- app_status (enum-waarden; alleen label/sort_order bewerkbaar in Beheer)
  ('app_status', 'wensenlijst', '0. Wensenlijst', 0, 0),
  ('app_status', 'stories_maken', '1. User stories maken', 1, 0),
  ('app_status', 'in_voorbereiding', '2. Sprintbaar', 2, 0),
  ('app_status', 'in_ontwikkeling', '3. In ontwikkeling', 3, 0),
  ('app_status', 'in_testfase', '4. Test', 4, 0),
  ('app_status', 'in_productie', '5. Productie', 5, 0),
  ('app_status', 'afgewezen', '7. Afgewezen', 7, 0),
  -- domein
  ('domein', 'Bedrijfsvoering en Vastgoed', 'Bedrijfsvoering en Vastgoed', 0, 0),
  ('domein', 'Wonen en Leven', 'Wonen en Leven', 1, 0),
  ('domein', 'Thuis en Herstel', 'Thuis en Herstel', 2, 0),
  -- platform
  ('platform', 'Powerplatform', 'Powerplatform', 0, 0),
  ('platform', 'Webapp - Azure', 'Webapp - Azure', 1, 0),
  ('platform', 'Webapp - Bolt', 'Webapp - Bolt', 2, 0),
  ('platform', 'Agent', 'Agent', 3, 0),
  ('platform', 'Overig', 'Overig', 4, 0),
  ('platform', 'Webapp - Bolt/Cursor/Netlify', 'Webapp - Bolt/Cursor/Netlify', 5, 0),
  -- prioriteit
  ('prioriteit', 'Prio 1', 'Prio 1', 0, 0),
  ('prioriteit', 'Prio 2', 'Prio 2', 1, 0),
  ('prioriteit', 'Prio 3', 'Prio 3', 2, 0),
  -- complexiteit
  ('complexiteit', 'Complex', 'Complex', 0, 0),
  ('complexiteit', 'Gemiddeld', 'Gemiddeld', 1, 0),
  ('complexiteit', 'Eenvoudig', 'Eenvoudig', 2, 0),
  -- impact
  ('impact', '1. Organisatie', '1. Organisatie', 0, 0),
  ('impact', '2. Domein', '2. Domein', 1, 0),
  ('impact', '3. Locatie', '3. Locatie', 2, 0),
  ('impact', '4. Afdeling/Team/Cirkel', '4. Afdeling/Team/Cirkel', 3, 0),
  ('impact', '5. Persoon', '5. Persoon', 4, 0),
  -- doel
  ('doel', '1. Wetgeving', '1. Wetgeving', 0, 0),
  ('doel', '2. Technologie', '2. Technologie', 1, 0),
  ('doel', '3. Bedrijfskritisch', '3. Bedrijfskritisch', 2, 0),
  ('doel', '4. Strategisch', '4. Strategisch', 3, 0),
  ('doel', '5. Procesverbetering', '5. Procesverbetering', 4, 0),
  -- bouwinspanning
  ('bouwinspanning', 'S', 'S (klein)', 0, 0),
  ('bouwinspanning', 'M', 'M (gemiddeld)', 1, 0),
  ('bouwinspanning', 'L', 'L (groot)', 2, 0),
  -- zorgwaarde (value als string)
  ('zorgwaarde', '1', '1', 0, 0),
  ('zorgwaarde', '2', '2', 1, 0),
  ('zorgwaarde', '3', '3', 2, 0),
  ('zorgwaarde', '4', '4', 3, 0),
  ('zorgwaarde', '5', '5', 4, 0),
  -- app_icon
  ('app_icon', 'circle-dot', 'Standaard', 0, 0),
  ('app_icon', 'globe', 'Globe', 1, 0),
  ('app_icon', 'file-text', 'Document', 2, 0),
  ('app_icon', 'bar-chart-3', 'Grafiek', 3, 0),
  ('app_icon', 'layout-dashboard', 'Dashboard', 4, 0),
  ('app_icon', 'form-input', 'Formulier', 5, 0),
  ('app_icon', 'settings', 'Instellingen', 6, 0),
  ('app_icon', 'users', 'Gebruikers', 7, 0),
  ('app_icon', 'calendar', 'Kalender', 8, 0),
  ('app_icon', 'clipboard-list', 'Lijst', 9, 0),
  ('app_icon', 'link', 'Link', 10, 0)
ON CONFLICT (category, value) DO NOTHING;
