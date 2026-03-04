# Standaard Wachtwoorden per Rol (Fase 1)

Voor fase 1 zijn er standaard wachtwoorden per rol ingesteld. Deze zijn bedoeld voor development/test doeleinden.

⚠️ **BELANGRIJK**: Deze wachtwoorden zijn alleen voor fase 1 (lokale authenticatie). In fase 2 wordt Microsoft Entra ID SSO gebruikt.

## Standaard Wachtwoorden

| Rol | Email patroon | Wachtwoord |
|-----|---------------|------------|
| **Gebruiker** | gebruiker@ijsselheem.nl | `gebruiker` |
| **Productowner** | productowner@ijsselheem.nl | `productowner` |
| **Scrummaster** | scrummaster@ijsselheem.nl | `scrummaster` |
| **Teamlid** | teamlid@ijsselheem.nl | `teamlid` |
| **Cursor deelnemer** | cursor@ijsselheem.nl | `cursor` |
| **Admin** | admin@ijsselheem.nl | `admin` |

## Gebruikers aanmaken in Supabase

1. Ga naar **Authentication** > **Users** in je Supabase dashboard
2. Klik op **Add user** > **Create new user**
3. Vul het email adres in (bijv. `gebruiker@ijsselheem.nl`)
4. Vul het wachtwoord in (bijv. `gebruiker`)
5. Klik op **Create user**

## Profiel toevoegen

Na het aanmaken van de gebruiker in Supabase Auth, moet je ook een profiel toevoegen in de `user_profiles` tabel:

```sql
-- Voorbeeld: Gebruiker aanmaken
INSERT INTO public.user_profiles (id, email, role, display_name)
VALUES (
  'USER_UUID_FROM_SUPABASE_AUTH',  -- Vervang met het UUID van de gebruiker uit auth.users
  'kschouten@ijsselheem.nl',
  'admin',
  'Test Gebruiker'
);

-- Voorbeeld: Admin aanmaken
INSERT INTO public.user_profiles (id, email, role, display_name)
VALUES (
  'ADMIN_UUID_FROM_SUPABASE_AUTH',  -- Vervang met het UUID van de gebruiker uit auth.users
  'admin@ijsselheem.nl',
  'admin',
  'Test Admin'
);
```

## Veiligheid

- Deze wachtwoorden zijn alleen voor development/test
- Wijzig deze wachtwoorden in productie
- In fase 2 worden deze vervangen door Microsoft Entra ID SSO
