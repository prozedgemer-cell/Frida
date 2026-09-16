# Frida — Kontrolpanel (18+)

Dansk-first personligt BDSM-flavored kontrolpanel til **Frida** (biologisk mand, tiltalt som kvinde).  
Local-first MVP: React + TypeScript + Vite. Data i `localStorage`. Ingen auth.

## Modes (bundnavigation)

Mobil: **Hoved · Kalender · + · Sex · Profil**. Plus-knappen åbner Gaming, In-game, Hverdag og Udfordringer. Desktop viser alle modes i toppen.

1. **Hoved** — greeting-overblik, **fuldt outfit via ROLE-pack** (milf/brazilian ≠ BDSM-domme ≠ g-string tease), **morgen-trio** (let/hård/grænse · kun DO/WEAR), status-chips, «Nu»-liste, badge hvis sex-straf afventer
2. **Kalender** — noter/aftaler med signal-tags (straf, belønning, blød/hård, tøj, gaming, hvile, date). Signaler påvirker tøj, challenges og om sex-straf er due
3. **Sex-straf** — fiktiv RP som indløsning af stats (partner, sted, hvorfor, varighed, hårdhed). Badge på nav når pending/due
4. **Gaming** — spil-presets (CS2, WARDOGS, LoL, Diablo IV, Fortnite) med KPI, 0–100 score, paste-import
5. **In-game** — udfordringer *mens du spiller*
6. **Hverdag** — IRL-status, soft/hard-dag, auto **fuld outfit** (præstation + kalender)
7. **Udfordringer** — træk / fuldfør / skip / fail
8. **Profil** — themes, limits, cup, intensitet, **Tilføj billede**

Nødstop er et lille ikon **øverst til højre** (header-hjørne). Pauset = ingen ny sex-straf-fremdrift. **Vægt:** kalender/rolle/dag ≈ **70%**, gaming-præstation ≈ **30%** — styrer outfit-role, challenges og sex-straf-due. Kalender-noter parses for role-hints (milf, domme, date, ranked…).

**Billeder:** seed-fotos i `public/media/{outfits,scenes}/` (listes i `src/data/seedImages.ts` og `src/data/looks.ts`). Bruger-uploads via **Tilføj billede** gemmes i IndexedDB på enheden (max 16 pr. slot, komprimeret).

**Sex-straf due** når (og cooldown er ovre, ikke nødstop, ikke hvile-dag, ingen aktiv scene): dårligt præstationsbånd, pointgæld, nederlagsstime, ≥2 loss/quit i sidste 5, nylig failed udfordring, eller kalender-signal straf/hård. Cooldown: fuldført 12 t · skip 6 t · fail 2 t.

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
- Mobil-app UX: safe-area, viewport-fit=cover, bundmenu med center-+ og neon card-UI
- **18+ gate** ved første besøg
- **Profil**: navn låst til Frida, fake breast cup-størrelse, soft/hard intensitet, soft/hard-dag, theme packs, hard limits
- **Dashboard**: fuld outfit-beording, challenges, IRL/gaming-KPI, lille **nødstop**-ikon øverst til højre
- **Spil-presets**: CS2 / WARDOGS / LoL / Diablo IV / Fortnite med strukturerede metrics + 0–100 KPI-score
- **Fuld outfit**: vægtet motor til undertøj + overdel/underdel/strømper/sko/ydertøj/accessories (tid, IRL, præstation, kalender, intensitet) — dagens uniform gemmes, reroll muligt
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

## Spil-KPI & præstation

**Wardogs-antagelse:** tolket som **WARDOGS** (BULKHEAD / Team17, Early Access sep 2026) — tactical all-out warfare FPS. Ikke Watch Dogs, ikke Warzone. Markeret i UI + her.

| Spil | Primær log | Score-vægte (0–100) | Fetch |
|------|------------|---------------------|-------|
| **CS2** | K/D/A + sejr/nederlag (ADR/HS valgfri) | KDA 45% · resultat 40% · ADR/HS valgfri | Manuel / paste (Leetify m.m. kræver nøgle) |
| **WARDOGS** | K/D/A + sejr/nederlag + **netto penge** (profit/tab) | KDA 30% · netto cash 35% · resultat 30% · zone valgfri | Manuel (community boards, ingen gratis API) |
| **LoL** | K/D/A + sejr/nederlag | KDA 40% · resultat 35% · CS/vision/dmg valgfri | Manuel / paste (Riot/OP.GG kræver nøgle) |
| **Diablo IV** | Pit tier, cleartid, deaths, journey | Pit 40% · clear 20% · deaths 15% · journey 15% · resultat 10% | Manuel (helltides crowdsource) |
| **Fortnite** | K/D/A + sejr/nederlag (placement valgfri) | KDA 40% · resultat 40% · placement valgfri | Manuel / paste (TRN-Api-Key) |

**Aktivt spil:** tydelig chip-vælger under Gaming og In-game (CS2 / WARDOGS / LoL / Diablo IV / Fortnite) — gemmes og styrer logging + challenges.

Formel-detaljer ligger i `src/engines/gameScoreEngine.ts` + in-app «Formel / hjælp». Score driver undertøj, challenges og straf/belønning som før.

**Ingen** scraping bag login, session-cookies eller passwords. «Paste tracker» er best-effort tekstparse.

## Out of scope (næste skridt)

- Live game APIs med bruger-nøgler / OAuth
- Automatisk detektion af kørende spil
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
