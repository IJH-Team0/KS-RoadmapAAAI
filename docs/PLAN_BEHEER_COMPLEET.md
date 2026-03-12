# Plan: Complete Beheerpagina (gebruikers, keuzelijsten, prioriteitsscore)

## Overzicht

De Beheerpagina (`/beheer`, alleen voor admins) moet drie onderdelen krijgen:

1. **Gebruikers** – overzicht, rol wijzigen, optioneel gebruiker toevoegen
2. **Keuzelijsten** – alle dropdown-/keuzelijsten uit de app beheren (toevoegen, bewerken, verwijderen, volgorde)
3. **Prioriteitsscore** – formule-parameters (risico-aftrek, punten S/M/L, bonus per zorgimpact type) — **reeds geïmplementeerd**

---

## Huidige situatie

- **Route** `/beheer`: bestaat; alleen zichtbaar voor `role === 'admin'`; link in navigatie alleen voor admins.
- **Beheer-pagina**: bevat nu alleen de sectie **Prioriteitsscore** (formule aanpassen).
- **user_profiles** ([001_initial_schema.sql](supabase/migrations/001_initial_schema.sql)): `id`, `email`, `role` (enum: gebruiker | admin), `display_name`, `created_at`, `updated_at`. RLS: eigen profiel lezen; admins mogen alle profielen lezen en **updaten** (o.a. rol). Geen INSERT-policy: nieuwe gebruikers toevoegen vereist extra voorziening.
- **reference_options** ([021_prioriteitsscore_config_and_reference_options.sql](supabase/migrations/021_prioriteitsscore_config_and_reference_options.sql)): tabel bestaat met `id`, `category`, `value`, `label`, `sort_order`, `prioriteit_bonus`. Alleen categorie **zorgimpact_type** is geseeded. RLS: SELECT voor ingelogd; INSERT/UPDATE/DELETE voor admins.
- **Keuzelijsten in de app**: alle opties staan **hardcoded** in [src/types/app.ts](src/types/app.ts). Gebruik o.a. in BacklogDetail, AppDetail, Backlog, NieuweAanvraag, Rapportage.

---

## 1. Gebruikersbeheer

### Doel

- Lijst van alle gebruikers (e-mail, weergavenaam, rol, evt. aanmaakdatum)
- Rol wijzigen (gebruiker ↔ admin)
- Optioneel: **nieuwe gebruiker toevoegen**

### Backend (al aanwezig)

- Admins kunnen `user_profiles` lezen (alle rijen) en **updaten** (rol, display_name). Geen INSERT-policy.

### Nodig voor “gebruiker toevoegen”

Twee opties:

- **Optie A – Uitnodiging**: Supabase `auth.admin.inviteUserByEmail()`. Na acceptatie moet een rij in `user_profiles` ontstaan: via **trigger** op `auth.users` (na insert) die een profiel aanmaakt met `role = 'gebruiker'`, of via Edge Function die namens admin na uitnodiging een INSERT in `user_profiles` doet. RLS: policy “Admins can INSERT into user_profiles” toevoegen indien de insert vanuit de app/Edge Function onder admin-context gebeurt.
- **Optie B – Alleen profiel koppelen**: Gebruiker bestaat al in Supabase Auth (handmatig in dashboard). Alleen een profielrij toevoegen: RLS-policy “Admins can INSERT into user_profiles” + in de Beheer-UI “Bestaande gebruiker koppelen” (e-mail invoeren, profiel aanmaken voor bijbehorend `auth.users.id`). Vereist een admin-only RPC of Edge Function die bij e-mail het user-id opzoekt (Auth is niet rechtstreeks querybaar voor anon key).

**Aanbeveling**: Optie A (uitnodiging + trigger of Edge Function) voor echte self-service; anders Optie B als tussenstap.

### Beheer-UI: sectie Gebruikers

- **Tabel**: kolommen E-mail, Weergavenaam, Rol, Aanmaakdatum; kolom Acties met dropdown “Rol wijzigen” (gebruiker / admin) en opslaan.
- **Knop “Gebruiker toevoegen”**: afhankelijk van gekozen optie (A of B) – formulier e-mail (+ evt. weergavenaam, rol) en actie “Uitnodigen” of “Profiel koppelen”.

---

## 2. Keuzelijsten

### Doel

Alle keuzelijsten die nu in [src/types/app.ts](src/types/app.ts) staan, in de database beheerbaar maken en in de app uit de database laden (met fallback op huidige constanten).

### Inventaris (11 categorieën)

| Categorie (key)      | Huidige bron in app                    | Gebruik in app                    | Bijzonderheid |
|----------------------|----------------------------------------|-----------------------------------|---------------|
| **app_status**       | APP_STATUS_OPTIONS (enum value + label)| apps.status, features.planning_status; Backlog, BacklogDetail, AppDetail, Planning, Rapportage | PostgreSQL ENUM: waarden vast. Alleen **label** en **sort_order** bewerkbaar in Beheer. Geen toevoegen/verwijderen. |
| **domein**           | DOMEIN_OPTIONS                         | apps.domein; Backlog (filter), NieuweAanvraag, AppDetail, Rapportage | Volledig CRUD. |
| **platform**         | PLATFORM_OPTIONS                       | apps.platform; AppDetail         | Volledig CRUD. |
| **prioriteit**       | PRIORITEIT_OPTIONS                     | apps.prioriteit; AppDetail       | Volledig CRUD. |
| **complexiteit**     | COMPLEXITEIT_OPTIONS                   | apps.complexiteit; AppDetail     | Volledig CRUD. |
| **impact**           | IMPACT_OPTIONS                         | apps.impact; AppDetail           | Volledig CRUD. |
| **doel**             | DOEL_OPTIONS                           | apps.doel; AppDetail             | Volledig CRUD. |
| **zorgimpact_type**  | ZORGIMPACT_TYPE_OPTIONS                | features.zorgimpact_type; NieuweAanvraag, BacklogDetail, AppDetail | Volledig CRUD. Heeft ook **prioriteit_bonus** (voor prioriteitsscore-formule). |
| **bouwinspanning**   | BOUWINSPANNING_OPTIONS (value S/M/L)   | features.bouwinspanning; BacklogDetail, AppDetail | Volledig CRUD. value = S, M, L. |
| **zorgwaarde**       | ZORGWAARDE_OPTIONS (1–5)               | features.zorgwaarde; BacklogDetail, AppDetail | Volledig CRUD. value als string "1" t/m "5". |
| **app_icon**         | APP_ICON_OPTIONS (value = Lucide key)  | apps.icon_key; AppDetail         | Volledig CRUD. value = icon key, label = weergavenaam. |

### Database

- **reference_options** bestaat al. Kolom **prioriteit_bonus** wordt alleen voor `zorgimpact_type` gebruikt; voor andere categorieën 0 of negeren.
- **Uitbreiding**: migratie om voor **alle** 11 categorieën de huidige waarden uit app.ts te seeden (value, label, sort_order). Categorie **zorgimpact_type** is al geseeded in 021; in dezelfde of nieuwe migratie de overige 10 categorieën toevoegen.

### Frontend: opties uit DB laden

- **Hook** `useReferenceOptions(category: string)`:  
  `supabase.from('reference_options').select('value, label, sort_order').eq('category', category).order('sort_order')`.  
  Retourneert `{ value, label }[]` (evt. inclusief `prioriteit_bonus` voor zorgimpact_type).  
  Bij fout of lege lijst: **fallback** op de bestaande constanten in app.ts.
- **Optioneel**: context `ReferenceOptionsProvider` die alle categorieën eenmalig laadt (minder queries).
- **Vervangen in de app**: overal waar nu `DOMEIN_OPTIONS`, `APP_STATUS_OPTIONS`, `ZORGIMPACT_TYPE_OPTIONS`, enz. worden geïmporteerd, overschakelen naar `useReferenceOptions('domein')`, `useReferenceOptions('app_status')`, enz. Types behouden waar nodig (bijv. `AppStatusDb` blijft union type; value moet enum-waarde blijven voor app_status).
- **Hulpfuncties** zoals `getStatusLabel(status)`: blijven bestaan; kunnen optioneel de geladen lijst meekrijgen of uit context lezen.

### Beheer-UI: sectie Keuzelijsten

- **Overzicht per categorie**: per categorie een blok of tab met naam (bijv. “Domein”, “Platform”, “Zorgimpact type”).
- **Tabel per categorie**: kolommen Waarde, Label, Volgorde (sort_order); voor **zorgimpact_type** extra kolom **Bonus (prioriteit)** (prioriteit_bonus). Acties: Bewerken, Verwijderen (behalve bij app_status), en “Toevoegen” (behalve bij app_status).
- **app_status**: alleen **label** en **sort_order** bewerkbaar; geen Toevoegen/Verwijderen (waarden moeten overeenkomen met PostgreSQL-enum). Korte toelichting in UI: “Alleen label en volgorde wijzigen; nieuwe status via migratie.”
- **Volgorde**: veld sort_order bewerkbaar of drag-and-drop; bij opslaan reeks 0, 1, 2, … doorvoeren.
- **Verwijderen**: optioneel waarschuwing als waarde nog in gebruik is (query op apps/features). Geen harde blokkade vereist in eerste versie.

### Bestaande data

- Kolommen als `apps.domein`, `apps.platform`, `features.zorgimpact_type` zijn TEXT. Bestaande waarden blijven geldig zolang ze in `reference_options` staan. Verwijderen van een optie kan “wees”-waarde achterlaten; optioneel toont Beheer “X apps/features gebruiken deze waarde”.

---

## 3. Prioriteitsscore (reeds geïmplementeerd)

- **prioriteitsscore_config**: risk_penalty, bouwinspanning_s/m/l.
- **reference_options** voor `zorgimpact_type`: kolom prioriteit_bonus.
- **usePrioriteitsscoreConfig()**: laadt config en zorgimpact-bonussen; BacklogDetail gebruikt dit bij berekening.
- **Beheer-UI**: sectie “Prioriteitsscore” met velden risico-aftrek, punten S/M/L, en tabel zorgimpact types met kolom Bonus.

Geen extra werk voor dit onderdeel.

---

## 4. Beheer-pagina: structuur

- **Eén pagina** `/beheer` met drie hoofdsecties (tabs of accordeons):
  1. **Gebruikers** – tabel + rol wijzigen + (optioneel) gebruiker toevoegen.
  2. **Keuzelijsten** – per categorie een subblok met tabel (Waarde, Label, Volgorde, evt. Bonus) en CRUD (met restricties voor app_status).
  3. **Prioriteitsscore** – bestaande sectie (formule-parameters + bonus per zorgimpact type).

- Alleen toegankelijk voor `role === 'admin'` (redirect naar `/` anders). Link “Beheer” alleen in navigatie voor admins.

---

## 5. Volgorde van implementatie

| Fase | Onderdeel | Actie |
|------|-----------|--------|
| 1 | Beheer-pagina structuur | Tabs of secties toevoegen: Gebruikers, Keuzelijsten, Prioriteitsscore (bestaand blok verplaatsen). |
| 2 | Gebruikers | Tabel user_profiles (e-mail, display_name, role); rol wijzigen. Optioneel: INSERT-policy + UI “Gebruiker toevoegen” (uitnodiging of profiel koppelen). |
| 3 | reference_options seed | Migratie: seed alle 10 overige categorieën (app_status, domein, platform, prioriteit, complexiteit, impact, doel, bouwinspanning, zorgwaarde, app_icon) met huidige waarden uit app.ts. app_status: value = enum-waarde. |
| 4 | useReferenceOptions | Hook (en optioneel provider); fallback op app.ts. |
| 5 | App overstappen | Alle plekken die *_OPTIONS gebruiken, overschakelen op useReferenceOptions(category). Types/AppStatusDb handhaven. |
| 6 | Beheer Keuzelijsten | UI per categorie: tabel, Bewerken, Toevoegen, Verwijderen (behalve app_status); voor app_status alleen label + sort_order. |
| 7 | Prioriteitsscore | Geen wijziging; blijft zoals nu. |

---

## 6. Samenvatting

| Onderdeel | Status | Actie |
|-----------|--------|--------|
| **Beheer-route / navigatie** | Gereed | — |
| **Sectie Prioriteitsscore** | Gereed | — |
| **Sectie Gebruikers** | Te bouwen | Tabel + rol wijzigen; optioneel INSERT + “Gebruiker toevoegen”. |
| **Sectie Keuzelijsten** | Te bouwen | Seed alle categorieën; useReferenceOptions; Beheer-UI CRUD per categorie; app overzetten op DB-opties. |
| **reference_options** | Deels gereed | Uitbreiden met seed voor alle 11 categorieën (zorgimpact_type al aanwezig). |

Dit plan beschrijft het **volledige** beheer: gebruikers, alle keuzelijsten en de bestaande prioriteitsscore-configuratie op één plek.
