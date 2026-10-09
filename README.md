# KinoLog

KinoLog – React, Vite ir TypeScript filmų katalogo bei asmeninės kolekcijos MVP. TMDB pateikia tik filmų katalogo informaciją; naudotojų biblioteka, vertinimai, atsiliepimai ir sąrašai saugomi Supabase su įjungtomis RLS politikomis.

## Reikalavimai

- Node.js 22.12+ (Vite 8 reikalavimas) ir npm.
- TMDB paskyra ir API Read Access Token: [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).
- Supabase projektas su SQL editoriumi arba Supabase CLI.

## Paleidimas

```sh
npm install
cp .env.example .env.local
# Įrašykite TMDB ir Supabase duomenis į .env.local
npm run dev
```

PowerShell aplinkoje `cp` alternatyva: `Copy-Item .env.example .env.local`. Vite serverio adresą atidarykite terminalo išvestyje.

### TMDB konfigūracija

1. TMDB paskyros API nustatymuose sukurkite API Read Access Token.
2. Įrašykite jį į `VITE_TMDB_ACCESS_TOKEN`.
3. Tokenas naršyklėje yra viešai matomas; naudokite ribotos prieigos raktą ir TMDB paskyroje nustatykite galiojančius domenus, kur įmanoma. Niekada čia nedėkite serverio paslapčių.

Klientas naudoja TMDB v3 API, 12 sekundžių užklausos limitą, 5 minučių atminties talpyklą ir paieškos užklausų atšaukimą. Atvaizduojamų puslapių apačioje rodomas TMDB priskyrimo tekstas. TMDB ženklų/brand assets atskirai naudoti nereikia.

### Supabase konfigūracija

1. Sukurkite Supabase projektą.
2. Nukopijuokite Project URL ir publishable/anon viešą raktą į `VITE_SUPABASE_URL` ir `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Paleiskite migraciją `supabase/migrations/202610090001_kinolog_core.sql` per Supabase SQL Editor arba Supabase CLI.
4. Supabase Authentication → Providers → Email įjunkite el. pašto autentifikaciją. El. pašto patvirtinimo reikalavimą valdykite ten. Vietiniam bandymui įrašykite `http://localhost:5173/**` į URL Configuration leidžiamų peradresavimų sąrašą.
5. Perkraukite Vite dev serverį po `.env.local` pakeitimų.

Į klientą niekada nedėkite `service_role` ar kitų slaptų raktų. Migracija sukuria profilio įrašą registracijos metu ir apsaugo profilius, filmus bei sąrašus RLS taisyklėmis. Vieši profiliai ir sąrašai skaitomi anonimiškai; privačius ir savininko pakeitimus leidžia tik atitinkamas naudotojas.

## Komandos

```sh
npm run dev       # Vite kūrimo serveris
npm run build     # TypeScript ir Vite produkcinis build
npm run lint      # ESLint
npm run test      # Vitest vienetiniai testai
npm run test:e2e  # Playwright E2E testai
```

Playwright pirmą kartą gali reikėti naršyklės: `npx playwright install chromium`. Integraciniams bandymams naudokite atskirą Supabase test projektą; dabartinis E2E scenarijus priklauso nuo TMDB rakto, o autentifikuotos E2E istorijos reikalauja Supabase test aplinkos ir testinių paskyrų.

## MVP funkcijos

- TMDB populiarūs, geriausiai įvertinti ir rodomi filmai; paieška, žanro/metų filtrai, rikiavimas ir puslapiavimas.
- Filmo informacija, TMDB balas ir atskiras naudotojo įvertinimas, būsena bei atsiliepimas.
- El. pašto registracija/prisijungimas, sesijos atkūrimas ir atsijungimas.
- Asmeninė filmų biblioteka, būsenų filtravimas ir įrašų šalinimas.
- Vieši sąrašai, TMDB filmų paieška sąraše, filmų šalinimas ir rikiavimas.
- Vieši profiliai su peržiūrėtų filmų ir sąrašų statistika.
- Tamsi adaptyvi sąsaja ir klaviatūros fokusas.

## Struktūra

- `src/App.tsx` – maršrutai, autentifikacijos kontekstas ir puslapių komponentai.
- `src/services/tmdb.ts` – bendra TMDB API integracija ir paveikslėlių URL validacija.
- `src/services/supabase.ts` – Supabase kliento konfigūracija.
- `src/services/validation.ts` – bendros validacijos funkcijos.
- `supabase/migrations/` – lentelės, apribojimai, indeksai, triggeriai ir RLS.
- `e2e/` – Playwright viešo katalogo bandymas.

## Dažnos problemos

- „TMDB prieigos raktas nesukonfigūruotas“: patikrinkite `.env.local` pavadinimą ir perkraukite dev serverį.
- TMDB 401: sugeneruokite galiojantį API Read Access Token.
- Supabase „not configured“: patikrinkite Project URL ir publishable key; klientui nenaudokite `service_role`.
- Trūksta `profiles`/`user_movies` lentelės: paleiskite migraciją tinkamame Supabase projekte.
- Registracija be sesijos: patvirtinkite el. paštą iš laiško, jei Supabase reikalauja patvirtinimo.
- Playwright naršyklė nerasta: paleiskite `npx playwright install chromium`.

## Produkcinis paleidimas

Nustatykite tris `VITE_` kintamuosius hostingo aplinkoje ir paleiskite `npm run build`; statiniai failai generuojami į `dist/`. Kadangi TMDB raktas yra kliento aplinkoje, laikykite jį viešu. Jei reikia paslėpto serverio rakto, TMDB užklausas perkelkite į serverio arba Supabase Edge Function.
