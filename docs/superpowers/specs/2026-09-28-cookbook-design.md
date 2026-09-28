# Osobní kuchařka — statický web

**Datum:** 2026-09-28
**Stav:** Schváleno k plánování

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
Indexaci zakazuje jen `<meta name="robots" content="noindex">` v `Base.astro`.
`robots.txt` se **nepřidává** — `Disallow` by vyhledávačům zabránil stránku přečíst,
a tedy i uvidět `noindex`. (Nejde o přístupovou ochranu; web je veřejně dostupný.)

## Datový model

Každý recept je soubor `src/content/recipes/<slug>.md`. Slug je zároveň URL
(`/recept/<slug>/`) i jméno souboru, proto musí být bezpečný pro Windows i URL.

**Algoritmus `slugify(title)`** (`src/lib/slug.ts`, jediná implementace pro převod
i validaci):
1. `normalize('NFD')` a odstranění combining marks (diakritika pryč).
2. Lowercase.
3. Každá souvislá posloupnost znaků mimo `[a-z0-9]` → jedna `-`.
4. Oříznutí `-` na začátku a konci.
5. Prázdný výsledek → výjimka (recept bez použitelného názvu musí opravit člověk).
6. Rezervované jméno Windows → přidá se `-recept`.

Příklady: „Svíčková na smetaně" → `svickova-na-smetane`, „Omáčka: základní (2×)" →
`omacka-zakladni-2`. Výstup obsahuje jen `[a-z0-9-]`, takže nemůže obsahovat znak
nepovolený ve Windows. Rezervovaná jména Windows platí i s příponou (`con.md`), proto
slug `con`, `prn`, `aux`, `nul`, `com1`–`com9`, `lpt1`–`lpt9` dostane suffix `-recept`
(krok 6 algoritmu).

**Kolize:** pokud `<slug>.md` už existuje, použije se první volné `<slug>-2`,
`<slug>-3`… Název souboru je tedy `slugify(title)` nebo `slugify(title)-N` (N ≥ 2).

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

**Sekce Suroviny — kontrakt** (`src/lib/sections.ts`, `splitIngredients(markdown)`,
sdílí ho layout detailu i index hledání; pracuje nad zdrojovým Markdownem, ne nad
renderovaným HTML):
- Začátek: **první** nadpis úrovně 2, jehož text po trim a lowercase je přesně
  `suroviny`.
- Konec: následující nadpis úrovně 2 (jakýkoli), nebo konec dokumentu. Nadpisy
  `###` uvnitř (např. „Na těsto", „Na krém") patří do sekce.
- Funkce vrací `{ before, ingredients, after }` — tři kusy Markdownu, jejichž
  spojení je přesně původní tělo. Každý blok se tak vyrenderuje právě jednou, ve
  zdrojovém pořadí.
- Chybí-li sekce: `ingredients = null`, `before` = celé tělo.
- Druhý nadpis `## Suroviny` se nijak zvlášť neřeší — patří do `after`.
- Nadpisy uvnitř fenced code bloků se ignorují (v receptech nepravděpodobné, ale
  parser to nesmí rozbít).

## Stránky

| Route | Soubor | Obsah |
|-------|--------|-------|
| `/` | `src/pages/index.astro` | Vyhledávací pole + všechny recepty seskupené podle kategorií (v pořadí z `CATEGORIES`, recepty abecedně). |
| `/kategorie/<key>/` | `src/pages/kategorie/[category].astro` | Recepty jedné kategorie. Generuje se jen pro kategorie, které mají aspoň jeden recept. |
| `/stitek/<tag>/` | `src/pages/stitek/[tag].astro` | Recepty s daným štítkem. |
| `/recept/<slug>/` | `src/pages/recept/[slug].astro` | Detail receptu. |
| `/404` | `src/pages/404.astro` | Odkaz domů. |

**Detail receptu:** název, meta řádek (kategorie jako odkaz, čas, porce, zdroj),
štítky jako odkazy, pak obsah. Mobile-first, jeden sloupec, větší písmo. Obsah se
dělí přes `splitIngredients` (viz Datový model): `before` přes celou šířku, pak na
širokém displeji (`lg:`) dva sloupce — `ingredients` vlevo (sticky), `after` vpravo.
Na mobilu tytéž tři části pod sebou. Když `ingredients` je `null`, celé tělo je
jeden sloupec.

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

- Index se při buildu **vloží přímo do úvodní stránky** jako
  `<script type="application/json" id="search-index">` — žádný samostatný soubor,
  žádný síťový požadavek, tedy žádný stav „načítá se" ani „stažení selhalo".
  Při ~50 receptech jde o jednotky kB.
- Položka indexu: `{ slug, title, category, tags, text }`, kde `text` je
  `ingredients` ze `splitIngredients` převedený na prostý text (bez Markdown
  syntaxe); když recept sekci Suroviny nemá, je `text` celé tělo jako prostý text.
- `Search.astro` při psaní filtruje: každé slovo dotazu musí být obsaženo
  v `title + tags + text` (AND). Prázdný dotaz (po trim) zobrazí vše.
- Pokud `JSON.parse` indexu selže (chyba buildu), pole se nezobrazí a v konzoli
  je chyba — výpis receptů funguje dál.
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
     `src/lib/slug.ts`). Při kolizi použije první volný suffix `-2`, `-3`… (viz
     Datový model) a vypíše varování. Nadpis, ze kterého vyjde prázdný slug, skript
     vypíše jako chybu a přeskočí ho.
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
  - `slug.test.ts` — diakritika, mezery, interpunkce (`:`, `/`, `(`, `×`) →
    jedna pomlčka, oříznutí krajních pomlček, prázdný výsledek → výjimka,
    rezervovaná jména Windows → `-recept`.
  - `sections.test.ts` — `splitIngredients`: sekce uprostřed, na konci, chybějící,
    s `###` podnadpisy, dvojí `## Suroviny`, nadpis v code bloku; vždy platí
    `before + ingredients + after === body`.
  - `split.test.ts` — rozsekání ukázkového exportu (fixture) na správný počet kusů
    se správnými názvy, zahození úvodu, kolize slugů včetně situace, kdy `-2`
    už existuje.
  - `content.test.ts` — každá `category` receptu existuje v `CATEGORIES`; název
    každého souboru je `slugify(title)` nebo `slugify(title)-N` (N ≥ 2).
    Unikátnost zaručuje souborový systém.
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
