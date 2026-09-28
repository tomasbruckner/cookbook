# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Osobní kuchařka — statický web z Markdown receptů. Astro 7 + Tailwind 4, TypeScript,
**jen česky**, statický výstup, nasazeno na Cloudflare Workers Static Assets.
Spec: `docs/superpowers/specs/2026-09-28-cookbook-design.md`.

## Commands

    npm run dev          # dev server (http://localhost:4321)
    npm run build        # static build -> dist/
    npm run preview      # serve built output
    npm run check        # astro type check
    npm run test:unit    # vitest
    npm run test:e2e     # playwright (auto build+preview, desktop + mobile)
    npm run migrate:split  # rozseká migration/source.md -> migration/raw/

Single unit test: `npx vitest run tests/unit/search.test.ts`
Single e2e test: `npx playwright test -g "search without diacritics" --project=desktop`

## Architecture

- **Recepty** jsou `src/content/recipes/<slug>.md`, kolekce `recipes` v
  `src/content.config.ts` (zod schéma: `title`, `category`, `tags`, `servings?`,
  `time?`, `source?`). Id záznamu = jméno souboru.
- **Kategorie** jsou pevný seznam `CATEGORIES` v `src/consts.ts` (pořadí = pořadí na webu).
- **Logika v `src/lib/`** (čisté funkce, unit testy): `slug.ts` (slugify pro soubory i URL),
  `sections.ts` (`splitIngredients` — dělení těla podle `## Ingredience`), `plaintext.ts`,
  `search.ts` (normalizace bez diakritiky, AND matching), `recipes.ts` (řazení cs, skupiny),
  `format.ts`. `.astro` soubory jen skládají markup.
- **Detail receptu** renderuje tělo po třech částech přes `marked` (`before` / `ingredients`
  / `after`), na `lg:` ingredience vlevo sticky.
- **Hledání**: index se vkládá do úvodní stránky jako `<script type="application/json"
  id="search-index">`; island v `Search.astro` skrývá `[data-slug]` položky a prázdné
  `[data-group]` sekce. Bez JS je pole skryté a výpis funguje.
- **Zero-JS jinak.** Dark mode jen přes `prefers-color-scheme`.
- **Noindex**: `<meta name="robots" content="noindex">` v `Base.astro`; úmyslně žádný robots.txt.

## Conventions

- Nový recept: soubor `src/content/recipes/<slugify(title)>.md` (viz `src/lib/slug.ts`;
  při shodě názvů `-2`, `-3`…). `tests/unit/content.test.ts` hlídá jméno souboru i kategorii.
- Tělo receptu: volitelný úvod (odkazy na zdroj), `## Ingredience`, `## Postup`,
  volitelně `## Poznámky`. Skupiny jako `### Knedlík` uvnitř sekcí.
- Štítky kebab-case bez diakritiky (vynucuje schéma). Kuchyně jako štítek (`cinska`, `italska`…).
- `migration/` je gitignored (obsahuje export z Google Docs) — nikdy necommitovat.
- `package.json` obsahuje blok `allowScripts` — npm vyžaduje schválení install skriptů
  nativních balíčků `esbuild`/`workerd`; po jejich upgradu je znovu schval příkazem
  `npm install-scripts approve`.

## Deploy

Cloudflare **Workers Static Assets** (ne Pages) přes **Wrangler direct upload** — `./deploy.ps1`
(build → `wrangler deploy`). NOT git-connected: push do `main` nenasazuje. `./preview.ps1`
spustí `wrangler dev` nad buildem. CI (`.github/workflows/ci.yml`) jen testuje.
