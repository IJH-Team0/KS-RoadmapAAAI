-- Gegenereerd door scripts/seed-apps-from-csv.js op 2026-03-02T19:51:49.717Z
-- Bron: c:\Users\KeesSchouten\Downloads\Applicaties (1).csv
-- Voer uit met: npx supabase db execute -f supabase/seed-apps.sql (of plak in SQL Editor)

TRUNCATE TABLE public.apps RESTART IDENTITY CASCADE;

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Aanwezigheidsmodule Infoheem', 'in_voorbereiding'::public.app_status, 'A.tKlooster@ijsselheem.nl', 'he.bakker@ijsselheem.nl', 'Webapp - Azure', '/:f:/s/TM-BV-Powerplatform-EXT/IgCHN1XTspb_SoKRXG3IZQa4AVAIDeF-y1167GaWLfL8wZY?e=p3Of6M', false, NULL, false, 'Gemiddeld');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Inschrijven website Symposium', 'in_productie'::public.app_status, 'j.ritmeester@ijsselheem.nl', 'k.schouten@ijsselheem.nl', 'Webapp - Bolt/Cursor/Netlify', '/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten', false, '2025-10-09', false, 'Eenvoudig');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Cateringsformulieren', 'in_testfase'::public.app_status, 't.overwater@ijsselheem.nl', 'he.bakker@ijsselheem.nl', 'Powerplatfom', '/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten', true, NULL, false, 'Complex');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('HIS', 'in_productie'::public.app_status, NULL, 'he.bakker@ijsselheem.nl', 'Powerplatfom', '/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten', true, '2025-10-31', false, 'Complex');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('NPI Score', 'in_productie'::public.app_status, NULL, 'he.bakker@ijsselheem.nl', 'Overig', '/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten', true, NULL, false, 'Complex');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Duofiets reserveringsysteem', 'in_productie'::public.app_status, NULL, NULL, 'Webapp - Azure', 'https://teams.microsoft.com/l/channel/19%3A836a247a2f134e3abfcfe29800bc030f%40thread.tacv2/Duofiets%20reservering%20systeem?groupId=cf690cf3-c029-4559-b2d5-c8affa9784cb&tenantId=f7ba65c3-a978-43d7-be8f-396a787858f6', true, NULL, false, 'Complex');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Inleeslijsten leerplein', 'in_productie'::public.app_status, 'A.tKlooster@ijsselheem.nl', 'he.bakker@ijsselheem.nl', 'Webapp - Bolt/Cursor/Netlify', '/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten', false, NULL, false, 'Eenvoudig');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('ADL-handelingen reserveringsysteem', 'in_productie'::public.app_status, NULL, 'he.bakker@ijsselheem.nl', NULL, '/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten', false, NULL, false, 'Eenvoudig');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Netwerk in kaart - Ecogram', 'in_productie'::public.app_status, NULL, 'he.bakker@ijsselheem.nl', 'Webapp - Azure', '/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten', false, NULL, false, 'Eenvoudig');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Telefoonboek', 'in_productie'::public.app_status, 'k.bosman@ijsselheem.nl', 'k.schouten@ijsselheem.nl', 'Powerplatfom', '/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten', false, NULL, false, 'Eenvoudig');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Voedingslijsten', 'in_productie'::public.app_status, 'R.Tuinman@ijsselheem.nl', 'k.schouten@ijsselheem.nl', 'Powerplatfom', '/sites/Powerplatform_Voedingsdienst/SitePages/Powerplatform-Voedingsdienst.aspx', false, NULL, false, 'Eenvoudig');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Volgens van kwaliteit - Foto', 'in_productie'::public.app_status, NULL, 'k.schouten@ijsselheem.nl', 'Powerplatfom', '/sites/Volgen-van-kwaliteit', false, NULL, false, 'Eenvoudig');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('TOPdesk AI', 'afgewezen'::public.app_status, 'r.potze@ijsselheem.nl', 'k.schouten@ijsselheem.nl', 'Webapp - Azure', NULL, false, NULL, false, 'Eenvoudig');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Voorportaal groeigesprekken', 'in_testfase'::public.app_status, 'm.bunt@ijsselheem.nl', NULL, 'Webapp - Bolt/Cursor/Netlify', NULL, false, NULL, false, 'Eenvoudig');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Maaltijdservice', 'wensenlijst'::public.app_status, NULL, NULL, NULL, NULL, false, NULL, false, 'Gemiddeld');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Telefoonboek App 2.0', 'in_testfase'::public.app_status, NULL, NULL, 'Powerplatfom', '/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten', true, NULL, false, 'Eenvoudig');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Revalidatie capaciteitsplanning', 'in_voorbereiding'::public.app_status, NULL, 'd.braakhekke@ijsselheem.nl', NULL, NULL, false, NULL, false, 'Complex');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Beleefmeter', 'wensenlijst'::public.app_status, 's.kost@ijsselheem.nl', NULL, 'Webapp - Azure', NULL, false, NULL, false, 'Complex');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Klanttevredenheidmeter - Email feedback', 'in_ontwikkeling'::public.app_status, 'w.rossingh@ijsselheem.nl', 'he.bakker@ijsselheem.nl', 'Webapp - Azure', '/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten', false, NULL, false, 'Gemiddeld');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('TOPdesk Dasboard', 'in_ontwikkeling'::public.app_status, 'w.rossingh@ijsselheem.nl', 'he.bakker@ijsselheem.nl', 'Webapp - Azure', '/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten', false, NULL, false, 'Complex');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Wondfoto', 'in_productie'::public.app_status, 'A.Zielman@ijsselheem.nl', 'he.bakker@ijsselheem.nl', 'Powerplatfom', '/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten', true, '2025-08-31', false, 'Complex');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Eindejaarsgeschenk', 'in_productie'::public.app_status, 'A.tKlooster@ijsselheem.nl', 'he.bakker@ijsselheem.nl', 'Webapp - Azure', '/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten', false, NULL, false, 'Gemiddeld');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('IJsselGPT', 'in_ontwikkeling'::public.app_status, 'j.hidding@ijsselheem.nl', NULL, 'Webapp - Azure', '/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten', true, NULL, false, 'Complex');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Uitbraakregistratie', 'wensenlijst'::public.app_status, 'd.potkamp@ijsselheem.nl', NULL, NULL, NULL, false, NULL, false, 'Eenvoudig');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Storing en uitwijkportaal', 'in_ontwikkeling'::public.app_status, 'k.schouten@ijsselheem.nl', 'k.schouten@ijsselheem.nl', 'Webapp - Bolt/Cursor/Netlify', NULL, false, NULL, false, 'Eenvoudig');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('IJsselGPT - Agent W&S', 'in_voorbereiding'::public.app_status, 'g.bres@ijsselheem.nl', 'j.hidding@ijsselheem.nl', 'Agent', '/:f:/s/TM-BV-Powerplatform-EXT/IgDcg6ElU8oSTrEGSG28iWgUARB9xk03rg-lFnreMwDe9RE?e=GFNI9Q', true, NULL, false, 'Complex');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Video Ouderenzorg Interventie App', 'in_testfase'::public.app_status, 'he.bakker@ijsselheem.nl', 's.nijholt@ijsselheem.nl', 'Overig', '/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten', false, NULL, false, 'Gemiddeld');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Zomerstage - Inschrijven en inroosteren', 'in_ontwikkeling'::public.app_status, 'e.helvert@ijsselheem.nl', 'k.schouten@ijsselheem.nl', 'Webapp - Bolt', NULL, false, NULL, false, 'Eenvoudig');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Zorgtechnologie Dashboard', 'wensenlijst'::public.app_status, 'r.brink@ijsselheem.nl', 'he.bakker@ijsselheem.nl', 'Webapp - Azure', 'https://teams.microsoft.com/l/channel/19%3A26cb39bf283d4a7bb10254177ae55c79%40thread.tacv2/Zorgtechnologie%20Dashboard?groupId=cf690cf3-c029-4559-b2d5-c8affa9784cb&tenantId=f7ba65c3-a978-43d7-be8f-396a787858f6', false, NULL, false, 'Gemiddeld');

INSERT INTO public.apps (naam, status, aanspreekpunt_proces, aanspreekpunt_intern, platform, documentatie_url, sparse, datum_oplevering, handleiding_aanwezig, complexiteit)
VALUES ('Tandartsapp', 'in_voorbereiding'::public.app_status, 'e.vdwerfhorst@ijsselheem.nl', NULL, NULL, '/:f:/r/sites/TM-BV-Powerplatform-EXT/Gedeelde%20documenten/General/Applicaties/Tandartsapp?csf=1&web=1&e=nRap9J', false, NULL, false, 'Complex');
