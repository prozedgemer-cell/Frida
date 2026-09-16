# Frida — Kontrolpanel (18+)

Dansk-first personligt BDSM-flavored kontrolpanel til **Frida** (biologisk mand, tiltalt som kvinde).  
Local-first MVP: React + TypeScript + Vite. Data i `localStorage`. Ingen auth.

**Telefon-app:** det er en Progressive Web App (PWA). Ingen App Store / Play-betaling — åbn URL’en på telefonen og vælg **Føj til hjemmeskærm**.

> **18+ only.** Indeholder seksuelt / BDSM-indhold. Nødstop og hard limits er indbygget.

## Kør lokalt

```bash
cd frida
npm install
npm run dev
```

Åbn den URL Vite viser (typisk `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

`npm run build` skriver et statisk site til mappen **`dist/`** (`index.html`, JS/CSS, ikoner, web manifest og service worker). Den mappe er det, du lægger på et host. Kør `npm run preview` for at teste build’et lokalt — PWA/service worker virker bedst her (ikke i `file://`).

Ikoner kan regenereres med `npm run icons`.

## Installer som telefon-app (PWA)

PWA kræver **HTTPS** (eller `localhost`). Åbn ikke `index.html` direkte som `file://` på telefonen — tilføj-til-hjemmeskærm og offline virker typisk ikke.

### iPhone / iPad (Safari)

1. Deploy (se nedenfor) og åbn **https-URL’en i Safari** (ikke Chrome).
2. Tryk **Del** (firkant med pil op).
3. Scroll og tryk **Føj til hjemmeskærm**.
4. Tryk **Tilføj**. Frida ligger nu som app-ikon og åbner i standalone (uden Safari-chrome).

### Android (Chrome)

1. Åbn https-URL’en i Chrome.
2. Menu **⋮** → **Installer app** / **Føj til startskærm** — eller brug knappen **Installer Frida** i panelet, hvis Chrome viser den.
3. Bekræft. Appen åbner fuld skærm.

### Begrænsninger (især iOS)

- Installér fra **Safari** på iPhone; `beforeinstallprompt` findes ikke der.
- Service worker og “Add to Home Screen” kræver HTTPS (ikke `file://`).
- `localhost` på telefonen er besværligt (samme Wi-Fi + computerens LAN-IP, og iOS er stadig kræsen). Brug et statisk host.
- iOS kan rydde PWA-data ved inaktivitet; localStorage er stadig kun på den enhed.
- Standalone på iPhone har ingen browser-UI — det er meningen.

## Deploy gratis (så telefonen kan installere)

Byg og upload **`dist/`** til et statisk host med HTTPS. Eksempler:

- [GitHub Pages](https://pages.github.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [Netlify](https://www.netlify.com/)
- [Render static](https://render.com/) / [surge.sh](https://surge.sh/)

Efter deploy: åbn URL’en på telefonen → Føj til hjemmeskærm.

### GitHub Pages (`prozedgemer-cell/Frida`)

**Live URL:** https://prozedgemer-cell.github.io/Frida/

Repoet er et **project site**. Vite `base` skal matche:

```bash
BASE_PATH=/Frida/ npm ci
BASE_PATH=/Frida/ npm run build
```

Deploy uden Actions: push **app source** til `main`, og indholdet af `dist/` (inkl. `.nojekyll`) til branch **`gh-pages`** i repo-roden. Pages er sat til branch `gh-pages` / `/` (root).

Opdateringer: samme flow — rebuild med `BASE_PATH=/Frida/`, push source til `main`, push ny `dist/` til `gh-pages`.

Hvis du i stedet bruger et **user/org-site** eller custom domain i roden, er default nok:

```bash
npm run build
```

(`base` er `/` medmindre `BASE_PATH` er sat.)

Cloudflare Pages / Netlify: peg på repoet, build command `npm run build`, publish directory `dist`. Root-host behøver ikke `BASE_PATH`.

## Push til GitHub (`prozedgemer-cell/Frida`)

Fra din egen maskine, efter du har pakket zip'en ud:

```bash
# Opret repo på GitHub hvis det ikke findes endnu, eller brug eksisterende
git clone git@github.com:prozedgemer-cell/Frida.git
cd Frida

# Kopiér indholdet fra denne MVP ind i repoet (behold .git)
# Eksempel hvis zip er pakket ud til ./frida-source :
rsync -av --exclude node_modules --exclude dist ./frida-source/ ./

npm install
npm run build
git add .
git commit -m "Frida kontrolpanel PWA"
git push -u origin main
```

Hvis repoet er tomt, kan du også `git init` i projektmappen, tilføje remote, og pushe.

## Hvad er med i MVP

- **PWA**: manifest, ikoner, service worker (offline skal), “Føj til hjemmeskærm”, standalone fuldskærms-app
- Mobil-app UX: safe-area, viewport-fit=cover, bundmenu (Hjem / Udfordring / Profil) på telefon
- **18+ gate** ved første besøg
- **Profil**: navn låst til Frida, fake breast cup-størrelse, soft/hard intensitet, soft/hard-dag, theme packs, hard limits
- **Dashboard**: tydelig undertøjs-beording, challenges, IRL/gaming-kontekst, stort **nødstop**
- **Auto undertøj**: vægtet motor (tid, hverdag/weekend, IRL-status, valgfrit spil, intensitet, themes) — dagens valg gemmes, reroll muligt
- **Challenge-motor**: ~118 danske skabeloner med tags/themes; anatomi-respekt (ingen vaginal-use; semen-opsamling tilladt ærligt); complete / skip / fail-log
- **Themes** (toggle): BDSM, clothing/underwear, sex, IRL, porn, anime, hentai, fantasy roleplay
- Mørk sort/rød æstetik, mobilvenlig

## Tilføj challenge-skabeloner

Rediger `src/data/challenges.ts` og tilføj objekter til `CHALLENGE_TEMPLATES`:

```ts
{
  id: 'ch-mit-01',
  titleDa: 'Kort titel',
  bodyDa: 'Ordre til Frida. Brug {breastSize}, {underwear}, {game}, {irl} efter behov.',
  tags: ['min-tag'],
  themes: ['bdsm', 'clothing'],
  intensity: ['soft', 'hard'],
  // allowsSemenCollection: true,  // kun hvis ærlig anatomi / opsamling
  // hardLimitKeys: ['blod'],
  // minDurationMin: 5,
  // vars: ['breastSize'],
}
```

**Regler**

- Skriv på dansk, tiltale **Frida**
- Ingen vagina-/vaginal-tease challenges (undtagen eksplicit semen-opsamling med ærlig anatomi)
- Respekter hard limits via `hardLimitKeys`

### Hvordan det skalerer mod titusinder

Antal skabeloner × aktive theme packs × soft/hard × variabel-udfyldning (`breastSize`, `underwear`, `game`, `irl`) × kontekst (tid/IRL) giver et stort kombinatorisk rum.  
Med ~120 skabeloner og 8 themes lander ordensstørrelsen allerede i **tusinder–titusinder** unikke konkrete tekster — uden at hardkode hver variant. Tilføj flere skabeloner/tags for at vokse videre.

Undertøjskatalog: `src/data/underwear.ts`.

## Out of scope (næste skridt)

- Rigtige game APIs / automatisk detektion af spil
- Multi-user / cloud sync
- Native App Store / Play-apps (PWA dækker telefon-ikonet gratis)
- Konti / auth

## Sikkerhed

- Nødstop pauser challenges og fryser nye ordrer
- Hard limits filtrerer skabeloner
- Soft-dag begrænser til soft-capable challenges
- Privat: alt ligger lokalt i browseren

## Licens / privat

Privat personligt projekt. Del ikke andres data. Ingen screenshots til deling hvis det bryder dine egne limits.
