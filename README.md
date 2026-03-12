# Roadmap AAAI - IJsselheem

Complete applicatie voor wensenbeheer, backlog management, roadmap, publicaties en cursornaslag.

## Setup

1. Installeer dependencies:
```bash
npm install
```

2. **Environment variables instellen:**
   - Kopieer `.env.example` naar `.env`
   - Vul je Supabase credentials in
   - **Zie [ENV_SETUP.md](ENV_SETUP.md) voor gedetailleerde instructies**
   
   ⚠️ **Belangrijk:** Het `.env` bestand staat in `.gitignore` en wordt NIET gecommit naar Git.

3. **Gebruikers aanmaken:**
   - Maak gebruikers aan in Supabase Auth met de standaard wachtwoorden
   - **Zie [STANDARD_PASSWORDS.md](STANDARD_PASSWORDS.md) voor de standaard wachtwoorden per rol**
   - **Tijdelijk inloggen als gebruiker (beperkte view):** zie [docs/auth.md](docs/auth.md) voor een testaccount (bijv. e-mail `gebruiker@example.com` / wachtwoord `gebruiker`) en rol `gebruiker` in `user_profiles`.
   - **Microsoft/Entra (later):** zie [docs/auth.md](docs/auth.md) voor voorbereiding op inloggen met Microsoft-account.

4. Database migrations uitvoeren:
   - Open je Supabase project dashboard
   - Ga naar SQL Editor
   - Voer de migrations uit uit `supabase/migrations/`

5. Start development server:
```bash
npm run dev
```

## Modules

- **Wensenlijst**: Indienen en beoordelen van wensen
- **Backlog**: Wens tot Userstory conversie en backlog management
- **Roadmap**: Visuele roadmap met timeline
- **Publicaties**: Overzicht van gemaakte apps
- **Cursornaslag**: Instructies, video's en code elementen
- **Beheer**: Gebruikersbeheer en configuratie

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (PostgreSQL, Auth, Realtime)
- React Router v6
- React Hook Form + Zod
- Zustand
