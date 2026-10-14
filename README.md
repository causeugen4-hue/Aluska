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

## Pasul 3 (înscriere pe o singură lecție + viteză)
Rulează o singură dată `supabase/migration-3.sql` în Supabase → SQL Editor (după migration-2). Înscrierile vechi sunt mutate pe prima lecție următoare a grupei.

- Părintele alege o grupă, apoi o zi anume (următoarele 5 lecții), cu bară de locuri pe fiecare zi. Pe următoarea lecție o alege când vrea.
- Steluțele contului apar în dreapta sus, în antet.
- Pentru viteză: în Vercel → Settings → Functions → Function Region, alege regiunea cea mai apropiată de proiectul Supabase.

## Cum funcționează lecțiile
O „grupă” din Administrare este o lecție care se repetă în fiecare săptămână, la aceeași oră (de ex. sâmbătă 10:00, 4–7 ani). Pe site apar lecțiile din săptămâna aceasta și din cea următoare. Părintele apasă pe una, alege copilul și se înscrie la acea lecție, apoi poate alege și altă lecție. 

## Lecția de probă
Nu e un tip separat de lecție, ci o reducere pentru părinte: la prima lecție a copilului, părintele bifează „Lecție de probă” la înscriere și achită 130 lei în loc de prețul grupei, doar el, nu toți copiii din acea zi. Rulează `supabase/migration-4.sql`. În Administrare → Prezență vezi pentru fiecare copil suma de achitat, iar în „Bani” lecția de probă se numără cu 130 lei.

## Pasul 5 (abonamente cu cod)
Rulează o singură dată `supabase/migration-5.sql` în Supabase → SQL Editor (după migration-4). Apoi fă deploy.

- **Administrare → Abonamente:** creezi un abonament (număr de lecții, cod scris de tine sau generat automat, notiță). Poți mări numărul de lecții pentru reînnoire sau șterge abonamentul.
- **Contul meu (părinte):** secțiunea „Abonament”, unde părintele scrie codul. Vede câte lecții mai are.
- **Înscriere:** dacă părintele are lecții în abonament, poate alege „Cu abonamentul”. Fiecare înscriere scade o lecție; dacă anulează înscrierea, lecția se întoarce, iar dacă închizi o lecție din Administrare, se returnează și ea.
- La ultima lecție i se spune că aceasta este ultima, iar când abonamentul se termină apare mesajul de reînnoire (cu telefonul și Instagramul din `lib/contact.js`).
- **Bani:** lecțiile plătite cu abonament nu se numără la venitul lecției, fiindcă sunt achitate în avans.

## Pasul 6 (imagini din Administrare, maximum 5 copii)
Rulează o singură dată `supabase/migration-6.sql` în Supabase → SQL Editor (după migration-5). Apoi fă deploy.

- **Administrare → Imagini:** alegi logoul (apare rotund în antet și ca iconiță în tab) și poza de la începutul paginii, pe care o văd vizitatorii fără cont. Poți reveni oricând la imaginile inițiale.
- **Grupe:** maximum 5 copii pe lecție (grupele mai mari au fost reduse la 5 de migrare).
- **Linia locurilor:** un segment pe fiecare loc; verde când e liber, galben la 3 copii, portocaliu la 4, roșu când e plină. Cardul lecției are marginea din stânga în aceeași culoare.

## Pasul 7 (notificări Telegram)
Primești un mesaj pe Telegram când cineva își face cont și când cineva se înscrie la o lecție. Nu e nevoie de migrare în Supabase.

1. În Telegram deschide **@BotFather**, scrie `/newbot`, alege un nume și un username care se termină în `bot`. Primești un **token** (de forma `123456:ABC...`).
2. Deschide botul tău nou și scrie-i `/start` (sau orice mesaj).
3. Deschide în browser `https://api.telegram.org/bot<TOKEN>/getUpdates` (pui tokenul în loc de `<TOKEN>`). În răspuns găsești `"chat":{"id":123456789,...}`. Acel număr e **chat id**.
4. În Vercel → Settings → Environment Variables adaugă `TELEGRAM_BOT_TOKEN` și `TELEGRAM_CHAT_ID`, apoi fă Redeploy.
5. **Mai multe persoane:** fiecare scrie `/start` botului, își află id-ul la pasul 3, iar în `TELEGRAM_CHAT_ID` pui id-urile separate prin virgulă, de exemplu `123456789,987654321`. Un id poate fi și al unui grup (începe cu `-`), dacă adaugi botul în grup.

Dacă variabilele lipsesc, site-ul merge normal, doar că nu trimite notificări.
