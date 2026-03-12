# Authenticatie en rollen

## Rollen

- **gebruiker**: Beperkte navigatie (Home, Roadmap, Applicaties, Wens indienen). Geen werkstromen-sidebar. Header in primaire groene kleur.
- **admin**: Volledige toegang (Dashboard, Backlog, Beoordelen, Planning, Beheer, etc.). Header in primaire paarse kleur.

Rollen staan in de tabel `user_profiles` (kolom `role`) en worden opgehaald na inloggen via Supabase Auth.

## Tijdelijk testaccount (gebruiker)

Om als **gebruiker** in te loggen zonder Microsoft/Entra:

1. In het **Supabase Dashboard**: Authentication → Users → "Add user" (of "Invite").
2. E-mail: bijvoorbeeld `gebruiker@example.com` (of een eigen e-mail).
3. Wachtwoord: bijvoorbeeld `gebruiker` (of een eigen wachtwoord).
4. Na het aanmaken: noteer het **User UID** (uuid) van deze gebruiker.
5. In de tabel **user_profiles**: voeg een rij toe (of pas aan) met:
   - `id` = het User UID uit stap 4
   - `email` = hetzelfde e-mailadres
   - `role` = `'gebruiker'`
   - `display_name` = bijv. `Gebruiker`

Als `user_profiles` niet automatisch wordt gevuld bij sign-up, moet deze rij handmatig worden toegevoegd (bijv. via SQL Editor of Table Editor).

**Inloggen:** gebruik het gekozen e-mailadres en wachtwoord op de loginpagina.

## Microsoft / Azure AD (Entra) – voorbereiding

De app is voorbereid op Microsoft-accounts. Zodra er een **Azure AD / Entra ID Enterprise Application** is:

1. **Supabase Dashboard** → Authentication → Providers → **Azure**.
2. Vul in wat Supabase vraagt (Client ID, Client Secret, etc.). De exacte stappen staan in de [Supabase-documentatie](https://supabase.com/docs/guides/auth/social-login/auth-azure).
3. Environment variables: de bestaande `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` blijven; Azure-configuratie staat in het Supabase-dashboard (niet in de frontend .env).
4. In de code kan dan naast e-mail/wachtwoord **Sign in with Microsoft** worden toegevoegd via `supabase.auth.signInWithOAuth({ provider: 'azure' })`. De bestaande `AuthContext` en `onAuthStateChange` werken ongewijzigd; na OAuth-redirect komt de gebruiker in dezelfde sessie.
5. **user_profiles**: bij het eerste inloggen via Microsoft moet er een rij in `user_profiles` komen (zelfde `id` als `auth.users.id`). Dat kan via een database-trigger op `auth.users` (INSERT) die een rij in `user_profiles` aanmaakt met default `role = 'gebruiker'`, of handmatig/via een admin-flow.

Tot de Entra-app klaar is, blijft inloggen via e-mail en wachtwoord beschikbaar.
