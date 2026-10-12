# Alușka Art Studio – site de înscrieri

Next.js (Vercel) + Supabase (bază de date și autentificare).

## 1. Supabase
1. Creează un proiect pe supabase.com.
2. SQL Editor → lipește tot conținutul din `supabase/schema.sql` → Run.
3. Authentication → Providers → Email: pentru început poți opri „Confirm email”, ca părinții să intre direct în cont.
4. Project Settings → API: copiază **Project URL** și cheia **anon / publishable**.

## 2. Rulare locală (opțional)
```
cp .env.example .env.local   # completează cele două valori
npm install
npm run dev
```

## 3. Vercel
1. Urcă folderul pe GitHub.
2. Pe vercel.com: Add New → Project → alege repo-ul.
3. Environment Variables: `NEXT_PUBLIC_SUPABASE_URL` și `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy.
5. În Supabase → Authentication → URL Configuration, pune adresa site-ului la Site URL.

## 4. Contul de administrator
Creează-ți cont pe site, apoi în Supabase SQL Editor rulează:
```
update public.profiles set is_admin = true where email = 'emailul-tau@exemplu.com';
```
După autentificare vei vedea „Administrare” în meniu.

## Ce poți face în Administrare
- **Bani:** venit pe săptămână și pe lună (lecții ținute × copii × preț), cu navigare între perioade.
- **Înscrieri:** editezi numele, data nașterii și grupa copilului, ștergi înscrieri.
- **Grupe și lecții:** adaugi/editezi/ștergi grupe, închizi înscrierile la o grupă, închizi o lecție anume (nu intră în calculul banilor).

## Pasul 2 (galerie, probe, vârste, steluțe, magazin)
Rulează o singură dată `supabase/migration-2.sql` în Supabase → SQL Editor. Apoi fă deploy.

- **Galerie:** Administrare → Galerie, încarci poze; apar în carusel pe pagina principală.
- **Grupe:** ai categoria de vârstă (4–7 sau 8–12) și bifa „Lecție de probă” (130 lei, o singură dată, cu dată anume).
- **Prezență:** Administrare → Prezență; bifezi copiii prezenți, părintele primește 5 steluțe pentru fiecare.
- **Magazin:** Administrare → Magazin; adaugi produse cu preț în steluțe, vezi comenzile, le marchezi predate sau le anulezi (steluțele se returnează).
