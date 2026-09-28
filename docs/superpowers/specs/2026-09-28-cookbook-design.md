# Osobní kuchařka — statický web

**Datum:** 2026-09-28
**Stav:** Návrh ke schválení

## Cíl

Osobní webová kuchařka: recepty dnes uložené v jednom velkém Google Docs dokumentu se
jednorázově převedou do Markdown souborů v gitu a vygeneruje se z nich statický web.
Primárně pro vlastní použití — rychle najít recept, dobře čitelný na mobilu v kuchyni.
Vzhled a SEO jsou druhotné. Žádný backend.

**Kritéria úspěchu:**
- Všechny recepty z Google Docs jsou na webu, nic se při převodu neztratilo.
- Recept jde najít během pár vteřin hledáním (bez ohledu na diakritiku) nebo přes kategorii / štítek.
- Detail receptu je pohodlně čitelný na telefonu.
- Nový recept = nový `.md` soubor + `./deploy.ps1`.

## Rozhodnutí (z brainstormingu)

| Téma | Volba |
|------|-------|
| Účel | **Osobní** (ne blog, ne sdílení). Důraz na hledání a čitelnost na mobilu. |
| Zdroj | Jeden velký Google Docs dokument, recepty oddělené nadpisy, obsah **napůl strukturovaný**. |
| Rozsah | **Do ~50 receptů, bez fotek.** |
| Funkce | **Hledání + kategorie/štítky.** Nic dalšího v první verzi. |
| Formát receptu | Markdown + frontmatter, Astro content collection se schématem. |
| Převod | Skript rozseká export podle nadpisů → normalizace do formátu provedená Claudem v konverzaci → ruční revize. Jednorázově; Google Docs pak přestává být zdrojem. |
| Stack | **Astro 5 + Tailwind 4**, TypeScript strict — stejně jako `../akbrucknerova`. |
| Hosting | **Cloudflare Workers Static Assets** (ne Pages). Cloudflare je doporučuje pro nové projekty; Pages už nedostávají nové funkce. Jediná vědomá odchylka od `../akbrucknerova`. |
| Deploy | **Wrangler direct upload** přes `deploy.ps1` (build → `wrangler deploy`), stejně jako akbrucknerova. Není git-connected. |
| Dark mode | Ano, podle systému (`prefers-color-scheme`), bez přepínače. |
| Doména | Zatím `*.workers.dev`; vlastní doména lze přidat později v dashboardu. |

## Stack

- **Astro 5**, statický výstup (`output: 'static'`)
- **Tailwind 4** přes `@tailwindcss/vite`
- **TypeScript** (`astro/tsconfigs/strict`)
- `@fontsource-variable/inter`
- Dev tooling: `wrangler`, `vitest`, `@playwright/test`, `@astrojs/check`

`package.json` scripts (zrcadlí akbrucknerova): `dev`, `build`, `preview`, `check`,
`test:unit`, `test:e2e`.

Bez `@astrojs/sitemap` a bez OG / JSON-LD — web je osobní, SEO nás nezajímá.
`public/robots.txt` zakáže indexaci (`Disallow: /`).

## Datový model

Každý recept je soubor `src/content/recipes/<slug>.md`. Slug = název bez diakritiky,
malými písmeny, mezery → `-` (např. „Svíčková na smetaně" → `svickova-na-smetane`).

```markdown
---
title: Svíčková na smetaně
category: hlavni-jidla
tags: [maso, vikend]
servings: 4
time: 180
source: babička
---

## Suroviny
- 1 kg hovězí svíčkové
- ...

## Postup
1. ...

## Poznámky
...
```

Schéma v `src/content.config.ts` (Zod, glob loader nad `src/content/recipes/`):

| Pole | Typ | Povinné | Poznámka |
|------|-----|---------|----------|
| `title` | string | ano | |
| `category` | enum | ano | Klíč z `CATEGORIES` v `src/consts.ts`. |
| `tags` | string[] | ne | Default `[]`. Malými písmeny, bez diakritiky, kebab-case. |
| `servings` | number | ne | Kladné celé číslo. |
| `time` | number | ne | Celkový čas v minutách. |
| `source` | string | ne | Odkud recept je. |

- **Kategorie:** právě jedna na recept, pevný seznam v `src/consts.ts` jako
  `CATEGORIES` (klíč → český název + pořadí). Výchozí návrh: `polevky`,
  `hlavni-jidla`, `prilohy`, `salaty`, `dezerty`, `peceni`, `ostatni`. Finální seznam
  se doladí během převodu podle skutečného obsahu.
- **Štítky:** volné, recept jich může mít víc. Na web se zobrazují tak, jak jsou
  zapsané (bez mapování na hezčí názvy).
- **Tělo:** obyčejný Markdown. Sekce `## Suroviny` a `## Postup` jsou konvence, ne
  vynucená struktura; `## Poznámky` volitelná. Suroviny nejsou strukturovaná data
  (žádné množství/jednotka) — přepočet porcí je mimo rozsah.

## Stránky

| Route | Soubor | Obsah |
|-------|--------|-------|
| `/` | `src/pages/index.astro` | Vyhledávací pole + všechny recepty seskupené podle kategorií (v pořadí z `CATEGORIES`, recepty abecedně). |
| `/kategorie/<key>/` | `src/pages/kategorie/[category].astro` | Recepty jedné kategorie. Generuje se jen pro kategorie, které mají aspoň jeden recept. |
| `/stitek/<tag>/` | `src/pages/stitek/[tag].astro` | Recepty s daným štítkem. |
| `/recept/<slug>/` | `src/pages/recept/[slug].astro` | Detail receptu. |
| `/404` | `src/pages/404.astro` | Odkaz domů. |

**Detail receptu:** název, meta řádek (kategorie jako odkaz, čas, porce, zdroj),
štítky jako odkazy, pak vyrenderovaný Markdown. Mobile-first, jeden sloupec, větší
písmo. Na širokém displeji (`lg:`) suroviny vlevo (sticky) a postup vpravo — dělení
podle nadpisu `## Suroviny` v renderovaném HTML; když recept sekci Suroviny nemá,
zůstane jeden sloupec.

**Komponenty (`src/components/`):**

| Komponenta | Účel |
|-----------|------|
| `Header.astro` | Název webu (odkaz domů), odkazy na kategorie. |
| `RecipeList.astro` | Seznam receptů (název + kategorie/štítky), používaný na všech výpisových stránkách. |
| `Search.astro` | Vyhledávací pole + `<script>` island, filtruje `RecipeList` na úvodní stránce. |
| `TagList.astro` | Štítky jako odkazy. |

Layout `src/layouts/Base.astro`: `<html lang="cs">`, title, meta viewport,
`noindex`, font, globální CSS.

## Hledání

- Při buildu endpoint `src/pages/search-index.json.ts` vygeneruje JSON pole
  `{ slug, title, category, tags, text }`, kde `text` je obsah sekce Suroviny
  (prostý text bez Markdownu). Při ~50 receptech jednotky kB.
- `Search.astro` stáhne index při prvním fokusu pole a filtruje při psaní:
  každé slovo dotazu musí být obsaženo v `title + tags + text` (AND).
- **Normalizace** (dotaz i data): lowercase + odstranění diakritiky
  (`normalize('NFD')` + odstranění combining marks). „svickova" najde „Svíčková".
- Filtrování skrývá položky už vyrenderované v `RecipeList` (podle `data-slug`),
  prázdné kategorie skryje; při nulovém výsledku zobrazí „Nic nenalezeno".
- Logika normalizace a matchování žije v `src/lib/search.ts` (čisté funkce, testované
  unit testy), island ji importuje.
- Bez JS: pole se nezobrazí (vloží ho až skript), výpis receptů a navigace fungují.

## Převod z Google Docs

Jednorázový proces. Skripty v `scripts/migrate/`, pracovní data v `migration/`
(v `.gitignore`). Po dokončení převodu lze obojí smazat.

1. **Export (ručně, uživatel):** Google Docs → Soubor → Stáhnout → Markdown (`.md`)
   → uložit jako `migration/source.md`.
2. **Rozsekání (`scripts/migrate/split.ts`, spouští se přes `npx tsx`):**
   - Najde nadpisy dané úrovně (H1 nebo H2 — parametr `--level`, zjistí se
     z reálného exportu) a rozdělí dokument na kusy.
   - Obsah před prvním nadpisem receptu zahodí (a vypíše, co zahodil).
   - Každý kus uloží jako `migration/raw/<slug>.md` (slug přes sdílenou funkci
     `src/lib/slug.ts`). Při kolizi slugů přidá suffix `-2` a vypíše varování.
   - Na konci vypíše počet receptů a jejich seznam — uživatel porovná s dokumentem.
3. **Normalizace (Claude v konverzaci):** každý raw kus převede do formátu z kapitoly
   Datový model: doplní frontmatter, navrhne kategorii a štítky, rozdělí obsah do
   `## Suroviny` / `## Postup` / `## Poznámky`. **Text receptu se nepřepisuje**, jen
   strukturuje; co se nevejde do Surovin/Postupu, jde do Poznámek. Výsledek do
   `src/content/recipes/`.
4. **Revize (uživatel):** projde git diff nebo web přes `npm run dev`, opraví.

## Nasazení

- `wrangler.jsonc`:
  ```jsonc
  {
    "name": "cookbook",
    "compatibility_date": "<datum založení>",
    "assets": { "directory": "./dist", "not_found_handling": "404-page" }
  }
  ```
  Žádný Worker skript — čistě statické assety.
- `deploy.ps1`: `npm run build` (s kontrolou exit code) → `npx wrangler deploy`.
- `preview.ps1`: `npx wrangler dev` nad buildem.
- První nasazení vyžaduje `npx wrangler login` (interaktivně uživatel).

## Testy a CI

- **vitest** (`tests/unit/`):
  - `search.test.ts` — normalizace diakritiky, AND matching více slov, prázdný dotaz vrací vše.
  - `slug.test.ts` — diakritika, mezery, interpunkce, vícenásobné pomlčky.
  - `split.test.ts` — rozsekání ukázkového exportu (fixture) na správný počet kusů
    se správnými názvy, zahození úvodu, kolize slugů.
  - `content.test.ts` — každá `category` receptu existuje v `CATEGORIES`, slugy
    souborů jsou unikátní a odpovídají `slugify(title)`.
- **Validace obsahu:** Astro schéma při `build` / `check` — neplatný frontmatter
  build zastaví.
- **playwright** (`tests/e2e/smoke.spec.ts`): úvodní stránka se načte a obsahuje
  recepty; hledání „svickova" (bez diakritiky) zúží výpis; proklik na detail receptu;
  proklik na kategorii a štítek; viewport mobilu.
- **`.github/workflows/ci.yml`**: `npm ci` → `check` → `test:unit` →
  `playwright install chromium` → `test:e2e`. Na push do `main` a na PR (zrcadlí
  akbrucknerova). CI nenasazuje.

## Repo

- `git init`, výchozí větev `main`.
- `.gitignore`: `node_modules`, `dist`, `.astro`, `.wrangler`, `test-results`,
  `playwright-report`, `migration/`.
- `CLAUDE.md` a `README.md` popisující stack, příkazy, formát receptu a postup
  „jak přidat recept".
- Remote na GitHub přidá uživatel (není podmínkou pro deploy).

## Mimo rozsah (YAGNI)

- Fotky receptů.
- Přepočet porcí / strukturované suroviny.
- Režim vaření (wake lock, odškrtávání).
- Offline / PWA.
- Editace na webu, přihlašování, backend.
- SEO, sitemap, OG, analytika.
- Pagefind nebo jiná vyhledávací knihovna (zvážit až při stovkách receptů).
- Git-connected automatický deploy (lze zapnout později přes Workers Builds).
