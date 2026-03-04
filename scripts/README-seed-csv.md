# Database vullen vanuit CSV (Applicaties)

## Stap 1: CSV-export

Exporteer je SharePoint-lijst **Applicaties** naar CSV (zelfde kolommen als voorheen: Status app, Applicatie, Aanspreekpunt proces, Aanspreekpunt Intern, Platform, Documentatie, Sparse, Datum oplevering, Handleiding aanwezig, Complexiteit).

## Stap 2: Script uitvoeren

Vanuit de projectmap:

```bash
node scripts/seed-apps-from-csv.js "pad/naar/Applicaties.csv"
```

Voorbeeld met bestand in Downloads:

```bash
node scripts/seed-apps-from-csv.js "c:\Users\JOUWNAAM\Downloads\Applicaties (1).csv"
```

Zonder pad wordt `scripts/Applicaties.csv` gebruikt (kopieer je export daarheen).

Het script schrijft **supabase/seed-apps.sql** (TRUNCATE + INSERTs).

## Stap 3: SQL uitvoeren

**Optie A – Supabase CLI (lokaal of gekoppeld project):**

```bash
npx supabase db execute -f supabase/seed-apps.sql
```

**Optie B – Supabase Dashboard:**

1. Ga naar je project → SQL Editor.
2. Open het bestand `supabase/seed-apps.sql`, kopieer de inhoud en plak in de editor.
3. Klik op Run.

Na het uitvoeren staat de tabel `public.apps` vol met de rijen uit je CSV.
