# Environment Variables Setup

## Stap 1: Maak een .env bestand aan

Kopieer het `.env.example` bestand naar `.env`:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# Windows (CMD)
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

## Stap 2: Vul je Supabase credentials in

1. Ga naar [Supabase](https://supabase.com) en log in
2. Maak een nieuw project aan of open een bestaand project
3. Ga naar **Project Settings** > **API**
4. Kopieer de volgende waarden:

### VITE_SUPABASE_URL
- Dit is de "Project URL" uit Supabase
- Voorbeeld: `https://abcdefghijklmnop.supabase.co`

### VITE_SUPABASE_ANON_KEY
- Dit is de "anon public" key uit Supabase
- Dit is een lange string die begint met `eyJ...`

## Stap 3: Vul je .env bestand in

Open `.env` en vul de waarden in:

```env
VITE_SUPABASE_URL=https://jouw-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Belangrijk: Veiligheid

✅ **DOEN:**
- `.env` staat al in `.gitignore` - het wordt NIET gecommit naar Git
- Gebruik `.env.example` als template voor anderen
- Deel nooit je `.env` bestand of de waarden daarin

❌ **NIET DOEN:**
- Commit `.env` naar Git
- Deel je Supabase keys publiekelijk
- Gebruik productie keys in development (tenzij nodig)

## Database Setup

Na het instellen van je environment variables:

1. Voer de database migrations uit in Supabase:
   - Ga naar **SQL Editor** in je Supabase dashboard
   - Voer `supabase/migrations/001_initial_schema.sql` uit
   - Voer `supabase/migrations/002_rls_policies.sql` uit
   - Optioneel: Voer `supabase/seed.sql` uit voor standaard data

2. Maak gebruikers aan:
   - Ga naar **Authentication** > **Users** in Supabase
   - Maak gebruikers aan met email/password
   - Voeg profielen toe in de `user_profiles` tabel met de juiste rollen

## Problemen oplossen

**"Missing environment variables" error:**
- Controleer of `.env` bestaat in de root van het project
- Controleer of de variabele namen exact kloppen (VITE_ prefix is verplicht!)
- Herstart de development server na het aanpassen van `.env`

**"Invalid API key" error:**
- Controleer of je de juiste key hebt gekopieerd (anon public key, niet service_role key)
- Controleer of er geen extra spaties zijn in je `.env` bestand
